'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/container'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import DashboardOverview from '@/components/admin/DashboardOverview'
import ApplicationsTable from '@/components/admin/ApplicationsTable'
import RevenueMetrics from '@/components/admin/RevenueMetrics'
import SystemAlerts from '@/components/admin/SystemAlerts'
import UrgentApplications from '@/components/admin/UrgentApplications'
import BackgroundJobMonitor from '@/components/admin/BackgroundJobMonitor'
import UserManagement from '@/components/admin/UserManagement'
import UserStats from '@/components/admin/UserStats'
import OfferAnalytics from '@/components/admin/OfferAnalytics'
import OfferManagement from '@/components/admin/OfferManagement'
import ProtectedRoute from '@/components/admin/ProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

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
            const response = await fetch('/api/admin/applications/status-dashboard', {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setDashboardData(data.data)
            } else {
                setError(data.error || 'Failed to fetch dashboard data')
            }
        } catch (err) {
            setError('Network error while fetching dashboard data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
        
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000)
        return () => clearInterval(interval)
    }, [])

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <DashboardOverview data={dashboardData} loading={loading} />
                        <UserStats />
                        <UrgentApplications data={dashboardData?.urgentApplications} />
                        <RevenueMetrics />
                    </div>
                )
            case 'applications':
                return <ApplicationsTable />
            case 'revenue':
                return <RevenueMetrics detailed={true} />
            case 'alerts':
                return <SystemAlerts />
            case 'background-jobs':
                return <BackgroundJobMonitor />
            case 'users':
                return <UserManagement />
            case 'offers':
                return <OfferManagement />
            case 'analytics':
                return <div className="bg-white rounded-lg shadow">
                    <iframe 
                        src="/admin/analytics" 
                        className="w-full h-screen border-0"
                        title="Analytics Dashboard"
                    />
                </div>
            case 'settings':
                return <div className="bg-white rounded-lg shadow p-6">Settings coming soon...</div>
            default:
                return <DashboardOverview data={dashboardData} loading={loading} />
        }
    }

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <AdminNavbar onMenuClick={() => setSidebarOpen(true)} adminUser={adminUser} onLogout={logout} />
                    <div className="flex items-center justify-center min-h-screen">
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
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <AdminNavbar onMenuClick={() => setSidebarOpen(true)} adminUser={adminUser} onLogout={logout} />
                
                <div className="flex">
                    <AdminSidebar 
                        activeTab={activeTab} 
                        onTabChange={setActiveTab}
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    
                    <main className="flex-1 p-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {activeTab === 'overview' && 'Admin Dashboard'}
                                    {activeTab === 'applications' && 'Applications Management'}
                                    {activeTab === 'revenue' && 'Revenue Analytics'}
                                                                    {activeTab === 'alerts' && 'System Alerts'}
                                {activeTab === 'background-jobs' && 'Background Jobs'}
                                {activeTab === 'users' && 'User Management'}
                                {activeTab === 'offers' && 'Offer Management'}
                                {activeTab === 'analytics' && 'Analytics Dashboard'}
                                {activeTab === 'settings' && 'Settings'}
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    {activeTab === 'overview' && 'Real-time monitoring of the dual-auction system'}
                                    {activeTab === 'applications' && 'Manage application lifecycle and status transitions'}
                                    {activeTab === 'revenue' && 'Track revenue and financial performance'}
                                                                    {activeTab === 'alerts' && 'Monitor system alerts and notifications'}
                                {activeTab === 'background-jobs' && 'Monitor and manage automated background processes'}
                                {activeTab === 'users' && 'Manage business, individual, and bank users'}
                                {activeTab === 'offers' && 'Manage bank offers and their status'}
                                {activeTab === 'analytics' && 'Comprehensive analytics dashboard for applications and offers'}
                                {activeTab === 'settings' && 'Configure system settings and preferences'}
                                </p>
                            </div>
                            {renderActiveTab()}
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
