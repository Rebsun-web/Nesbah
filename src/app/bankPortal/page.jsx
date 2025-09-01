'use client'

import { useEffect, useState } from 'react'
import BankNavbar from '@/components/bankNavbar'
import { NewFooter } from '@/components/NewFooter'
import { Stat } from '@/components/stat'
import { Heading } from '@/components/heading'
import { Select } from '@/components/select'
import StackedCard from '@/components/stackedCard'
import BankLeadsTable from "@/components/BankLeadsTable"

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
        fetch('/api/leads', {
            credentials: 'include',
            headers: {
                'x-user-token': JSON.stringify(user)
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.success) {
                    setLeads(data.data)
                }
            })
            .catch((err) => console.error('Failed to fetch leads:', err))

        // Fetch lead stats
        fetch('/api/leads/stats', {
            credentials: 'include',
            headers: {
                'x-user-token': JSON.stringify(user)
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.success) {
                    setStats(data.data);
                }
            })
            .catch((err) => console.error('Failed to fetch stats:', err));
    }, [])

    const handleLogoUploadSuccess = (newLogoUrl) => {
        // Update user info with new logo URL
        if (userInfo) {
            const updatedUserInfo = { ...userInfo, logo_url: newLogoUrl }
            setUserInfo(updatedUserInfo)
            localStorage.setItem('user', JSON.stringify(updatedUserInfo))
        }
    }

    const refreshLeads = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const response = await fetch('/api/leads', {
                credentials: 'include',
                headers: {
                    'x-user-token': JSON.stringify(user)
                }
            })
            const data = await response.json()
            if (data && data.success) {
                setLeads(data.data)
            }
            
            // Also refresh stats
            const statsResponse = await fetch('/api/leads/stats', {
                credentials: 'include',
                headers: {
                    'x-user-token': JSON.stringify(user)
                }
            })
            const statsData = await statsResponse.json()
            if (statsData && statsData.success) {
                setStats(statsData.data)
            }
        } catch (error) {
            console.error('Failed to refresh leads:', error)
        }
    }

    return (
        <div className="overflow-hidden">
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
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-8">
                <div className="mx-auto max-w-7xl">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">
                        {t('leads.incoming')}
                    </h1>
                    <BankLeadsTable data={leads} onLeadSubmitSuccess={refreshLeads} />
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

export default function BankDashboardPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 flex flex-col">
                <BankNavbar />
                <BankPortal />
            </main>
            <NewFooter className="mt-auto" />
        </div>
    )
}