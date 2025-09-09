// Client-side authentication utilities

export function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json',
    }
    
    // Check for admin JWT token first
    const adminJWT = localStorage.getItem('adminJWT')
    if (adminJWT) {
        headers['Authorization'] = `Bearer ${adminJWT}`
        return headers
    }
    
    // Get user data from localStorage for user identification (fallback for non-admin users)
    const user = localStorage.getItem('user')
    if (user) {
        try {
            const userData = JSON.parse(user)
            // Add user data to headers for server-side identification
            headers['x-user-token'] = JSON.stringify(userData)
        } catch (error) {
            console.error('Error parsing user data:', error)
        }
    }
    
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
    localStorage.removeItem('adminJWT')
    
    // Ensure body is visible after logout
    if (typeof document !== 'undefined') {
        document.body.classList.add('hydrated')
    }
    
    window.location.href = '/login'
}


export async function makeAuthenticatedRequest(url, options = {}) {
    try {
        console.log('🔧 ClientAuth: Making request to:', url);
        console.log('🔧 ClientAuth: URL type:', typeof url);
        console.log('🔧 ClientAuth: URL value:', url);
        
        // Get authentication headers
        const authHeaders = getAuthHeaders()
        console.log('🔧 ClientAuth: Auth headers:', authHeaders);
        
        const fetchOptions = {
            ...options,
            credentials: 'include', // This ensures cookies are sent
            headers: {
                ...authHeaders,
                ...options.headers,
            },
        };
        
        console.log('🔧 ClientAuth: Fetch options:', fetchOptions);
        console.log('🔧 ClientAuth: Fetch options type:', typeof fetchOptions);
        
        // Validate URL before fetch
        if (!url || typeof url !== 'string') {
            throw new Error(`Invalid URL: ${url} (type: ${typeof url})`);
        }
        
        const response = await fetch(url, fetchOptions)
        console.log('🔧 ClientAuth: Response status:', response.status);
        
        // If unauthorized, redirect to login
        if (response.status === 401) {
            console.log('🔧 ClientAuth: 401 response, redirecting to login')
            logout()
            return null
        }
        
        return response
    } catch (error) {
        console.error('🔧 ClientAuth: Error in makeAuthenticatedRequest:', error);
        throw error;
    }
}