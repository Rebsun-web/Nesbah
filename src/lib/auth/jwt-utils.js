import jwt from 'jsonwebtoken'

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables!');
    console.warn('⚠️  Using default secret - CHANGE THIS IN PRODUCTION!');
    console.warn('⚠️  Set JWT_SECRET in your .env file with a secure random string');
    return 'your-super-secret-jwt-key-change-in-production-this-should-be-at-least-64-characters-long';
})();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'nesbah-app';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'nesbah-users';

export class JWTUtils {
    // Generate JWT token for any user type
    static generateToken(userData) {
        const payload = {
            user_id: userData.user_id || userData.admin_id,
            email: userData.email,
            user_type: userData.user_type || 'admin_user',
            role: userData.role, // For admin users
            permissions: userData.permissions, // For admin users
            iat: Math.floor(Date.now() / 1000), // Issued at
            iss: JWT_ISSUER, // Issuer
            aud: JWT_AUDIENCE // Audience
        }
        
        console.log('🔧 JWTUtils: Generating token with payload:', payload);
        const token = jwt.sign(payload, JWT_SECRET, { 
            expiresIn: JWT_EXPIRES_IN
        })
        console.log('🔧 JWTUtils: Token generated successfully');
        return token
    }

        // Verify JWT token
    static verifyToken(token) {
        try {
            console.log('🔧 JWTUtils: Verifying token...');
            const decoded = jwt.verify(token, JWT_SECRET)
            console.log('🔧 JWTUtils: Token verified successfully');
            return decoded
        } catch (error) {
            console.error('JWT verification error:', error)
            return null
        }
    }

    // Generate token for regular users
    static generateUserToken(user) {
        return this.generateToken({
            user_id: user.user_id,
            email: user.email,
            user_type: user.user_type
        })
    }

    // Generate token for admin users
    static generateAdminToken(adminUser) {
        const payload = {
            admin_id: adminUser.admin_id,
            user_id: adminUser.admin_id, // Also include user_id for compatibility
            email: adminUser.email,
            user_type: 'admin_user',
            role: adminUser.role,
            permissions: adminUser.permissions,
            iat: Math.floor(Date.now() / 1000), // Issued at
            iss: JWT_ISSUER, // Issuer
            aud: JWT_AUDIENCE // Audience
        }
        
        console.log('🔧 JWTUtils: Generating admin token with payload:', payload);
        const token = jwt.sign(payload, JWT_SECRET, { 
            expiresIn: JWT_EXPIRES_IN
        })
        console.log('🔧 JWTUtils: Admin token generated successfully');
        return token
    }

    // Decode token without verification (for debugging)
    static decodeToken(token) {
        try {
            return jwt.decode(token)
        } catch (error) {
            console.error('JWT decode error:', error)
            return null
        }
    }

    // Check if token is expired
    static isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token)
            if (!decoded || !decoded.exp) {
                return true
            }
            return Date.now() >= decoded.exp * 1000
        } catch (error) {
            return true
        }
    }

    // Get token expiration time
    static getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token)
            if (!decoded || !decoded.exp) {
                return null
            }
            return new Date(decoded.exp * 1000)
        } catch (error) {
            return null
        }
    }

    // Refresh token if it's about to expire (within 1 hour)
    static shouldRefreshToken(token) {
        try {
            const decoded = jwt.decode(token)
            if (!decoded || !decoded.exp) {
                return true
            }
            const oneHourFromNow = Date.now() + (60 * 60 * 1000)
            return decoded.exp * 1000 <= oneHourFromNow
        } catch (error) {
            return true
        }
    }
}

export default JWTUtils
