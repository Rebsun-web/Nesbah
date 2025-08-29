import { NextResponse } from 'next/server'

// Define protected routes and their required user types
const protectedRoutes = {
  '/portal': 'business_user',
  '/portal/offers': 'business_user',
  '/bankPortal': 'bank_user',
  '/bankPortal/bankLeads': 'bank_user',
  '/bankPortal/bankHistory': 'bank_user',
  '/admin': 'admin_user',
  '/admin/analytics': 'admin_user',
  '/admin/applications': 'admin_user',
  '/admin/debug': 'admin_user',
  '/admin/debug-cache': 'admin_user',
  '/admin/test-cache': 'admin_user',
  '/admin/test-cache-simple': 'admin_user',
  '/admin/direct-login': 'admin_user',
  '/leads': 'bank_user',
  '/offers': 'bank_user'
}

// Define public routes that don't need authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgotPassword',
  '/setNewPassword',
  '/api'
]

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Skip middleware for API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Check if the route requires authentication
  const requiredUserType = getRequiredUserType(pathname)
  
  if (requiredUserType) {
    // Check for authentication tokens
    const userToken = request.cookies.get('user_token')?.value
    const adminToken = request.cookies.get('admin_token')?.value
    
    if (!userToken && !adminToken) {
      // No authentication tokens found, redirect to login
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    // Validate user type based on token
    if (requiredUserType === 'admin_user' && !adminToken) {
      // Admin route but no admin token
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    if (requiredUserType !== 'admin_user' && !userToken) {
      // Non-admin route but no user token
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

function getRequiredUserType(pathname) {
  // Check exact matches first
  if (protectedRoutes[pathname]) {
    return protectedRoutes[pathname]
  }
  
  // Check for dynamic routes
  if (pathname.startsWith('/leads/')) {
    return 'bank_user'
  }
  
  if (pathname.startsWith('/offers/')) {
    return 'bank_user'
  }
  
  if (pathname.startsWith('/admin/')) {
    return 'admin_user'
  }
  
  if (pathname.startsWith('/portal/')) {
    return 'business_user'
  }
  
  if (pathname.startsWith('/bankPortal/')) {
    return 'bank_user'
  }
  
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
