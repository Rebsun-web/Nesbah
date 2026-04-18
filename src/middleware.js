import { NextResponse } from 'next/server'

/**
 * Decode a JWT payload without verifying the signature.
 * Signature verification happens in API routes via jwt-utils.js.
 * Here we only need the user_type and exp fields for routing decisions.
 */
function decodeJWTPayload(token) {
  try {
    const base64Payload = token.split('.')[1]
    if (!base64Payload) return null
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isExpired(payload) {
  if (!payload?.exp) return true
  return payload.exp < Math.floor(Date.now() / 1000)
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  const userToken = request.cookies.get('user_token')?.value
  const adminToken = request.cookies.get('admin_token')?.value

  const userPayload = userToken ? decodeJWTPayload(userToken) : null
  const adminPayload = adminToken ? decodeJWTPayload(adminToken) : null

  const isValidUser = userPayload && !isExpired(userPayload)
  const isValidAdmin =
    adminPayload &&
    !isExpired(adminPayload) &&
    adminPayload.user_type === 'admin_user'

  const userType = isValidUser ? userPayload.user_type : null

  // ── Admin routes ────────────────────────────────────────────────────────────
  // /admin/login is public so the admin can actually log in
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isValidAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Bank portal ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/bankPortal')) {
    const isBankRole = userType === 'bank_user' || userType === 'bank_employee'
    if (!isValidUser || !isBankRole) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Business portal ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/portal')) {
    if (!isValidUser || userType !== 'business_user') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Admin-only public-facing pages ───────────────────────────────────────────
  const isAdminOnlyPage =
    pathname === '/register' ||
    pathname === '/forgotPassword' ||
    pathname.startsWith('/setNewPassword/')

  if (isAdminOnlyPage) {
    if (!isValidAdmin) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/bankPortal/:path*',
    '/portal/:path*',
    '/login',
    '/register',
    '/forgotPassword',
    '/setNewPassword/:path*',
  ],
}
