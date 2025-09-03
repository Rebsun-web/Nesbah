import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value
        
        console.log('🔍 Validation endpoint: All cookies received:', req.cookies.getAll())
        console.log('🔍 Validation endpoint: Admin token found:', adminToken ? 'Yes' : 'No')
        console.log('🔍 Validation endpoint: Admin token length:', adminToken ? adminToken.length : 0)
        
        if (!adminToken) {
            console.log('❌ Validation endpoint: No admin token found')
            return NextResponse.json({ 
                success: false, 
                error: 'No admin token found' 
            }, { status: 401 })
        }

        // Validate admin session using AdminAuth
        console.log('🔍 Validation endpoint: Validating admin session...')
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken)
        console.log('🔍 Validation endpoint: Session validation result:', sessionValidation)
        
        if (!sessionValidation.valid) {
            console.log('❌ Validation endpoint: Invalid session:', sessionValidation.error)
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 })
        }

        // Return admin user data
        console.log('✅ Validation endpoint: Session valid, returning admin user')
        return NextResponse.json({
            success: true,
            adminUser: {
                user_id: sessionValidation.adminUser.user_id,
                admin_id: sessionValidation.adminUser.user_id, // For backward compatibility
                email: sessionValidation.adminUser.email,
                full_name: sessionValidation.adminUser.full_name,
                entity_name: sessionValidation.adminUser.entity_name,
                role: sessionValidation.adminUser.role,
                permissions: sessionValidation.adminUser.permissions,
                is_active: sessionValidation.adminUser.is_active,
                user_type: 'admin_user'
            }
        })
        
    } catch (error) {
        console.error('❌ Validation endpoint: Error during validation:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to validate admin token' },
            { status: 500 }
        )
    }
}
