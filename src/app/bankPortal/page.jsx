'use client'

import { useEffect, useState } from 'react'
import BankNavbar from '@/components/bankNavbar'
import { NewFooter } from '@/components/NewFooter'
import { Stat } from '@/components/stat'
import { Heading } from '@/components/heading'
import { Select } from '@/components/select'
import StackedCard from '@/components/stackedCard'
import BankLeadsTable from "@/components/BankLeadsTable"

function BankPortal() {
    const [userInfo, setUserInfo] = useState(null)
    const [leads, setLeads] = useState([])
    const [stats, setStats] = useState(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) return

        const user = JSON.parse(storedUser)
        setUserInfo(user)

        // Fetch leads
        fetch('/api/leads', {
            headers: { 'x-user-id': user.user_id },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setLeads(data.data)
                }
            })
            .catch((err) => console.error('Failed to fetch leads:', err))

        // Fetch lead stats
        fetch('/api/leads/stats', {
            headers: { 'x-user-id': user.user_id }
        })
            .then((res) => res.json())
            .then((data) => {
                console.log('Stats response:', data);  // 👈 Check this
                if (data.success) {
                    setStats(data.data);
                }
            });
    }, [])

    return (
        <div className="overflow-hidden pb-32">
            {/* 🟪 Container 1 (Dashboard Stats) */}
            <div className="min-h-full">
                <div className="pt-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Heading>Welcome to Nesbah</Heading>
                    </div>
                    <main>
                        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                            <div className=" grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
                                <Stat
                                    title="New leads"
                                    value={stats?.incoming_leads ?? '-'}
                                    change="+0%"
                                />
                                <Stat
                                    title="Purchased leads"
                                    value={stats?.purchased_leads ?? '-'}
                                    change="+0%"
                                />
                                <Stat
                                    title="Ignored leads"
                                    value={stats?.ignored_leads ?? '-'}
                                    change="+0%"
                                />
                                <Stat
                                    title="Avg response time"
                                    value={
                                        stats && stats.avg_response_time !== null
                                            ? `${stats.avg_response_time} hrs`
                                            : 'N/A'
                                    }
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
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Incoming application
                    </h1>
                    <BankLeadsTable data={leads} />
                </div>
            </div>
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