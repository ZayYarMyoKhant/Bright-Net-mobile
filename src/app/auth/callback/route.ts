
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Authentication is successful. The middleware will now handle
      // redirecting the user to the correct page (profile setup or home).
      // So, we can just redirect to a neutral page like home, and middleware will intercept.
      return NextResponse.redirect(`${origin}/home`);
    }
  }

  // return the user to an error page with instructions
  console.error('Auth code error or other error during callback');
  return NextResponse.redirect(`${origin}/login`);
}
