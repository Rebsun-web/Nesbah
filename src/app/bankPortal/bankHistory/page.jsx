'use client'

import { Container } from '@/components/container'
import BankNavbar from '@/components/bankNavbar'
import { NewFooter } from '@/components/NewFooter'
import LeadsHistoryTable from '@/components/LeadsHistoryTable'
import { useEffect, useState } from 'react'
import ContactCard from '@/components/contactCard'
import {Heading} from "@/components/text";

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function BankHistoryPage (){

    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLeadsHistory = async () => {
            const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

            if (storedUser) {
                const bankUser = JSON.parse(storedUser);
                try {
                    const res = await fetch(`/api/leads/history?user_id=${bankUser.user_id}`);
                    const result = await res.json();
                    if (result.success) {
                        setLeads(result.data);
                    }
                } catch (err) {
                    console.error('Error fetching leads history:', err);
                }
            }
        };

        fetchLeadsHistory();
    }, []);

    return (
        <div className="overflow-hidden py-12">
            {/* 🟪 Container 1 (Dashboard, Business Info) */}

            {/* 🟦 2nd Container (current applciation */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        Purchased leads
                    </h1>
                </div>
                <div className="py-5">
                    <LeadsHistoryTable data={leads}/>
                </div>
            </div>

            {/* 🟨 Container 3 (Tabs + Form) */}
        </div>
    )
}


export default function BusinessDashboardPage() {
    return (
        <div>
            <main className="pb-32">
                <BankNavbar/>
                <BankHistoryPage/>
            </main>
            <NewFooter/>
        </div>
    )
}
