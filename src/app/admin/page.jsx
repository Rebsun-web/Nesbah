'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/container'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import DashboardOverview from '@/components/admin/DashboardOverview'
import ApplicationsTable from '@/components/admin/ApplicationsTable'
import UserManagement from '@/components/admin/UserManagement'
import OfferManagement from '@/components/admin/OfferManagement'
import EnhancedAnalytics from '@/components/admin/EnhancedAnalytics'
import UserStats from '@/components/admin/UserStats'


export default function AdminDashboard({ adminUser }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // adminUser is now passed as a prop from the layout
    // No need to manage it locally

    // Logout function
    const logout = async () => {
        try {
            await fetch('/api/admin/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } catch (error) {
            console.error('Logout error:', error)
        }
        
        // Always redirect to login
        window.location.replace('/login')
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            
            const response = await fetch('/api/admin/applications/status-dashboard', {
                method: 'GET',
                credentials: 'include',
            })
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            
            if (data.success) {
                setDashboardData(data.data)
                setError(null)
            } else {
                setError(data.error || 'Failed to fetch dashboard data')
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err)
            setError(`Network error while fetching dashboard data: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
        
        // Refresh every 2 minutes
        const interval = setInterval(fetchDashboardData, 120000)
        return () => clearInterval(interval)
    }, [])

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8">
                        <DashboardOverview data={dashboardData} loading={loading} />
                        <UserStats />
                    </div>
                )
            case 'applications':
                return <ApplicationsTable />
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 pt-5">
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
                
                <main className="flex-1 pt-2 px-8 pb-8">
                    <div className="px-8 lg:px-12">
                        <div className="mx-auto max-w-7xl">
                            <div className="bg-white rounded-lg shadow-lg p-8">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {activeTab === 'overview' && 'Dashboard Overview'}
                                        {activeTab === 'applications' && 'Applications Management'}
                                        {activeTab === 'users' && 'User Management'}
                                        {activeTab === 'offers' && 'Offer Management'}
                                        {activeTab === 'analytics' && 'Enhanced Analytics'}
                                    </h1>
                                    <p className="text-gray-600 mt-2">
                                        {activeTab === 'overview' && 'Monitor your platform performance and key metrics'}
                                        {activeTab === 'applications' && 'Manage and track all business applications'}
                                        {activeTab === 'users' && 'Manage business, bank, and employee users'}
                                        {activeTab === 'offers' && 'Monitor and manage bank offers'}
                                        {activeTab === 'analytics' && 'Advanced analytics and insights'}
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
