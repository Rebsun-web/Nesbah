'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
    EyeIcon, 
    DocumentTextIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline'
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'
import './BankPerformanceMetrics.css'

export default function BankPerformanceMetrics() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')
    const [sortField, setSortField] = useState('bank_name')
    const [sortDirection, setSortDirection] = useState('asc')

    const fetchBankPerformanceData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            setData(null)
            console.log('🔍 BankPerformanceMetrics: Fetching data for timeRange:', timeRange)
            
            const response = await fetch(`/api/admin/analytics/bank-performance?timeRange=${timeRange}`, {
                credentials: 'include'
            })
            const result = await response.json()
            
            console.log('🔍 BankPerformanceMetrics: API response:', result)
            
            if (result.success) {
                setData(result.data)
                console.log('✅ BankPerformanceMetrics: Data set successfully')
            } else {
                console.log('❌ BankPerformanceMetrics: API returned error:', result.error)
                setError(result.error || 'Failed to fetch bank performance data')
            }
        } catch (err) {
            console.error('❌ BankPerformanceMetrics: Network error:', err)
            setError('Network error while fetching bank performance data')
        } finally {
            setLoading(false)
        }
    }, [timeRange])

    useEffect(() => {
        fetchBankPerformanceData()
    }, [fetchBankPerformanceData])

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const sortData = (data) => {
        if (!data) return []
        
        return [...data].sort((a, b) => {
            let aValue = a[sortField]
            let bValue = b[sortField]
            
            // Handle numeric values for applications viewed and offers submitted
            if (sortField === 'applications_viewed' || sortField === 'offers_submitted') {
                aValue = parseInt(aValue) || 0
                bValue = parseInt(bValue) || 0
            }
            
            // Handle conversion rate as percentage
            if (sortField === 'conversion_rate') {
                aValue = parseFloat(aValue) || 0
                bValue = parseFloat(bValue) || 0
            }
            
            // Handle bank name as string
            if (sortField === 'bank_name') {
                aValue = (aValue || '').toString().toLowerCase()
                bValue = (bValue || '').toString().toLowerCase()
            }
            
            // Sort logic
            if (sortDirection === 'asc') {
                if (aValue < bValue) return -1
                if (aValue > bValue) return 1
                return 0
            } else {
                if (aValue > bValue) return -1
                if (aValue < bValue) return 1
                return 0
            }
        })
    }

    const getSortIcon = (field) => {
        if (sortField !== field) {
            return <ArrowUpIcon className="ml-2 h-4 w-4 text-gray-400" />
        }
        return sortDirection === 'asc' 
            ? <ArrowUpIcon className="ml-2 h-4 w-4 text-blue-600" />
            : <ArrowDownIcon className="ml-2 h-4 w-4 text-blue-600" />
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Bank Performance Data</h3>
                    <p className="text-gray-600">Please wait while we fetch the latest metrics...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Bank Performance</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchBankPerformanceData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!data) return null

    const { bank_performance_ranking } = data
    const sortedData = sortData(bank_performance_ranking)

    return (
        <div className="p-6 lg:p-8">
            {/* Header with time range selector */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bank Performance Metrics</h1>
                        <p className="text-sm text-gray-600 mt-1">Monitor bank engagement and performance in the auction system</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <button
                        onClick={fetchBankPerformanceData}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Bank Performance Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Bank Performance Summary</h3>
                            <p className="text-sm text-gray-600 mt-1">Applications viewed and offers submitted by banks</p>
                        </div>
                        {sortField && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Sorted by: {sortField === 'bank_name' ? 'Bank Name' : 
                                           sortField === 'applications_viewed' ? 'Applications Viewed' :
                                           sortField === 'offers_submitted' ? 'Offers Submitted' :
                                           'Conversion Rate'} 
                                ({sortField === 'bank_name' ? 
                                    (sortDirection === 'asc' ? 'A-Z' : 'Z-A') :
                                    (sortDirection === 'asc' ? 'Low to High' : 'High to Low')})
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                    <p className="text-xs text-blue-700">
                        💡 Click on any column header to sort the data. Click again to reverse the sort order.
                    </p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="bank-performance-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('bank_name')} className="cursor-pointer hover:bg-gray-100 transition-colors duration-150">
                                    <div className="flex items-center">
                                        <span className="font-semibold">BANK NAME</span>
                                        {getSortIcon('bank_name')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('applications_viewed')} className="cursor-pointer hover:bg-gray-100 transition-colors duration-150">
                                    <div className="flex items-center">
                                        <EyeIcon className="h-4 w-4 mr-2 text-blue-500" />
                                        <span className="font-semibold">APPLICATIONS VIEWED</span>
                                        {getSortIcon('applications_viewed')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('offers_submitted')} className="cursor-pointer hover:bg-gray-100 transition-colors duration-150">
                                    <div className="flex items-center">
                                        <DocumentTextIcon className="h-4 w-4 mr-2 text-green-500" />
                                        <span className="font-semibold">OFFERS SUBMITTED</span>
                                        {getSortIcon('offers_submitted')}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('conversion_rate')} className="cursor-pointer hover:bg-gray-100 transition-colors duration-150">
                                    <div className="flex items-center">
                                        <span className="font-semibold">CONVERSION RATE</span>
                                        {getSortIcon('conversion_rate')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length > 0 ? (
                                sortedData.map((bank, index) => (
                                    <tr key={bank.bank_user_id || index}>
                                        <td>
                                            <div>
                                                {bank.bank_name || 'Unknown Bank'}
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                {bank.applications_viewed || 0}
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                {bank.offers_submitted || 0}
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    parseFloat(bank.conversion_rate || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                                    parseFloat(bank.conversion_rate || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                    parseFloat(bank.conversion_rate || 0) >= 20 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {bank.conversion_rate ? `${bank.conversion_rate}%` : '0%'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">
                                        <div className="flex flex-col items-center py-12">
                                            <DocumentTextIcon className="h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">No bank performance data</p>
                                            <p className="text-sm text-gray-600">No banks have viewed applications or submitted offers in the selected time period.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Stats */}
            {sortedData.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <EyeIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Applications Viewed</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {sortedData.reduce((sum, bank) => sum + (parseInt(bank.applications_viewed) || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                                <DocumentTextIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700">Total Offers Submitted</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {sortedData.reduce((sum, bank) => sum + (parseInt(bank.offers_submitted) || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                <ChartBarIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-purple-700">Overall Conversion Rate</p>
                                <p className="text-2xl font-bold text-purple-900">
                                    {(() => {
                                        const totalViewed = sortedData.reduce((sum, bank) => sum + (parseInt(bank.applications_viewed) || 0), 0)
                                        const totalOffers = sortedData.reduce((sum, bank) => sum + (parseInt(bank.offers_submitted) || 0), 0)
                                        return totalViewed > 0 ? ((totalOffers / totalViewed) * 100).toFixed(1) : '0.0'
                                    })()}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
