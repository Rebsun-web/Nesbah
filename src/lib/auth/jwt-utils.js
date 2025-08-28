// JWT utilities for server-side authentication
import jwt from 'jsonwebtoken';

export default class JWTUtils {
    static verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET || 'fallback-secret';
            console.log('🔧 JWTUtils: Using secret:', secret ? 'secret-set' : 'using-fallback');
            const decoded = jwt.verify(token, secret);
            return { valid: true, payload: decoded };
        } catch (error) {
            console.error('🔧 JWTUtils: Verification error:', error.message);
            return { valid: false, error: error.message };
        }
    }
    
    static generateToken(payload) {
        try {
            return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
                expiresIn: '24h'
            });
        } catch (error) {
            console.error('Error generating token:', error);
            throw error;
        }
    }

    static generateAdminToken(adminData) {
        try {
            const payload = {
                admin_id: adminData.admin_id,
                email: adminData.email,
                full_name: adminData.full_name,
                role: adminData.role || 'admin',
                permissions: adminData.permissions || [],
                user_type: 'admin_user', // Add this field for admin token verification
                iat: Math.floor(Date.now() / 1000)
            };
            
            return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
                expiresIn: '24h'
            });
        } catch (error) {
            console.error('Error generating admin token:', error);
            throw error;
        }
    }

    static generateUserToken(userData) {
        try {
            const payload = {
                user_id: userData.user_id,
                email: userData.email,
                user_type: userData.user_type,
                iat: Math.floor(Date.now() / 1000)
                // Let JWT library handle exp automatically
            };
            
            return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
                expiresIn: '24h'
            });
        } catch (error) {
            console.error('Error generating user token:', error);
            throw error;
        }
    }

    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    static isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) return true;
            
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }
}