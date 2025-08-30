
import { createClient } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove once you have Supabase connected.
    const { supabase, response } = createClient(request)

    const { data: { session } } = await supabase.auth.getSession();

    const { data: { user } } = await supabase.auth.getUser();

    const publicUrls = ['/login', '/signup', '/auth/callback'];

    // if user is not signed in and the current path is not public
    // redirect the user to the login page
    if (!session && !publicUrls.includes(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // if user is signed in and the current path is /profile/setup, but they already have a username
    // redirect them to the home page
    if (session && request.nextUrl.pathname === '/profile/setup') {
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
      if (profile?.username) {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }
    
    // if user is signed in and doesn't have a username, and is not on the setup page,
    // redirect them to the setup page
    if (session && !publicUrls.includes(request.nextUrl.pathname) && request.nextUrl.pathname !== '/profile/setup') {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
        if (!profile?.username) {
            return NextResponse.redirect(new URL('/profile/setup', request.url))
        }
    }


    return response
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
