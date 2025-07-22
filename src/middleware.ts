import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.next()
    
    // Auth protection for protected routes
    const protectedPaths = ['/dashboard', '/admin', '/api/clients', '/api/audits', '/api/reports']
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isProtectedPath) {
      // Only check auth for protected paths and only if we have the required env vars
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
              },
            },
          }
        )
        
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session) {
            const redirectUrl = new URL('/auth/login', request.url)
            redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
          }
        } catch (authError) {
          // If auth check fails, redirect to login
          const redirectUrl = new URL('/auth/login', request.url)
          redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
      }
    }

    // Basic security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
  } catch (error) {
    // If middleware fails, just pass through the request
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png (logo file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
} 