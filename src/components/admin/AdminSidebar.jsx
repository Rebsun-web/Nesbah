'use client'

import { 
    XMarkIcon,
    HomeIcon,
    DocumentTextIcon,
    UsersIcon,
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
            description: 'Manage business and bank users' 
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
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl rounded-r-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:rounded-2xl lg:shadow-2xl lg:h-fit lg:max-h-[33rem] lg:top-6 lg:ml-4 lg:mt-4
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl mb-6">
                    <div className="flex items-center">
                        <span className="ml-2 text-lg font-semibold text-white">Admin Panel</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-md text-white hover:text-gray-200 hover:bg-purple-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-6 px-6 mb-6">
                    <div className="space-y-2">
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
                                        group flex items-center px-4 py-3 text-sm font-medium rounded-md w-full text-left transition-colors
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
            </div>
        </>
    )
}
