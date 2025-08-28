'use client'

import { useState } from 'react'
import { 
    Bars3Icon, 
    UserCircleIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function AdminNavbar({ onMenuClick, adminUser, onLogout }) {
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    return (
        <nav className="bg-white shadow-lg border-b border-gray-200 rounded-2xl mb-6 mx-4 mt-4">
            <div className="flex justify-between items-center h-16 px-8">
                {/* Left side - Logo and menu button */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 lg:hidden"
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                    
                    {/* Logo and brand */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">N</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-gray-900 leading-tight">Nesbah Admin</span>
                            <span className="text-xs text-gray-500 font-medium">System Administrator</span>
                        </div>
                    </div>
                </div>

                {/* Right side - User menu */}
                <div className="flex items-center space-x-4">
                    {/* User info display */}
                    <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">System Online</span>
                        </div>
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center space-x-3 p-2 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <UserCircleIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="hidden md:flex flex-col items-start">
                                <span className="text-sm font-semibold text-gray-900">
                                    {adminUser?.full_name || 'Admin User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {adminUser?.role || 'Administrator'}
                                </span>
                            </div>
                        </button>
                        
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-3 w-64 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                                <div className="py-2">
                                    {/* User info header */}
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <UserCircleIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 text-sm">
                                                    {adminUser?.full_name || 'Admin User'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {adminUser?.email || 'admin@nesbah.com'}
                                                </div>
                                                <div className="text-xs text-purple-600 font-medium">
                                                    {adminUser?.role || 'System Administrator'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Menu options */}
                                    <div className="py-1">
                                        <button 
                                            onClick={onLogout}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
