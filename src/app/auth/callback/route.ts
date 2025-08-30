
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
       // Check if profile exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        // If the user has no username, they are a new user. Redirect to profile setup.
        if (!profile?.username) {
           return NextResponse.redirect(`${origin}/profile/setup`);
        }
      }
      // For existing users with a profile, redirect to home.
      return NextResponse.redirect(`${origin}/home`);
    }
  }

  // return the user to an error page with instructions
  console.error('Auth code error or other error');
  return NextResponse.redirect(`${origin}/login`);
}
