
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback values in case environment variables are not picked up in the preview environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://upegjqsrbxydplidsoan.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZWdqcXNyYnh5ZHBsaWRzb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODk4MjAsImV4cCI6MjEwMjk2NTgyMH0.o3GZO9LDahABIgAxjt4vCVjUxjWM4legsoIH2lQFQnc';

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      db: {
        schema: 'public',
      }
    }
  )
}
