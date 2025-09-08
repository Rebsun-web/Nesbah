'use client'

import { useEffect, useState } from 'react'
import { Container } from '@/components/container'
import BusinessNavbar from '@/components/businessNavbar'
import { NewFooter } from '@/components/NewFooter'
import BankOffersDisplay from '@/components/BankOffersDisplay'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

function OffersPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const [userInfo, setUserInfo] = useState(null)
    const [hasApplication, setHasApplication] = useState(false)
    const [applicationStatus, setApplicationStatus] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingAppData, setIsLoadingAppData] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        checkAuthentication()
    }, [])

    // Separate useEffect to fetch application data when userInfo changes
    useEffect(() => {
        console.log('🔄 useEffect triggered - userInfo:', userInfo?.user_id, 'hasApplication:', hasApplication)
        if (userInfo && userInfo.user_id) {
            console.log('🔄 userInfo changed, fetching application data for:', userInfo.user_id)
            fetchApplicationData(userInfo.user_id)
        } else {
            console.log('⏳ Waiting for userInfo to be set...')
        }
    }, [userInfo])

    const checkAuthentication = async () => {
        try {
            console.log('🔍 Starting authentication check...')
            setIsLoading(true)
            setError(null)
            
            // Check if user is logged in
            const storedUser = localStorage.getItem('user')
            console.log('🔍 Stored user from localStorage:', storedUser ? 'Found' : 'Not found')
            
            if (!storedUser) {
                console.log('❌ No user found in localStorage')
                router.push('/login')
                return
            }

            const parsedUser = JSON.parse(storedUser)
            console.log('🔍 Parsed user data:', { user_id: parsedUser.user_id, user_type: parsedUser.user_type })
            
            // Validate user type
            if (parsedUser.user_type !== 'business_user') {
                console.log(`❌ Invalid user type: ${parsedUser.user_type}`)
                localStorage.removeItem('user')
                router.push('/login')
                return
            }

            setUserInfo(parsedUser)
            console.log('✅ Authentication successful, userInfo set:', parsedUser.user_id)
            
        } catch (error) {
            console.error('❌ Authentication check failed:', error)
            setError('Authentication failed. Please log in again.')
            localStorage.removeItem('user')
            router.push('/login')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchApplicationData = async (userId) => {
        try {
            setIsLoadingAppData(true)
            console.log('🔍 Fetching application data for user:', userId)
            
            const appResponse = await fetch(`/api/posApplication/${userId}`)
            
            if (!appResponse.ok) {
                if (appResponse.status === 401) {
                    console.log('❌ Unauthorized - redirecting to login')
                    localStorage.removeItem('user')
                    router.push('/login')
                    return
                }
                throw new Error(`HTTP error! status: ${appResponse.status}`)
            }
            
            const appData = await appResponse.json()
            console.log('📊 Application data received:', appData)
            
            if (appData.success && appData.data && appData.data.length > 0) {
                const application = appData.data[0]
                setApplicationStatus(application.status)
                setHasApplication(true)
                console.log('✅ Application found with status:', application.status)
                console.log('🔄 Setting hasApplication to true')
            } else {
                setHasApplication(false)
                setApplicationStatus(null)
                console.log('ℹ️ No application found for user')
                console.log('🔄 Setting hasApplication to false')
            }
        } catch (err) {
            console.error('❌ Error fetching application data:', err)
            setError('Failed to fetch application data. Please try again.')
            setHasApplication(false)
        } finally {
            setIsLoadingAppData(false)
        }
    }

    if (isLoading || isLoadingAppData) {
        return (
            <div className="min-h-screen flex flex-col">
                <BusinessNavbar />
                <main className="flex-1">
                    <Container/>
                    <div className="min-h-full">
                        <div className="pt-5">
                            <main>
                                <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
                                    <div className="flex items-center justify-center min-h-48 sm:min-h-64">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading offers...</p>
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                </main>
                <NewFooter/>
            </div>
        )
    }

    // Don't render the main content until we have both userInfo and application data
    if (!userInfo || !userInfo.user_id) {
        return (
            <div className="min-h-screen flex flex-col">
                <BusinessNavbar />
                <main className="flex-1">
                    <Container/>
                    <div className="min-h-full">
                        <div className="pt-5">
                            <main>
                                <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
                                    <div className="flex items-center justify-center min-h-48 sm:min-h-64">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading user information...</p>
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                </main>
                <NewFooter/>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <BusinessNavbar />
                <main className="flex-1">
                    <Container/>
                    <div className="min-h-full">
                        <div className="pt-5">
                            <main>
                                <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                                        <div className="text-center">
                                            <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 mb-3 sm:mb-4">
                                                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2">Error Loading Offers</h3>
                                            <p className="text-sm sm:text-base text-red-700 mb-3 sm:mb-4">{error}</p>
                                            <button
                                                onClick={() => router.push('/login')}
                                                className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                            >
                                                Go to Login
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                </main>
                <NewFooter/>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <BusinessNavbar />
            <main className="flex-1">
                <Container/>
                <div className="min-h-full">
                    <div className="pt-5">
                        <main>
                            <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
                                {console.log('🔍 Render state:', { hasApplication, isLoadingAppData, userInfo: !!userInfo })}
                                {hasApplication ? (
                                    <BankOffersDisplay userInfo={userInfo} applicationStatus={applicationStatus} />
                                ) : isLoadingAppData ? (
                                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                        <div className="px-4 sm:px-8 py-8 sm:py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Loading application data...</p>
                                        </div>
                                    </div>
                                ) : !isLoadingAppData && userInfo ? (
                                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                        <div className="px-4 sm:px-8 py-8 sm:py-12 text-center">
                                            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-slate-100 mb-4 sm:mb-6">
                                                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No Application Found</h3>
                                            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-4 sm:mb-6">
                                                You need to submit an application first before you can view offers from banks.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                        <div className="px-4 sm:px-8 py-8 sm:py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Initializing...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </main>
            <NewFooter/>
        </div>
    )
}

export default function OffersPageWrapper() {
    return <OffersPage />
}
