// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Initialize the Supabase server client and sync cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Fetch the active session from the synchronized cookies
  const { data: { user } } = await supabase.auth.getUser();

  // Define route groups for access control
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') || 
                     request.nextUrl.pathname.startsWith('/forgot-password') || 
                     request.nextUrl.pathname.startsWith('/reset-password');
  
  const isProtectedRoute = 
    request.nextUrl.pathname === '/' || 
    request.nextUrl.pathname.startsWith('/ops-admin') || 
    request.nextUrl.pathname.startsWith('/sales-crm') ||
    request.nextUrl.pathname.startsWith('/client');

  // Security Gate: Redirect unauthenticated users trying to access secure portals
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // UX Gate: Redirect authenticated users away from public auth pages to the central dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Exclude static files and Next.js internals from middleware execution
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};