'use client'

import { useState } from 'react'
import { 
    ClockIcon, 
    CheckCircleIcon, 
    BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import ApplicationFlowTracking from './analytics/ApplicationFlowTracking'
import ApplicationSuccessMetrics from './analytics/ApplicationSuccessMetrics'
import BankPerformanceMetrics from './analytics/BankPerformanceMetrics'

export default function AnalyticsPage() {
    const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('application-flow')

    const analyticsTabs = [
        {
            id: 'application-flow',
            name: 'Application Flow',
            description: 'Track application progression and status changes',
            icon: ClockIcon,
            component: ApplicationFlowTracking,
            endpoint: '/api/admin/analytics/application-flow'
        },
        {
            id: 'application-success',
            name: 'Application Success',
            description: 'Monitor success rates and conversion metrics',
            icon: CheckCircleIcon,
            component: ApplicationSuccessMetrics,
            endpoint: '/api/admin/analytics/application-success'
        },
        {
            id: 'bank-performance',
            name: 'Bank Performance',
            description: 'Analyze bank performance and response times',
            icon: BuildingOfficeIcon,
            component: BankPerformanceMetrics,
            endpoint: '/api/admin/analytics/bank-performance'
        },


    ]

    const currentTab = analyticsTabs.find(tab => tab.id === activeAnalyticsTab)
    const CurrentComponent = currentTab?.component

    if (CurrentComponent) {
        return (
            <div className="space-y-6">
                {/* Analytics Navigation Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {analyticsTabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeAnalyticsTab === tab.id
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveAnalyticsTab(tab.id)}
                                    className={`
                                        group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                                        ${isActive 
                                            ? 'border-purple-500 text-purple-600' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <Icon 
                                        className={`
                                            mr-2 h-5 w-5 flex-shrink-0
                                            ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}
                                        `} 
                                    />
                                    {tab.name}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Active Analytics Component */}
                <div className="mt-6">
                    <CurrentComponent />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Analytics and insights across platform metrics
                </p>
            </div>

            {/* Analytics Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeAnalyticsTab === tab.id
                    
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveAnalyticsTab(tab.id)}
                            className={`
                                group p-6 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-lg
                                ${isActive 
                                    ? 'border-purple-500 bg-purple-50 shadow-lg' 
                                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                                }
                            `}
                        >
                            <div className="flex items-center mb-4">
                                <div className={`
                                    p-3 rounded-lg mr-4
                                    ${isActive 
                                        ? 'bg-purple-100 text-purple-600' 
                                        : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                                    }
                                    transition-colors duration-200
                                `}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`
                                        text-lg font-semibold
                                        ${isActive ? 'text-purple-900' : 'text-gray-900'}
                                    `}>
                                        {tab.name}
                                    </h3>
                                </div>
                                {isActive && (
                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                )}
                            </div>
                            
                            <p className={`
                                text-sm
                                ${isActive ? 'text-purple-700' : 'text-gray-600'}
                                group-hover:text-purple-700 transition-colors duration-200
                            `}>
                                {tab.description}
                            </p>
                            
                            <div className="mt-4 flex items-center justify-between">
                                <span className={`
                                    text-xs font-medium px-2 py-1 rounded-full
                                    ${isActive 
                                        ? 'bg-purple-200 text-purple-800' 
                                        : 'bg-gray-200 text-gray-600 group-hover:bg-purple-200 group-hover:text-purple-800'
                                    }
                                    transition-colors duration-200
                                `}>
                                    {tab.endpoint.split('/').pop()}
                                </span>
                                
                                <div className={`
                                    w-6 h-6 rounded-full border-2 transition-all duration-200
                                    ${isActive 
                                        ? 'border-purple-500 bg-purple-500' 
                                        : 'border-gray-300 group-hover:border-purple-400'
                                    }
                                `}>
                                    {isActive && (
                                        <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Quick Stats Preview */}
            <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">3</div>
                        <div className="text-sm text-gray-600">Analytics Modules</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-blue-600">Real-time</div>
                        <div className="text-sm text-gray-600">Data Updates</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-md border border-purple-200">
                        <div className="text-2xl font-bold text-green-600">Interactive</div>
                        <div className="text-sm text-gray-600">Charts & Graphs</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-orange-600">Export</div>
                        <div className="text-sm text-gray-600">Data & Reports</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
