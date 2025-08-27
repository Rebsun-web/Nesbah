// Client-side authentication utilities

export function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json',
    }
    
    // Get user token from localStorage (for regular user authentication)
    const user = localStorage.getItem('user')
    if (user) {
        try {
            const userData = JSON.parse(user)
            // Use JWT token for user authentication
            if (userData.jwt_token) {
                headers['Authorization'] = `Bearer ${userData.jwt_token}`
            } else {
                // Fallback to user token in header
                headers['x-user-token'] = JSON.stringify(userData)
            }
        } catch (error) {
            console.error('Error parsing user data:', error)
        }
    }
    
    // Note: Admin authentication is handled via HTTP-only cookies
    // We don't need to add admin headers here as the server will
    // automatically include the admin_token cookie
    
    return headers
}

export function getCurrentUser() {
    try {
        const user = localStorage.getItem('user')
        if (user) {
            return JSON.parse(user)
        }
        
        const adminUser = localStorage.getItem('adminUser')
        if (adminUser) {
            return JSON.parse(adminUser)
        }
        
        return null
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

export function isAuthenticated() {
    return getCurrentUser() !== null
}

export function getUserType() {
    const user = getCurrentUser()
    return user ? user.user_type : null
}

export function logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('adminUser')
    window.location.href = '/login'
}

export async function makeAuthenticatedRequest(url, options = {}) {
    // Get authentication headers
    const authHeaders = getAuthHeaders()
    
    const response = await fetch(url, {
        ...options,
        credentials: 'include', // This ensures cookies are sent
        headers: {
            ...authHeaders,
            ...options.headers,
        },
    })
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
        console.log('🔧 ClientAuth: 401 response, redirecting to login')
        logout()
        return null
    }
    
    return response
}
