
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
       // On successful sign in, always redirect to home.
       // The middleware will handle redirecting to /profile/setup if needed.
      return NextResponse.redirect(`${origin}/home`);
    }
  }

  // return the user to an error page with instructions
  console.error('Auth code error or other error during callback');
  return NextResponse.redirect(`${origin}/login`);
}
