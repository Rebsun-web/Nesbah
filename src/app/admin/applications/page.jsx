'use client'

import { useState } from 'react'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminApplicationsDashboard from '@/components/admin/AdminApplicationsDashboard'
import { NewFooter } from '@/components/NewFooter'

export default function AdminApplicationsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('applications')

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
            <AdminNavbar 
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
                                        Applications Management
                                    </h1>
                                    <p className="text-gray-600 mt-2">
                                        Manage and track all business applications with full CRUD operations
                                    </p>
                                </div>
                                
                                <AdminApplicationsDashboard />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            
            <NewFooter />
        </div>
    )
}
