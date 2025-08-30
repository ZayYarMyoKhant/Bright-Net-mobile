
import { createClient } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)
    const { data: { session } } = await supabase.auth.getSession()

    const publicUrls = ['/login', '/signup', '/auth/callback'];
    const requestedUrl = request.nextUrl.pathname;

    // If user is logged in
    if (session) {
      // and tries to access login or signup, redirect to home
      if (requestedUrl === '/login' || requestedUrl === '/signup') {
        return NextResponse.redirect(new URL('/home', request.url));
      }

      // and has no username and is not on the setup page, redirect to setup page
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
        
      if (!profile?.username && requestedUrl !== '/profile/setup') {
        return NextResponse.redirect(new URL('/profile/setup', request.url));
      }
      
      // and HAS a username but tries to access setup page, redirect to home
      if (profile?.username && requestedUrl === '/profile/setup') {
          return NextResponse.redirect(new URL('/home', request.url));
      }

    } else { // If user is not logged in
      // and tries to access a protected route, redirect to login
      if (!publicUrls.includes(requestedUrl)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return response;
  } catch (e) {
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
