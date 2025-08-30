
import { createClient } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove once you have Supabase connected.
    const { supabase, response } = createClient(request)

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    const { data: { session } } = await supabase.auth.getSession();

    const { pathname } = request.nextUrl;

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/auth/callback'];

    // If the user is not logged in and is trying to access a protected route
    if (!session && !publicRoutes.includes(pathname) && pathname !== '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If the user is logged in
    if (session) {
        // If they try to access login or signup, redirect to home
        if (pathname === '/login' || pathname === '/signup') {
            return NextResponse.redirect(new URL('/home', request.url));
        }

        // Check if the user has completed profile setup
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

        // If profile is not complete and they are not on the setup page, redirect them
        if ((!profile || !profile.username) && pathname !== '/profile/setup') {
            return NextResponse.redirect(new URL('/profile/setup', request.url));
        }

        // If profile is complete and they try to access the setup page, redirect to home
        if (profile && profile.username && pathname === '/profile/setup') {
            return NextResponse.redirect(new URL('/home', request.url));
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
     * - / (the splash page)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|).*)',
  ],
}
