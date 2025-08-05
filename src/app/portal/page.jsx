'use client'

import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { Container } from '@/components/container'
import { Navbar } from '@/components/navbar'
import { NewFooter } from '@/components/NewFooter'
import { BusinessInformation } from '@/components/businessInformation'
import { BusinessFinancialInformation } from '@/components/businessFinancialInformation'
import { PosApplication } from '@/components/posApplication'
import { ApplicationLimit } from '@/components/ApplicationLimit'
import YourApplication from '@/components/YourApplication'
import RejectionReaction from '@/components/RejectionReaction'
import { useEffect, useState } from 'react'
import ApplicationSubmittedModal from '@/components/ApplicationSubmittedModal'
import ApprovedLeadReaction from '@/components/ApprovedLeadReaction'

const tabs = [
    { name: 'Point of service (POS)', value: 'pos' },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function BusinessPortal() {
    const [activeTab, setActiveTab] = useState('pos');
    const [userInfo, setUserInfo] = useState(null);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [hasApplication, setHasApplication] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserInfo(parsedUser);

            // Fetch business info
            fetch(`/api/portal/client/${parsedUser.user_id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setBusinessInfo(data.data);
                    }
                });

            // Fetch POS applications
            fetch(`/api/posApplication/${parsedUser.user_id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data.length > 0) {
                        setHasApplication(true);
                    } else {
                        setHasApplication(false);
                    }
                })
                .catch(err => {
                    console.error('Error checking applications:', err);
                    setHasApplication(false);
                });
        }
    }, []);

    const renderForm = () => {
        switch (activeTab) {
            case 'pos':
                return <PosApplication user={{ ...userInfo, business: businessInfo }} onSuccess={() => setIsSubmitted(true)} />;
            case 'account':
                return <div className="text-gray-600">My Account form goes here.</div>;
            default:
                return null;
        }
    };

    return (
      <div className="overflow-hidden pb-32">
        {isSubmitted && <ApplicationSubmittedModal />}
        <Container className="relative">
          <Navbar />
        </Container>

        {/* 🟪 Container 1 (Business Info) */}
        <div className="min-h-full">
          <div className="pt-5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                About you
              </h1>
            </div>
            <main>
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6">
                  <BusinessInformation businessInfo={businessInfo} />
                </div>
                <div className="mx-auto max-w-7xl py-2">
                  <YourApplication user={userInfo} />
                    <ApprovedLeadReaction user={userInfo} />
                      <RejectionReaction user={userInfo} />
                </div>
                {!hasApplication && (
                <div className="bg-white pb-10 pt-5">
                  <div className="mx-auto max-w-7xl pt-2">
                    <header className="mb-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-purple-900">
                        Apply for a service
                      </h2>
                    </header>

                    {/* Tabs: Mobile */}
                    <div className="mb-6 grid grid-cols-1 sm:hidden">
                      <select
                        value={
                          tabs.find((tab) => tab.value === activeTab)?.name
                        }
                        aria-label="Select a tab"
                        onChange={(e) => {
                          const selected = tabs.find(
                            (t) => t.name === e.target.value,
                          )
                          if (selected) setActiveTab(selected.value)
                        }}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline-indigo-600"
                      >
                        {tabs.map((tab) => (
                          <option key={tab.name}>{tab.name}</option>
                        ))}
                      </select>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
                      />
                    </div>

                    {/* Tabs: Desktop */}
                    <div className="mb-6 hidden sm:block">
                      <nav aria-label="Tabs" className="flex space-x-4">
                        {tabs.map((tab) => (
                          <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.value)}
                            className={classNames(
                              activeTab === tab.value
                                ? 'bg-[#1E1851] text-white'
                                : 'text-gray-500 hover:text-gray-700',
                              'rounded-md px-3 py-2 text-sm font-medium',
                            )}
                          >
                            {tab.name}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Render Active Tab Content */}
                    <div>{renderForm()}</div>
                  </div>
                </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    )
}


export default function BusinessDashboardPage() {
    return (
        <div>
            <main className="pb-16">
                <Container/>
                <BusinessPortal/>
            </main>
            <NewFooter/>
        </div>
    )
}
