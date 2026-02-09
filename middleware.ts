import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public routes - no auth required
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback'];

// Routes exempt from onboarding check
const ONBOARDING_EXEMPT = ['/onboarding', '/api/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }
  
  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If Supabase not configured, redirect to login for protected routes
  if (!supabaseUrl || !supabaseKey) {
    const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
    if (!isPublic) {
      console.warn('[Middleware] Supabase not configured, redirecting to /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
  
  let response = NextResponse.next({
    request: { headers: request.headers },
  });
  
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  
  // Get user - this also refreshes the session
  const { data: { user } } = await supabase.auth.getUser();
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r));
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 1: No user + protected route → LOGIN
  // ═══════════════════════════════════════════════════════════════════════════
  if (!user && !isPublicRoute) {
    console.log(`[Middleware] No session, redirecting ${pathname} → /login`);
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 2: User + public route (except callback) → Check onboarding then home
  // ═══════════════════════════════════════════════════════════════════════════
  if (user && isPublicRoute && pathname !== '/auth/callback') {
    console.log(`[Middleware] User on public route ${pathname}, checking profile...`);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();
    
    // Profile doesn't exist or error → needs onboarding
    if (error || !profile) {
      console.log('[Middleware] No profile found, → /onboarding');
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    
    // Onboarding not complete → onboarding
    if (!profile.onboarding_completed) {
      console.log('[Middleware] Onboarding incomplete, → /onboarding');
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    
    // All good → dashboard
    console.log('[Middleware] Onboarding complete, → /');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RULE 3: User + protected route → Must have completed onboarding
  // ═══════════════════════════════════════════════════════════════════════════
  if (user && !isPublicRoute) {
    const isExempt = ONBOARDING_EXEMPT.some(r => pathname.startsWith(r));
    
    if (!isExempt) {
      console.log(`[Middleware] Checking onboarding for ${pathname}...`);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      
      // No profile or error → needs onboarding (FAIL CLOSED)
      if (error || !profile) {
        console.log('[Middleware] Profile check failed, → /onboarding');
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      
      // Onboarding not complete
      if (!profile.onboarding_completed) {
        console.log('[Middleware] Onboarding required, → /onboarding');
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      
      console.log('[Middleware] Access granted to', pathname);
    }
  }
  
  return response;
}

export const config = {
  // Run on all routes except _next, static assets, and favicon
  matcher: ['/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
};
