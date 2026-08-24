
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  const supabaseUrl = 'https://upegjqsrbxydplidsoan.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZWdqcXNyYnh5ZHBsaWRzb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODk4MjAsImV4cCI6MjEwMjk2NTgyMH0.o3GZO9LDahABIgAxjt4vCVjUxjWM4legsoIH2lQFQnc';

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
            // Handle set in server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle delete in server components
          }
        },
      },
    }
  )
}
