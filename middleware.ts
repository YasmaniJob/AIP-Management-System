import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname;
  
  // Allow access to API routes, static files, and server actions
  if (pathname.startsWith('/api') || pathname.startsWith('/_next/') || pathname.includes('/_next/static/')) {
    return response
  }
  
  // Skip middleware for server actions (POST requests to the same route)
  if (request.method === 'POST') {
    return response
  }
  
  // Allow access to auth pages (let them handle their own logic)
  if (pathname === '/' || pathname.startsWith('/register') || pathname.startsWith('/login')) {
    return response
  }
  
  // Check for protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/inventario', '/prestamos', '/reservas', '/reuniones', '/docentes', '/configuracion'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    try {
       // Check if user has a valid cookie first
       const userIdCookie = request.cookies.get('user_id')?.value;
       
       if (!userIdCookie) {
         return NextResponse.redirect(new URL('/', request.url));
       }
       
       // Verify user exists in database using the cookie
       const { data: userData, error: dbError } = await supabase
         .from('users')
         .select('id, email')
         .eq('id', userIdCookie)
         .single();
       
       if (dbError || !userData) {
         // Clear invalid cookie and redirect
         response.cookies.set('user_id', '', { maxAge: 0 });
         return NextResponse.redirect(new URL('/', request.url));
       }
      
      // Check if user has a valid email (not null and not a temporary email)
      if (!userData.email || userData.email.endsWith('@temporal.local')) {
        // Redirect to a profile completion page or show a message
        const profileUrl = new URL('/profile/complete-email', request.url);
        profileUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(profileUrl);
      }
      
    } catch (error) {
      console.error('Middleware error:', error);
      // Clear cookies on error and redirect
      response.cookies.set('user_id', '', { maxAge: 0 });
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}