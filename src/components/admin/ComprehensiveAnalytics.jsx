'use client'

import { useState, useEffect } from 'react'
import { 
    DocumentTextIcon, 
    BuildingOfficeIcon,
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    TrendingUpIcon,
    MapPinIcon,
    BanknotesIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    ArrowPathIcon,
    CalendarIcon,
    StarIcon
} from '@heroicons/react/24/outline'
import { AnimatedNumber } from '@/components/animated-number'

export default function ComprehensiveAnalytics() {
    const [applicationsData, setApplicationsData] = useState(null)
    const [offersData, setOffersData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')

    useEffect(() => {
        fetchAllData()
    }, [timeRange])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const [applicationsResponse, offersResponse] = await Promise.all([
                fetch('/api/admin/applications/analytics', { credentials: 'include' }),
                fetch('/api/admin/offers/analytics', { credentials: 'include' })
            ])
            
            const applicationsResult = await applicationsResponse.json()
            const offersResult = await offersResponse.json()
            
            console.log('Applications API response:', applicationsResult)
            console.log('Offers API response:', offersResult)
            
            if (applicationsResult.success && offersResult.success) {
                setApplicationsData(applicationsResult.data)
                setOffersData(offersResult.data)
            } else {
                const errorMessage = applicationsResult.error || offersResult.error || 'Failed to fetch analytics data'
                console.error('API Error:', errorMessage)
                setError(errorMessage)
            }
        } catch (err) {
            console.error('Network error:', err)
            setError('Network error while fetching analytics data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
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
            <div className="text-center py-12">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchAllData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!applicationsData || !offersData) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600 mb-4">No analytics data found. Please check if there are any applications or offers in the system.</p>
                <button
                    onClick={fetchAllData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Refresh
                </button>
            </div>
        )
    }

    const { 
        summary: appSummary = {}, 
        by_status: appStatus = [], 
        by_city = [], 
        by_sector = [], 
        application_processing_time = {},
        auction_time_windows = {}
    } = applicationsData
    const { 
        summary: offerSummary = {}, 
        by_status: offerStatus = [], 
        by_bank = [], 
        by_business = [], 
        average_metrics = {},
        offer_processing_time = {},
        bank_response_time = {},
        user_decision_time = {},
        offer_selection_windows = {}
    } = offersData

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex justify-between items-center">
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
                        onClick={fetchAllData}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm flex items-center"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                            <p className="text-3xl font-bold">
                                <AnimatedNumber start={0} end={appSummary.total_applications || 0} />
                            </p>
                            <p className="text-blue-100 text-sm mt-1">
                                {appSummary.overall_approval_rate || 0}% approval rate
                            </p>
                        </div>
                        <DocumentTextIcon className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Offers</p>
                            <p className="text-3xl font-bold">
                                <AnimatedNumber start={0} end={offerSummary.total_offers || 0} />
                            </p>
                            <p className="text-green-100 text-sm mt-1">
                                {offerSummary.overall_win_rate || 0}% win rate
                            </p>
                        </div>
                        <BuildingOfficeIcon className="h-12 w-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Avg Processing Time</p>
                            <p className="text-3xl font-bold">{application_processing_time.avg_processing_days || 0}d</p>
                            <p className="text-purple-100 text-sm mt-1">
                                Application to approval
                            </p>
                        </div>
                        <CalendarIcon className="h-12 w-12 text-purple-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Avg Setup Fee</p>
                            <p className="text-3xl font-bold">SAR {average_metrics.avg_setup_fee || 0}</p>
                            <p className="text-orange-100 text-sm mt-1">
                                Per successful offer
                            </p>
                        </div>
                        <CurrencyDollarIcon className="h-12 w-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Applications Workflow */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Applications Workflow
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {appStatus.map((status) => {
                        const percentage = appSummary.total_applications > 0 ? Math.round((status.count / appSummary.total_applications) * 100) : 0
                        const color = status.status === 'completed' ? 'bg-green-500' :
                                     status.status === 'abandoned' ? 'bg-red-500' :
                                     status.status === 'submitted' ? 'bg-yellow-500' : 'bg-gray-500'
                        
                        return (
                            <div key={status.status} className="text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <div className={`w-4 h-4 rounded-full ${color} mr-2`}></div>
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {status.status}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">{status.count || 0}</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className={`h-2 rounded-full ${color.replace('bg-', 'bg-')}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-gray-500">{percentage}%</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Offers Workflow */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-500" />
                    Offers Workflow
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {offerStatus.map((status) => {
                        const percentage = offerSummary.total_offers > 0 ? Math.round((status.count / offerSummary.total_offers) * 100) : 0
                        const color = status.status === 'deal_won' ? 'bg-green-500' :
                                     status.status === 'deal_lost' ? 'bg-red-500' :
                                     status.status === 'submitted' ? 'bg-yellow-500' : 'bg-gray-500'
                        
                        return (
                            <div key={status.status} className="text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <div className={`w-4 h-4 rounded-full ${color} mr-2`}></div>
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {status.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">{status.count || 0}</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className={`h-2 rounded-full ${color.replace('bg-', 'bg-')}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-gray-500">{percentage}%</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Business Sectors & Bank Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Business Sectors */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UserGroupIcon className="h-5 w-5 mr-2 text-purple-500" />
                        Top Business Sectors
                    </h3>
                    <div className="space-y-3">
                        {by_sector.slice(0, 6).map((sector, index) => (
                            <div key={sector.sector} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                                    <span className="text-sm font-medium text-gray-900">{sector.sector}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {sector.total_applications > 0 ? Math.round((sector.completed_applications / sector.total_applications) * 100) : 0}% completion
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {sector.total_applications}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performing Banks */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BanknotesIcon className="h-5 w-5 mr-2 text-green-500" />
                        Top Performing Banks
                    </h3>
                    <div className="space-y-3">
                        {by_bank.slice(0, 6).map((bank, index) => (
                            <div key={bank.bank_user_id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                                    <span className="text-sm font-medium text-gray-900">{bank.bank_name}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {bank.win_rate}% win rate
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {bank.total_offers}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Geographic Performance */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Geographic Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {by_city.slice(0, 6).map((city, index) => (
                        <div key={city.city} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                <span className="text-sm font-semibold text-gray-900">{city.total_applications}</span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{city.city}</h4>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Approval Rate</span>
                                <span className="font-semibold text-green-600">{city.approval_rate}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Processing Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
                        Application Processing Time
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-blue-900">Submission to Completion</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {application_processing_time.avg_application_processing_hours ? `${application_processing_time.avg_application_processing_hours} hours` : 'No data'}
                                </p>
                                {application_processing_time.total_completed_applications && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Based on {application_processing_time.total_completed_applications} applications
                                    </p>
                                )}
                            </div>
                            <CalendarIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {application_processing_time.min_application_processing_hours ? `${application_processing_time.min_application_processing_hours}h` : 'No data'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {application_processing_time.max_application_processing_hours ? `${application_processing_time.max_application_processing_hours}h` : 'No data'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Processing Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-green-500" />
                        Offer Processing Time
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-green-900">Submission to Acceptance</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {offer_processing_time.avg_offer_processing_hours ? `${offer_processing_time.avg_offer_processing_hours} hours` : 'No data'}
                                </p>
                                {offer_processing_time.total_accepted_offers && (
                                    <p className="text-xs text-green-600 mt-1">
                                        Based on {offer_processing_time.total_accepted_offers} offers
                                    </p>
                                )}
                            </div>
                            <CalendarIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {offer_processing_time.min_offer_processing_hours ? `${offer_processing_time.min_offer_processing_hours}h` : 'No data'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {offer_processing_time.max_offer_processing_hours ? `${offer_processing_time.max_offer_processing_hours}h` : 'No data'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bank & User Response Times */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bank Response Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BanknotesIcon className="h-5 w-5 mr-2 text-purple-500" />
                        Bank Response Time
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-purple-900">Purchase to Offer</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {bank_response_time.avg_bank_response_hours ? `${bank_response_time.avg_bank_response_hours} hours` : 'No data'}
                                </p>
                                {bank_response_time.total_bank_responses && (
                                    <p className="text-xs text-purple-600 mt-1">
                                        Based on {bank_response_time.total_bank_responses} responses
                                    </p>
                                )}
                            </div>
                            <BanknotesIcon className="h-8 w-8 text-purple-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {bank_response_time.min_bank_response_hours ? `${bank_response_time.min_bank_response_hours}h` : 'No data'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {bank_response_time.max_bank_response_hours ? `${bank_response_time.max_bank_response_hours}h` : 'No data'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Acceptance Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UserGroupIcon className="h-5 w-5 mr-2 text-orange-500" />
                        User Acceptance Time
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-orange-900">Window Start to Acceptance</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {user_decision_time.avg_user_decision_hours ? `${user_decision_time.avg_user_decision_hours} hours` : 'No data'}
                                </p>
                                {user_decision_time.total_user_decisions && (
                                    <p className="text-xs text-orange-600 mt-1">
                                        Based on {user_decision_time.total_user_decisions} decisions
                                    </p>
                                )}
                            </div>
                            <UserGroupIcon className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {user_decision_time.min_user_decision_hours ? `${user_decision_time.min_user_decision_hours}h` : 'No data'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {user_decision_time.max_user_decision_hours ? `${user_decision_time.max_user_decision_hours}h` : 'No data'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auction Windows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Auction Windows */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
                        Application Auction Windows
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-blue-900">Average Auction Duration</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {auction_time_windows.avg_auction_window_hours ? `${auction_time_windows.avg_auction_window_hours} hours` : 'No data'}
                                </p>
                                {auction_time_windows.total_auctions && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        Based on {auction_time_windows.total_auctions} auctions
                                    </p>
                                )}
                            </div>
                            <ClockIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Shortest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {auction_time_windows.min_auction_window_hours ? `${auction_time_windows.min_auction_window_hours}h` : 'No data'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Longest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {auction_time_windows.max_auction_window_hours ? `${auction_time_windows.max_auction_window_hours}h` : 'No data'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Selection Windows */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2 text-green-500" />
                        Offer Selection Windows
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-green-900">Average Selection Duration</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {offer_selection_windows.avg_offer_selection_window_hours ? `${offer_selection_windows.avg_offer_selection_window_hours} hours` : 'No data'}
                                </p>
                                {offer_selection_windows.total_offer_windows && (
                                    <p className="text-xs text-green-600 mt-1">
                                        Based on {offer_selection_windows.total_offer_windows} windows
                                    </p>
                                )}
                            </div>
                            <ClockIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Shortest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {offer_selection_windows.min_offer_selection_window_hours ? `${offer_selection_windows.min_offer_selection_window_hours}h` : 'No data'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Longest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {offer_selection_windows.max_offer_selection_window_hours ? `${offer_selection_windows.max_offer_selection_window_hours}h` : 'No data'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Offer Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-500" />
                        Average Offer Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Setup Fee</p>
                            <p className="text-xl font-bold text-blue-700">
                                {average_metrics.avg_setup_fee ? `SAR ${average_metrics.avg_setup_fee}` : 'No data'}
                            </p>
                            {average_metrics.offers_with_setup_fee && (
                                <p className="text-xs text-blue-600 mt-1">
                                    {average_metrics.offers_with_setup_fee} offers
                                </p>
                            )}
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Mada Fee</p>
                            <p className="text-xl font-bold text-green-700">
                                {average_metrics.avg_mada_fee ? `${average_metrics.avg_mada_fee}%` : 'No data'}
                            </p>
                            {average_metrics.offers_with_mada_fee && (
                                <p className="text-xs text-green-600 mt-1">
                                    {average_metrics.offers_with_mada_fee} offers
                                </p>
                            )}
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Visa/MC Fee</p>
                            <p className="text-xl font-bold text-purple-700">
                                {average_metrics.avg_visa_mc_fee ? `${average_metrics.avg_visa_mc_fee}%` : 'No data'}
                            </p>
                            {average_metrics.offers_with_visa_mc_fee && (
                                <p className="text-xs text-purple-600 mt-1">
                                    {average_metrics.offers_with_visa_mc_fee} offers
                                </p>
                            )}
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600 font-medium">Settlement</p>
                            <p className="text-xl font-bold text-orange-700">
                                {average_metrics.avg_settlement_time ? `${average_metrics.avg_settlement_time} days` : 'No data'}
                            </p>
                            {average_metrics.offers_with_settlement_time && (
                                <p className="text-xs text-orange-600 mt-1">
                                    {average_metrics.offers_with_settlement_time} offers
                                </p>
                            )}
                        </div>
                    </div>
                </div>
        </div>
    )
}
