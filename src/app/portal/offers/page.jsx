'use client'

import { useEffect, useState } from 'react'
import { Container } from '@/components/container'
import BusinessNavbar from '@/components/businessNavbar'
import { NewFooter } from '@/components/NewFooter'
import BankOffersDisplay from '@/components/BankOffersDisplay'
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'
import { useLanguage } from '@/contexts/LanguageContext'

function OffersPage() {
    const { t } = useLanguage()
    const [userInfo, setUserInfo] = useState(null)
    const [hasApplication, setHasApplication] = useState(false)
    const [applicationStatus, setApplicationStatus] = useState(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            setUserInfo(parsedUser)

            // Fetch application data to check if user has an application
            fetchApplicationData(parsedUser.user_id)
        }
    }, [])

    const fetchApplicationData = async (userId) => {
        try {
            const appResponse = await fetch(`/api/posApplication/${userId}`)
            const appData = await appResponse.json()
            
            if (appData.success && appData.data.length > 0) {
                const application = appData.data[0]
                setApplicationStatus(application.status)
                setHasApplication(true)
            } else {
                setHasApplication(false)
                setApplicationStatus(null)
            }
        } catch (err) {
            console.error('Error fetching application data:', err)
            setHasApplication(false)
        }
    }

    return (
        <div>
            <BusinessNavbar />
            <main className="pb-16">
                <Container/>
                <div className="min-h-full">
                    <div className="pt-5">
                        <main>
                            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                                {hasApplication ? (
                                    <BankOffersDisplay userInfo={userInfo} applicationStatus={applicationStatus} />
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                        <div className="px-8 py-12 text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
                                                <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Application Found</h3>
                                            <p className="text-slate-600 max-w-md mx-auto mb-6">
                                                You need to submit an application first before you can view offers from banks.
                                            </p>
                                            <a
                                                href="/portal"
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                                            >
                                                Go to Dashboard
                                            </a>
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
