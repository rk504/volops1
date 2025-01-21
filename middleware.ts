import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()

    // Create server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            res.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    console.log('Middleware: Checking auth for path:', req.nextUrl.pathname)

    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('Middleware: Auth check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      error: error?.message,
      cookies: req.cookies.getAll().map(c => c.name)
    })

    // If no session and trying to access protected route, return 401
    if (!session && req.nextUrl.pathname.match(/^\/api\/events\/.*\/(register|deregister)/)) {
      console.log('Middleware: No session found for protected route')
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error in auth middleware' },
      { status: 500 }
    )
  }
}

// Add routes that need authentication
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/api/events/:path*/register',
    '/api/events/:path*/deregister',
    '/api/events/:path*/toggle'
  ]
} 