import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function authenticateAPIRequest(req, requiredUserType = null) {
    try {
        console.log('🔧 Auth: Starting authentication for user type:', requiredUserType);
        
        // Get authorization header
        const authHeader = req.headers.get('authorization')
        const userToken = req.headers.get('x-user-token')
        
        console.log('🔧 Auth: Headers received:', {
            authorization: authHeader ? 'present' : 'missing',
            userToken: userToken ? 'present' : 'missing'
        });
        
        // Check for user token in header (for client-side requests)
        if (userToken) {
            try {
                console.log('🔧 Auth: Parsing user token...');
                const userData = JSON.parse(userToken)
                console.log('🔧 Auth: Parsed user data:', userData);
                
                if (userData.user_id && userData.user_type) {
                    // Validate user type if required
                    if (requiredUserType) {
                        // Special handling for bank portal - allow both bank_user and bank_employee
                        if (requiredUserType === 'bank_user' && 
                            (userData.user_type === 'bank_user' || userData.user_type === 'bank_employee')) {
                            console.log('🔧 Auth: Bank access granted for:', userData.user_type);
                        } else if (userData.user_type !== requiredUserType) {
                            console.log('🔧 Auth: User type mismatch:', userData.user_type, '!=', requiredUserType);
                            return { 
                                success: false, 
                                error: `Access denied. Required user type: ${requiredUserType}`,
                                status: 403 
                            }
                        }
                    }
                    console.log('🔧 Auth: Authentication successful with user token');
                    return { success: true, user: userData }
                } else {
                    console.log('🔧 Auth: Invalid user data structure');
                }
            } catch (error) {
                console.error('🔧 Auth: Error parsing user token:', error)
            }
        }
        
        // Check for Bearer token (JWT authentication for all users)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            
            try {
                // Import JWT utility for verification
                const JWTUtils = (await import('./jwt-utils.js')).default
                
                // Verify JWT token
                const verificationResult = JWTUtils.verifyToken(token)
                
                if (!verificationResult.valid) {
                    return { 
                        success: false, 
                        error: 'Invalid JWT token',
                        status: 401 
                    }
                }
                
                const decoded = verificationResult.payload
                
                // Check if it's an admin user
                if (decoded.user_type === 'admin_user') {
                    // For admin users, validate JWT token (no database query needed)
                    return { 
                        success: true, 
                        user: { 
                            admin_id: decoded.admin_id,
                            email: decoded.email,
                            full_name: decoded.full_name,
                            role: decoded.role,
                            permissions: decoded.permissions,
                            user_type: 'admin_user'
                        } 
                    }
                } else {
                    // Regular user - verify in users table
                    const client = await pool.connectWithRetry()
                    try {
                        const result = await client.query(
                            'SELECT user_id, email, user_type, account_status FROM users WHERE user_id = $1 AND account_status = $2',
                            [decoded.user_id, 'active']
                        )
                        
                        if (result.rows.length === 0) {
                            return { 
                                success: false, 
                                error: 'User not found or inactive',
                                status: 401 
                            }
                        }
                        
                        const user = result.rows[0]
                        return { success: true, user }
                    } finally {
                        client.release()
                    }
                }
            } catch (error) {
                console.error('JWT token verification error:', error)
                return { 
                    success: false, 
                    error: 'Invalid JWT token',
                    status: 401 
                }
            }
        }
        
        // Check for user token in cookies (for regular user authentication)
        const userTokenCookie = req.cookies?.get('user_token')?.value
        if (userTokenCookie) {
            try {
                // Import JWT utility for verification
                const JWTUtils = (await import('./jwt-utils.js')).default
                
                // Verify JWT token
                const verificationResult = JWTUtils.verifyToken(userTokenCookie)
                
                if (!verificationResult.valid) {
                    return { 
                        success: false, 
                        error: 'Invalid user token',
                        status: 401 
                    }
                }
                
                const decoded = verificationResult.payload
                
                // Regular user - verify in users table
                const client = await pool.connectWithRetry()
                try {
                    const result = await client.query(
                        'SELECT user_id, email, user_type, account_status FROM users WHERE user_id = $1 AND account_status = $2',
                        [decoded.user_id, 'active']
                    )
                    
                    if (result.rows.length === 0) {
                        return { 
                            success: false, 
                            error: 'User not found or inactive',
                            status: 401 
                        }
                    }
                    
                    const user = result.rows[0]
                    
                    // Validate user type if required
                    if (requiredUserType) {
                        // Special handling for bank portal - allow both bank_user and bank_employee
                        if (requiredUserType === 'bank_user' && 
                            (user.user_type === 'bank_user' || user.user_type === 'bank_employee')) {
                            console.log('🔧 Auth: Bank access granted for:', user.user_type);
                        } else if (user.user_type !== requiredUserType) {
                            return { 
                                success: false, 
                                error: `Access denied. Required user type: ${requiredUserType}`,
                                status: 403 
                            }
                        }
                    }
                    
                    return { success: true, user }
                } finally {
                    client.release()
                }
            } catch (error) {
                console.error('User token verification error:', error)
                return { 
                    success: false, 
                    error: 'Invalid user token',
                    status: 401 
                }
            }
        }
        
        // Check for admin token in cookies (for admin routes)
        const adminToken = req.cookies?.get('admin_token')?.value
        if (adminToken) {
            try {
                // Import JWT utility for verification
                const JWTUtils = (await import('./jwt-utils.js')).default
                
                // Verify JWT token (no database query needed)
                const verificationResult = JWTUtils.verifyToken(adminToken)
                
                if (!verificationResult.valid) {
                    return { 
                        success: false, 
                        error: 'Invalid admin token',
                        status: 401 
                    }
                }
                
                const decoded = verificationResult.payload
                
                if (decoded.user_type !== 'admin_user') {
                    return { 
                        success: false, 
                        error: 'Invalid admin token',
                        status: 401 
                    }
                }
                
                return { 
                    success: true, 
                    user: { 
                        admin_id: decoded.admin_id,
                        email: decoded.email,
                        full_name: decoded.full_name,
                        role: decoded.role,
                        permissions: decoded.permissions,
                        user_type: 'admin_user'
                    } 
                }
            } catch (error) {
                console.error('Admin token verification error:', error)
                return { 
                    success: false, 
                    error: 'Invalid admin token',
                    status: 401 
                }
            }
        }
        
        // Check for user ID in headers (fallback for existing API calls)
        const userId = req.headers.get('x-user-id')
        if (userId) {
            return await pool.withConnection(async (client) => {
                const result = await client.query(
                    'SELECT user_id, email, user_type FROM users WHERE user_id = $1',
                    [userId]
                )
                
                if (result.rows.length > 0) {
                    const user = result.rows[0]
                    if (requiredUserType && user.user_type !== requiredUserType) {
                        return { 
                            success: false, 
                            error: `Access denied. Required user type: ${requiredUserType}`,
                            status: 403 
                        }
                    }
                    return { success: true, user }
                }
                
                return { 
                    success: false, 
                    error: 'Authentication required',
                    status: 401 
                }
            })
        }
        
        return { 
            success: false, 
            error: 'Authentication required',
            status: 401 
        }
        
    } catch (error) {
        console.error('Authentication error:', error)
        return { 
            success: false, 
            error: 'Authentication failed',
            status: 500 
        }
    }
}

export function requireAuth(requiredUserType = null) {
    return async (req) => {
        const authResult = await authenticateAPIRequest(req, requiredUserType)
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status || 401 }
            )
        }
        return authResult.user
    }
}