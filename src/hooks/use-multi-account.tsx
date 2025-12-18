
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback, useMemo, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/data';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const SESSIONS_STORAGE_KEY = 'supabase-multi-account-sessions';

export type StoredAccount = {
  id: string;
  username: string;
  avatar_url: string;
  full_name: string;
  session: Session;
};

interface MultiAccountContextType {
  accounts: StoredAccount[];
  currentAccount: StoredAccount | null;
  isLoading: boolean;
  addOrSwitchAccount: (session: Session) => Promise<void>;
  switchAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => Promise<void>;
}

export const MultiAccountContext = createContext<MultiAccountContextType | null>(null);

async function fetchUserProfile(supabase: ReturnType<typeof createClient>, user: User): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .eq('id', user.id)
    .single();
  if (error) {
    console.error('Failed to fetch profile for multi-account management:', error);
    return null;
  }
  return profile as Profile;
}

export const MultiAccountProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<StoredAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const loadAccountsFromStorage = useCallback(() => {
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      const parsedAccounts: StoredAccount[] = storedSessions ? JSON.parse(storedSessions) : [];
      setAccounts(parsedAccounts);
      return parsedAccounts;
    } catch (e) {
      console.error("Failed to parse stored accounts", e);
      return [];
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const storedAccounts = loadAccountsFromStorage();
      
      const { data: { session: activeSupabaseSession } } = await supabase.auth.getSession();

      if (activeSupabaseSession) {
        const currentInList = storedAccounts.find(acc => acc.id === activeSupabaseSession.user.id);
        if (currentInList) {
            setCurrentAccount(currentInList);
        } else {
            // The active session is not in our managed list, so add it.
            await addOrSwitchAccount(activeSupabaseSession);
        }
      } else if (storedAccounts.length > 0) {
        // No active session, but we have stored ones. Let's activate the first one.
        await switchAccount(storedAccounts[0].id, storedAccounts);
      }
      setIsLoading(false);
    };
    initialize();
  }, [supabase]);

  const saveAccountsToStorage = (updatedAccounts: StoredAccount[]) => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    setAccounts(updatedAccounts);
  };

  const addOrSwitchAccount = async (session: Session) => {
    if (!session.user) return;
    const profile = await fetchUserProfile(supabase, session.user);
    if (!profile) return;

    const newAccount: StoredAccount = {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      full_name: profile.full_name || profile.username,
      session: session,
    };
    
    let updatedAccounts = [...accounts];
    const existingAccountIndex = updatedAccounts.findIndex(acc => acc.id === newAccount.id);

    if (existingAccountIndex > -1) {
      updatedAccounts[existingAccountIndex] = newAccount;
    } else {
      updatedAccounts.push(newAccount);
    }
    
    saveAccountsToStorage(updatedAccounts);
    await switchAccount(newAccount.id, updatedAccounts);
  };

  const switchAccount = async (userId: string, currentAccounts?: StoredAccount[]) => {
    const accountsToUse = currentAccounts || accounts;
    const accountToSwitch = accountsToUse.find(acc => acc.id === userId);

    if (accountToSwitch) {
      const { error } = await supabase.auth.setSession(accountToSwitch.session);
      if (error) {
        console.error("Failed to switch session:", error);
        // Maybe the session is expired, try to remove it
        await removeAccount(userId);
      } else {
        setCurrentAccount(accountToSwitch);
      }
    }
  };

  const removeAccount = async (userId: string) => {
    const updatedAccounts = accounts.filter(acc => acc.id !== userId);
    saveAccountsToStorage(updatedAccounts);

    if (currentAccount?.id === userId) {
      // The current account was removed, switch to another one or sign out
      if (updatedAccounts.length > 0) {
        await switchAccount(updatedAccounts[0].id, updatedAccounts);
      } else {
        await supabase.auth.signOut();
        setCurrentAccount(null);
        router.push('/signup');
      }
    }
  };

  const contextValue = useMemo(() => ({
    accounts,
    currentAccount,
    isLoading,
    addOrSwitchAccount,
    switchAccount,
    removeAccount,
  }), [accounts, currentAccount, isLoading, addOrSwitchAccount, switchAccount, removeAccount]);

  return (
    <MultiAccountContext.Provider value={contextValue}>
      {children}
    </MultiAccountContext.Provider>
  );
};
