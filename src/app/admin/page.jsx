'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/container'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import EnhancedAnalytics from '@/components/admin/EnhancedAnalytics'
import ApplicationsTable from '@/components/admin/ApplicationsTable'
import UserManagement from '@/components/admin/UserManagement'
import UserStats from '@/components/admin/UserStats'
import OfferAnalytics from '@/components/admin/OfferAnalytics'
import BankOffersPage from '@/components/admin/BankOffersPage'
import AnalyticsPage from '@/components/admin/AnalyticsPage'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
    const [adminUser, setAdminUser] = useState(null)
    const [activeTab, setActiveTab] = useState('analytics')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Get admin user from localStorage (this is now handled by the layout)
    useEffect(() => {
        const storedUser = localStorage.getItem('adminUser')
        console.log('🔍 Admin page: Checking localStorage for adminUser:', storedUser)
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser)
                console.log('🔍 Admin page: Parsed user data:', userData)
                if (userData.user_type === 'admin_user') {
                    console.log('✅ Admin page: Setting admin user state')
                    setAdminUser(userData)
                }
            } catch (error) {
                console.error('Error parsing admin user:', error)
            }
        } else {
            console.log('❌ Admin page: No adminUser found in localStorage')
        }
    }, [])

    // Logout function
    const logout = () => {
        localStorage.removeItem('adminUser')
        localStorage.removeItem('adminJWT')
        window.location.href = '/login'
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            console.log('🔧 AdminDashboard: Fetching dashboard data...')
            
            const response = await fetch('/api/admin/applications/status-dashboard', {
                method: 'GET',
                credentials: 'include',
            })
            
            console.log('🔧 AdminDashboard: Response status:', response.status)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('🔧 AdminDashboard: Response data:', data)
            
            if (data.success) {
                setDashboardData(data.data)
                setError(null) // Clear any previous errors
            } else {
                setError(data.error || 'Failed to fetch dashboard data')
            }
        } catch (err) {
            console.error('🔧 AdminDashboard: Fetch error:', err)
            setError(`Network error while fetching dashboard data: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('🔍 Admin page: useEffect triggered, calling fetchDashboardData')
        fetchDashboardData()
        
        // Optimized polling: only refresh every 2 minutes to reduce server load
        const interval = setInterval(fetchDashboardData, 120000) // Changed from 30s to 120s
        return () => clearInterval(interval)
    }, [])

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8">
                        <EnhancedAnalytics />
                        <UserStats />
                    </div>
                )
            case 'applications':
                return <ApplicationsTable />
            case 'users':
                return <UserManagement />
            case 'offers':
                return <BankOffersPage />
            case 'analytics':
                return <AnalyticsPage />
            default:
                return <AnalyticsPage />
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <div className="space-y-3">
                                <button
                                    onClick={fetchDashboardData}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Refresh Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
            <AdminNavbar 
                adminUser={adminUser} 
                onLogout={logout}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            />
            
            <div className="flex">
                <AdminSidebar 
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                
                <main className="flex-1 p-8">
                    <div className="px-8 lg:px-12">
                        <div className="mx-auto max-w-7xl">
                            <div className="bg-white rounded-lg shadow-lg p-8">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {activeTab === 'applications' && 'Applications Management'}
                                        {activeTab === 'offers' && 'Bank Offers Management'}
                                        {activeTab === 'analytics' && 'Analytics Dashboard'}
                                        {activeTab === 'overview' && 'Admin Dashboard Overview'}

                                    </h1>
                                    <p className="text-gray-600 mt-2">
                                        {activeTab === 'applications' && 'Manage and track all business applications with full CRUD operations'}
                                        {activeTab === 'offers' && 'Manage all bank offers and financing proposals'}
                                        {activeTab === 'analytics' && 'Comprehensive analytics across all platform metrics'}
                                        {activeTab === 'overview' && 'Complete overview of platform performance and statistics'}

                                    </p>
                                </div>
                                
                                {renderActiveTab()}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
