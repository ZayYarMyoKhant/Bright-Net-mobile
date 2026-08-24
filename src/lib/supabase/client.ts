
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use the correct project URL and provided API key
  const supabaseUrl = 'https://upegjqsrbxydplidsoan.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZWdqcXNyYnh5ZHBsaWRzb2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODk4MjAsImV4cCI6MjEwMjk2NTgyMH0.o3GZO9LDahABIgAxjt4vCVjUxjWM4legsoIH2lQFQnc';

  console.log("Initializing Supabase Client with URL:", supabaseUrl);

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
