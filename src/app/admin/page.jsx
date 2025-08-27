'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/container'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import DashboardOverview from '@/components/admin/DashboardOverview'
import ApplicationsTable from '@/components/admin/ApplicationsTable'
import RevenueMetrics from '@/components/admin/RevenueMetrics'
import UserManagement from '@/components/admin/UserManagement'
import UserStats from '@/components/admin/UserStats'
import OfferAnalytics from '@/components/admin/OfferAnalytics'
import OfferManagement from '@/components/admin/OfferManagement'
import EnhancedAnalytics from '@/components/admin/EnhancedAnalytics'
import ProtectedRoute from '@/components/admin/ProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'


export default function AdminDashboard() {
    const { adminUser, logout } = useAdminAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            console.log('🔧 AdminDashboard: Fetching dashboard data...')
            
            const response = await makeAuthenticatedRequest('/api/admin/applications/status-dashboard', {
                method: 'GET',
                credentials: 'include',
            })
            
            console.log('🔧 AdminDashboard: Response status:', response.status)
            
            if (!response) {
                throw new Error('Authentication failed')
            }
            
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
        fetchDashboardData()
        
        // Optimized polling: only refresh every 2 minutes to reduce server load
        const interval = setInterval(fetchDashboardData, 120000) // Changed from 30s to 120s
        return () => clearInterval(interval)
    }, [])

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <DashboardOverview data={dashboardData} loading={loading} />
                        <UserStats />
                    </div>
                )
            case 'applications':
                return <ApplicationsTable />
            case 'revenue':
                return <RevenueMetrics detailed={true} />
            case 'users':
                return <UserManagement />
            case 'offers':
                return <OfferManagement />
            case 'analytics':
                return <EnhancedAnalytics />
            default:
                return <DashboardOverview data={dashboardData} loading={loading} />
        }
    }

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                    <div className="flex gap-6 items-start">
                        <div className="flex-shrink-0">
                            <AdminSidebar 
                                activeTab={activeTab} 
                                onTabChange={setActiveTab}
                                isOpen={sidebarOpen}
                                onClose={() => setSidebarOpen(false)}
                            />
                        </div>
                        
                        <div className="flex-1">
                            <AdminNavbar onMenuClick={() => setSidebarOpen(true)} adminUser={adminUser} onLogout={logout} />
                            
                            <div className="bg-white rounded-2xl shadow-2xl p-8 min-h-screen flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
                                    <p className="text-gray-600 mb-4">{error}</p>
                                    <button
                                        onClick={fetchDashboardData}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0">
                        <AdminSidebar 
                            activeTab={activeTab} 
                            onTabChange={setActiveTab}
                            isOpen={sidebarOpen}
                            onClose={() => setSidebarOpen(false)}
                        />
                    </div>
                    
                    <div className="flex-1">
                        <AdminNavbar onMenuClick={() => setSidebarOpen(true)} adminUser={adminUser} onLogout={logout} />
                        
                        <main className="bg-white rounded-2xl shadow-2xl p-8 min-h-screen">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {activeTab === 'overview' && 'Admin Dashboard'}
                                        {activeTab === 'applications' && 'Applications Management'}
                                        {activeTab === 'revenue' && 'Revenue Analytics'}
                                        {activeTab === 'users' && 'User Management'}
                                        {activeTab === 'offers' && 'Offer Management'}
                                        {activeTab === 'analytics' && 'Analytics Dashboard'}
                                    </h1>
                                    <p className="text-gray-600 mt-2">
                                        {activeTab === 'overview' && 'Real-time monitoring of the dual-auction system'}
                                        {activeTab === 'applications' && 'Manage application lifecycle and status transitions'}
                                        {activeTab === 'revenue' && 'Track revenue and financial performance'}
                                        {activeTab === 'users' && 'Manage business and bank users'}
                                        {activeTab === 'offers' && 'Manage bank offers and their status'}
                                        {activeTab === 'analytics' && 'Analytics for applications and offers'}
                                    </p>
                                </div>
                                {renderActiveTab()}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
