
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  // Hardcoded fallbacks to ensure server-side connectivity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://upegjqsrbxydplidsoan.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZWdqcXNyYnh5ZHBsaWRzb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODk4MjAsImV4cCI6MjEwMjk2NTgyMH0.o3GZO9LDahABIgAxjt4vCVjUxjWM4legsoIH2lQFQnc';

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
          }
        },
      },
    }
  )
}
