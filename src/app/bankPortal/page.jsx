'use client'

import { useEffect, useState } from 'react'
import BankNavbar from '@/components/bankNavbar'
import { NewFooter } from '@/components/NewFooter'
import { Stat } from '@/components/stat'
import { Heading } from '@/components/heading'
import { Select } from '@/components/select'
import StackedCard from '@/components/stackedCard'
import BankLeadsTable from "@/components/BankLeadsTable"
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'
import BankLogoUploadModal from '@/components/BankLogoUploadModal'
import { CameraIcon, ChartBarIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/button'
import { useLanguage } from '@/contexts/LanguageContext'

function BankPortal() {
    const [userInfo, setUserInfo] = useState(null)
    const [leads, setLeads] = useState([])
    const [stats, setStats] = useState(null)
    const [isLogoUploadModalOpen, setIsLogoUploadModalOpen] = useState(false)
    const { t } = useLanguage()

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) return

        const user = JSON.parse(storedUser)
        setUserInfo(user)

        // Fetch leads
        makeAuthenticatedRequest('/api/leads')
            .then((res) => res ? res.json() : null)
            .then((data) => {
                if (data && data.success) {
                    setLeads(data.data)
                }
            })
            .catch((err) => console.error('Failed to fetch leads:', err))

        // Fetch lead stats
        makeAuthenticatedRequest('/api/leads/stats')
            .then((res) => res ? res.json() : null)
            .then((data) => {
                console.log('Stats response:', data);  // 👈 Check this
                if (data && data.success) {
                    setStats(data.data);
                }
            });
    }, [])

    const handleLogoUploadSuccess = (newLogoUrl) => {
        // Update user info with new logo URL
        if (userInfo) {
            const updatedUserInfo = { ...userInfo, logo_url: newLogoUrl }
            setUserInfo(updatedUserInfo)
            localStorage.setItem('user', JSON.stringify(updatedUserInfo))
        }
    }

    return (
        <div className="overflow-hidden pb-32">
            {/* 🟪 Container 1 (Dashboard Stats) */}
            <div className="min-h-full">
                <div className="pt-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <Heading>{t('hero.welcome')}</Heading>
                        </div>
                    </div>
                    
                    {/* Stats Section */}
                    <main>
                        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                            <div className="grid gap-8 sm:grid-cols-3">
                                <Stat
                                    title={t('stats.newLeads')}
                                    value={stats?.incoming_leads ?? '-'}
                                    change="+0%"
                                />
                                <Stat
                                    title={t('stats.submittedOffers')}
                                    value={stats?.purchased_leads ?? '-'}
                                    change="+0%"
                                />
                                <Stat
                                    title={t('stats.ignoredOffers')}
                                    value={stats?.ignored_leads ?? '-'}
                                    change="+0%"
                                />
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* 🟦 2nd Container (Current Applications) */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
                <div className="mx-auto max-w-7xl">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">
                        {t('leads.incoming')}
                    </h1>
                    <BankLeadsTable data={leads} />
                </div>
            </div>

            {/* Logo Upload Modal */}
            <BankLogoUploadModal
                isOpen={isLogoUploadModalOpen}
                onClose={() => setIsLogoUploadModalOpen(false)}
                onUploadSuccess={handleLogoUploadSuccess}
                currentLogoUrl={userInfo?.logo_url}
                bankName={userInfo?.entity_name || 'Bank'}
            />
        </div>
    )
}

export default function BusinessDashboardPage() {
    return (
        <div>
            <main className="pb-32">
                <BankNavbar />
                <BankPortal />
            </main>
            <NewFooter />
        </div>
    )
}