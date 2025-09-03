'use client'

import { useRouter } from 'next/navigation'
import UserManagement from '@/components/admin/UserManagement'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function UsersPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            <span>Back to Dashboard</span>
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
                            <p className="mt-2 text-gray-600">
                                Manage business users, bank users, and employee accounts
                            </p>
                        </div>
                    </div>
                </div>

                {/* Users Management Component */}
                <div className="bg-white shadow rounded-lg">
                    <UserManagement />
                </div>
            </div>
        </div>
    )
}
