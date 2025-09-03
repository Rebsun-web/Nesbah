'use client'

import { useState, useEffect } from 'react'
import { 
    UserIcon, 
    DocumentTextIcon, 
    ChartBarIcon, 
    ArrowTrendingUpIcon,
    ClockIcon,
    CheckCircleIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function BusinessJourneyAnalytics() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')

    useEffect(() => {
        fetchBusinessJourneyData()
    }, [timeRange])

    const fetchBusinessJourneyData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/analytics/business-journey?timeRange=${timeRange}`, {
                credentials: 'include'
            })
            const result = await response.json()
            
            if (result.success) {
                setData(result.data)
            } else {
                setError(result.error || 'Failed to fetch business journey data')
            }
        } catch (err) {
            setError('Network error while fetching business journey data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Business Journey Data</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchBusinessJourneyData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!data) return null

    const { 
        registration_conversion, 
        journey_stages, 
        dropoff_analysis, 
        onboarding_metrics,
        engagement_patterns,
        retention_metrics
    } = data

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Business Journey Analytics</h2>
                    <p className="text-gray-600 mt-1">Track business journey from registration to application completion</p>
                </div>
                <div className="flex items-center space-x-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <button
                        onClick={fetchBusinessJourneyData}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Registration to Application Conversion */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Registration to Application Conversion
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Registrations</p>
                        <p className="text-2xl font-bold text-blue-700">
                            {registration_conversion?.total_registrations || 0}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            New business accounts
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Applications Submitted</p>
                        <p className="text-2xl font-bold text-green-700">
                            {registration_conversion?.applications_submitted || 0}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            {registration_conversion?.conversion_rate || 0}% conversion
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Profile Completion</p>
                        <p className="text-2xl font-bold text-purple-700">
                            {registration_conversion?.profile_completion_rate || 0}%
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                            Complete business profiles
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Active Users</p>
                        <p className="text-2xl font-bold text-orange-700">
                            {registration_conversion?.active_users || 0}
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                            {registration_conversion?.activation_rate || 0}% activation
                        </p>
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-700 mb-4">Conversion Funnel</h4>
                    <div className="flex items-center justify-center space-x-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                                {registration_conversion?.total_registrations || 0}
                            </div>
                            <p className="text-sm text-gray-600">Registrations</p>
                        </div>
                        
                        <div className="text-blue-400 text-2xl">→</div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                                {registration_conversion?.profile_completed || 0}
                            </div>
                            <p className="text-sm text-gray-600">Profile Complete</p>
                        </div>
                        
                        <div className="text-green-400 text-2xl">→</div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                                {registration_conversion?.applications_submitted || 0}
                            </div>
                            <p className="text-sm text-gray-600">Applications</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Journey Stages Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Journey Stages Analysis
                    </h3>
                    <div className="space-y-4">
                        {journey_stages?.stages?.map((stage, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">{stage.stage_name}</span>
                                    <span className="text-sm font-semibold text-gray-900">{stage.count}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${stage.completion_rate}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mt-1">
                                    <span>{stage.completion_rate}% completion</span>
                                    <span>{stage.avg_time_hours}h avg time</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dropoff Analysis */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Dropoff Analysis
                    </h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Total Dropoffs</p>
                            <p className="text-2xl font-bold text-red-700">
                                {dropoff_analysis?.total_dropoffs || 0}
                            </p>
                        </div>
                        <div className="space-y-3">
                            {dropoff_analysis?.dropoff_points?.map((point, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900">{point.stage_name}</span>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-600">
                                            {point.dropoff_rate}% dropoff
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {point.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Onboarding Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Onboarding Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Avg Onboarding Time</p>
                        <p className="text-xl font-bold text-blue-700">
                            {onboarding_metrics?.avg_onboarding_hours || 0} hours
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Registration to first action
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Profile Completion Time</p>
                        <p className="text-xl font-bold text-green-700">
                            {onboarding_metrics?.avg_profile_completion_hours || 0} hours
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            Time to complete profile
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">First Application Time</p>
                        <p className="text-xl font-bold text-purple-700">
                            {onboarding_metrics?.avg_first_application_hours || 0} hours
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                            Time to first application
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Onboarding Success Rate</p>
                        <p className="text-xl font-bold text-orange-700">
                            {onboarding_metrics?.onboarding_success_rate || 0}%
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                            Complete onboarding
                        </p>
                    </div>
                </div>
            </div>

            {/* Engagement Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500" />
                        User Engagement Patterns
                    </h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Average Session Duration</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {engagement_patterns?.avg_session_duration_minutes || 0} min
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Daily Active Users</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {engagement_patterns?.daily_active_users || 0}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-600">Weekly Active Users</p>
                                <p className="text-lg font-semibold text-purple-700">
                                    {engagement_patterns?.weekly_active_users || 0}
                                </p>
                            </div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600">Engagement Score</p>
                            <p className="text-lg font-semibold text-orange-700">
                                {engagement_patterns?.engagement_score || 0}/100
                            </p>
                        </div>
                    </div>
                </div>

                {/* Retention Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Retention Metrics
                    </h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">7-Day Retention</p>
                            <p className="text-2xl font-bold text-green-700">
                                {retention_metrics?.retention_7_days || 0}%
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600">30-Day Retention</p>
                                <p className="text-lg font-semibold text-blue-700">
                                    {retention_metrics?.retention_30_days || 0}%
                                </p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-600">90-Day Retention</p>
                                <p className="text-lg font-semibold text-purple-700">
                                    {retention_metrics?.retention_90_days || 0}%
                                </p>
                            </div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600">Churn Rate</p>
                            <p className="text-lg font-semibold text-orange-700">
                                {retention_metrics?.churn_rate || 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Journey Insights */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Journey Insights & Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-md font-medium text-blue-900 mb-2">Conversion Optimization</h4>
                        <p className="text-sm text-blue-700">
                            Current conversion rate: {registration_conversion?.conversion_rate || 0}%
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                            Target: Increase by 15% through improved onboarding
                        </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="text-md font-medium text-green-900 mb-2">Dropoff Prevention</h4>
                        <p className="text-sm text-green-700">
                            Main dropoff point: {dropoff_analysis?.main_dropoff_point || 'N/A'}
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                            Focus on reducing {dropoff_analysis?.main_dropoff_rate || 0}% dropoff rate
                        </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="text-md font-medium text-purple-900 mb-2">Engagement Strategy</h4>
                        <p className="text-sm text-purple-700">
                            Engagement score: {engagement_patterns?.engagement_score || 0}/100
                        </p>
                        <p className="text-sm text-purple-600 mt-2">
                            Implement gamification to increase engagement
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
