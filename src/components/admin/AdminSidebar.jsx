'use client'

import { 
    XMarkIcon,
    HomeIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    UsersIcon,
    Cog6ToothIcon,
    ChartBarIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline'

export default function AdminSidebar({ activeTab, onTabChange, isOpen, onClose }) {
    const navigation = [
        { 
            id: 'overview', 
            name: 'Dashboard', 
            icon: HomeIcon, 
            description: 'System overview and key metrics' 
        },
        { 
            id: 'analytics', 
            name: 'Analytics', 
            icon: ChartBarIcon, 
            description: 'Applications and Offers insights' 
        },
        { 
            id: 'revenue', 
            name: 'Revenue', 
            icon: CurrencyDollarIcon, 
            description: 'Track financial performance' 
        },
        { 
            id: 'applications', 
            name: 'Applications', 
            icon: DocumentTextIcon, 
            description: 'Manage application lifecycle' 
        },
        { 
            id: 'offers', 
            name: 'Offers', 
            icon: BuildingOfficeIcon, 
            description: 'Manage bank offers' 
        },
        { 
            id: 'users', 
            name: 'Users', 
            icon: UsersIcon, 
            description: 'Manage all user types' 
        },

        { 
            id: 'alerts', 
            name: 'Alerts', 
            icon: ExclamationTriangleIcon, 
            description: 'System alerts and notifications' 
        },
        { 
            id: 'background-jobs', 
            name: 'Background Jobs', 
            icon: Cog6ToothIcon, 
            description: 'Monitor automated processes' 
        },
    ]

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <span className="ml-2 text-lg font-semibold text-gray-900">Admin Panel</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.id
                            
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onTabChange(item.id)
                                        onClose()
                                    }}
                                    className={`
                                        group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors
                                        ${isActive 
                                            ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-600' 
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <Icon 
                                        className={`
                                            mr-3 h-5 w-5 flex-shrink-0
                                            ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}
                                        `} 
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 hidden lg:block">
                                            {item.description}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </nav>

                {/* Quick Stats */}
                <div className="mt-8 px-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Active Auctions</span>
                                <span className="font-medium text-green-600">12</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Pending Offers</span>
                                <span className="font-medium text-yellow-600">8</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Today's Revenue</span>
                                <span className="font-medium text-blue-600">1,250 SAR</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="mt-4 px-3">
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-green-800">System Online</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">All services operational</p>
                    </div>
                </div>
            </div>
        </>
    )
}
