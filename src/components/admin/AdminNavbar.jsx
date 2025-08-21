'use client'

import { useState } from 'react'
import { 
    Bars3Icon, 
    BellIcon, 
    UserCircleIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function AdminNavbar({ onMenuClick, adminUser, onLogout }) {
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button
                            onClick={onMenuClick}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        
                        <div className="flex items-center ml-4 lg:ml-0">
                            <div className="flex-shrink-0">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">N</span>
                                    </div>
                                    <span className="ml-2 text-xl font-bold text-gray-900">Nesbah Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            >
                                <BellIcon className="h-6 w-6" />
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                            </button>
                            
                            {notificationsOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                            <div className="font-medium">Notifications</div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            <div className="px-4 py-3 hover:bg-gray-50">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            Auction ending soon
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Application #123 auction ends in 1 hour
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            2 minutes ago
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 hover:bg-gray-50">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            New revenue collected
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            25 SAR collected from Bank ABC
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            5 minutes ago
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 border-t border-gray-100">
                                            <button className="text-sm text-blue-600 hover:text-blue-500">
                                                View all notifications
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            >
                                <UserCircleIcon className="h-8 w-8" />
                                <span className="hidden md:block text-sm font-medium text-gray-700">
                                    {adminUser?.full_name || 'Admin User'}
                                </span>
                            </button>
                            
                            {userMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                            <div className="font-medium">{adminUser?.email || 'admin@nesbah.com'}</div>
                                            <div className="text-xs text-gray-500">{adminUser?.role || 'Admin'}</div>
                                        </div>
                                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                            <UserCircleIcon className="h-4 w-4 mr-2" />
                                            Profile
                                        </button>
                                        <button 
                                            onClick={onLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
