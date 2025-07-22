import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.next()
    
    // Temporarily disable middleware auth checks - let page-level protection handle it
    // This avoids cookie/session issues in middleware that can cause redirect loops
    
    // Auth protection for API routes only (not dashboard pages)
    const protectedApiPaths = ['/api/clients', '/api/audits', '/api/reports', '/api/admin']
    const isProtectedApiPath = protectedApiPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isProtectedApiPath) {
      // Only check auth for protected API routes
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
            return new NextResponse(
              JSON.stringify({ error: 'Unauthorized' }),
              { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          }
        } catch (authError) {
          return new NextResponse(
            JSON.stringify({ error: 'Unauthorized' }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          )
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