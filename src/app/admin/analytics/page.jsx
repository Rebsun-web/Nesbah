'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/container'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import ProtectedRoute from '@/components/admin/ProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import ApplicationsAnalytics from '@/components/admin/analytics/ApplicationsAnalytics'
import OffersAnalytics from '@/components/admin/analytics/OffersAnalytics'
import { 
    DocumentTextIcon, 
    BuildingOfficeIcon
} from '@heroicons/react/24/outline'

export default function AnalyticsDashboard() {
    const { adminUser, logout } = useAdminAuth()
    const [activeTab, setActiveTab] = useState('applications')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const analyticsTabs = [
        {
            id: 'applications',
            name: 'Applications Analytics',
            icon: DocumentTextIcon,
            description: 'Comprehensive application metrics and trends'
        },
        {
            id: 'offers',
            name: 'Offers Analytics',
            icon: BuildingOfficeIcon,
            description: 'Bank offer performance and conversion rates'
        }
    ]

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'applications':
                return <ApplicationsAnalytics />
            case 'offers':
                return <OffersAnalytics />
            default:
                return <ApplicationsAnalytics />
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <AdminNavbar onMenuClick={() => setSidebarOpen(true)} adminUser={adminUser} onLogout={logout} />
                
                <div className="flex">
                    <AdminSidebar 
                        activeTab="analytics" 
                        onTabChange={() => {}}
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    
                    <main className="flex-1 p-6">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                                <p className="text-gray-600 mt-2">
                                    Analytics and insights for the dual-auction system
                                </p>
                            </div>

                            {/* Analytics Navigation */}
                            <div className="mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analyticsTabs.map((tab) => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id
                                        
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`
                                                    p-6 rounded-lg border-2 transition-all duration-200 text-left
                                                    ${isActive 
                                                        ? 'border-purple-500 bg-purple-50 shadow-lg' 
                                                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center mb-3">
                                                    <Icon 
                                                        className={`
                                                            h-8 w-8 mr-3
                                                            ${isActive ? 'text-purple-600' : 'text-gray-400'}
                                                        `} 
                                                    />
                                                    <h3 className={`
                                                        font-semibold text-lg
                                                        ${isActive ? 'text-purple-900' : 'text-gray-900'}
                                                    `}>
                                                        {tab.name}
                                                    </h3>
                                                </div>
                                                <p className={`
                                                    text-sm
                                                    ${isActive ? 'text-purple-700' : 'text-gray-600'}
                                                `}>
                                                    {tab.description}
                                                </p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Analytics Content */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                {renderActiveTab()}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}