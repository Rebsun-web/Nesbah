import { NextResponse } from 'next/server'

export async function POST(req) {
    try {
        // Create response
        const response = NextResponse.json({
            success: true,
            message: 'Admin logged out successfully'
        })

        // Clear admin token cookie
        response.cookies.set('admin_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(0), // Expire immediately
            path: '/'
        })

        console.log('🔧 Admin logout: JWT cookie cleared')
        return response

    } catch (error) {
        console.error('Admin logout error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
