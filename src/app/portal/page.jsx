'use client'

import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { Container } from '@/components/container'
import BusinessNavbar from '@/components/businessNavbar'
import { NewFooter } from '@/components/NewFooter'
import { BusinessInformation } from '@/components/businessInformation'
import { BusinessFinancialInformation } from '@/components/businessFinancialInformation'
import { PosApplication } from '@/components/posApplication'
import { ApplicationLimit } from '@/components/ApplicationLimit'
import YourApplication from '@/components/YourApplication'

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react'
import ApplicationSubmittedModal from '@/components/ApplicationSubmittedModal'
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'
import { useLanguage } from '@/contexts/LanguageContext'

// Lazy load heavy components
const LazyYourApplication = lazy(() => import('@/components/YourApplication'))
const LazyPosApplication = lazy(() => import('@/components/posApplication').then(module => ({ default: module.PosApplication })))

const tabs = [
    { name: 'POS finance', value: 'pos' },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function BusinessPortal() {
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState('pos');
    const [userInfo, setUserInfo] = useState(null);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [hasApplication, setHasApplication] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [applicationData, setApplicationData] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [previousStatus, setPreviousStatus] = useState(null);
    const [isLoadingBusinessInfo, setIsLoadingBusinessInfo] = useState(false);

    // Memoize status info to prevent unnecessary recalculations
    const statusInfo = useMemo(() => {
        const statusConfig = {
            'live_auction': {
                label: t('portal.liveAuction'),
                description: t('portal.liveAuctionDesc'),
                color: 'bg-yellow-100 text-yellow-800',
                icon: '⏰'
            },
            'completed': {
                label: t('portal.dealCompleted'),
                description: t('portal.dealCompletedDesc'),
                color: 'bg-green-100 text-green-800',
                icon: '✅'
            },
            'ignored': {
                label: t('portal.applicationIgnored'),
                description: t('portal.applicationIgnoredDesc'),
                color: 'bg-gray-100 text-gray-800',
                icon: '❌'
            },
        };
        
        return statusConfig[applicationStatus] || {
            label: t('portal.unknownStatus'),
            description: t('portal.unknownStatusDesc'),
            color: 'bg-gray-100 text-gray-800',
            icon: '❓'
        };
    }, [applicationStatus, t]);

    // Function to fetch application data - memoized with useCallback
    const fetchApplicationData = useCallback(async (userId, userInfo) => {
        try {
            // Fetch POS applications
            const appResponse = await fetch(`/api/posApplication/${userId}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            // Check if response is ok and has JSON content type
            if (!appResponse.ok) {
                console.error('Error fetching application data: Response not ok:', appResponse.status, appResponse.statusText);
                setHasApplication(false);
                return;
            }
            
            const contentType = appResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Error fetching application data: Response is not JSON:', contentType);
                const text = await appResponse.text();
                console.error('Error fetching application data: Response text:', text);
                setHasApplication(false);
                return;
            }
            
            const appData = await appResponse.json();
            
            if (appData.success && appData.data.length > 0) {
                const application = appData.data[0]; // Get the first (and only) application
                setApplicationData(application);
                
                // Check if status changed
                if (application.status !== applicationStatus) {
                    setPreviousStatus(applicationStatus);
                    setApplicationStatus(application.status);
                } else {
                    setApplicationStatus(application.status);
                }
                
                setHasApplication(true);
                
                // Note: Removed the call to /api/leads/[id] as it's designed for bank users
                // Business users already have all necessary data from pos_application table
            } else {
                setHasApplication(false);
                setApplicationStatus(null);
                setApplicationData(null);
            }
            
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Error fetching application data:', err);
            console.error('Error details:', {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            setHasApplication(false);
        }
    }, [applicationStatus]);

    // Memoize the form renderer
    const renderForm = useCallback(() => {
        switch (activeTab) {
            case 'pos':
                return (
                    <Suspense fallback={<div className="text-center py-8">Loading application form...</div>}>
                        <LazyPosApplication user={{ ...userInfo, business: businessInfo }} onSuccess={() => setIsSubmitted(true)} />
                    </Suspense>
                );
            case 'account':
                return <div className="text-gray-600">My Account form goes here.</div>;
            default:
                return null;
        }
    }, [activeTab, userInfo, businessInfo]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (!parsedUser || !parsedUser.user_id) {
                    console.error('Invalid user data in localStorage');
                    return;
                }
                setUserInfo(parsedUser);

                // Fetch business info - using direct fetch to test
                console.log('🔍 Portal: Starting business info fetch for user_id:', parsedUser.user_id);
                console.log('🔍 Portal: User data:', parsedUser);
            
            // Test with direct fetch first
            setIsLoadingBusinessInfo(true);
            (async () => {
                try {
                    const response = await fetch(`/api/portal/client/${parsedUser.user_id}`, {
                        method: 'GET',
                        credentials: 'include'
                    });
                    
                    console.log('🔍 Portal: Direct fetch response status:', response.status);
                    
                    // Check if response is ok and has JSON content type
                    if (!response.ok) {
                        console.error('🔍 Portal: Response not ok:', response.status, response.statusText);
                        return;
                    }
                    
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        console.error('🔍 Portal: Response is not JSON:', contentType);
                        const text = await response.text();
                        console.error('🔍 Portal: Response text:', text);
                        return;
                    }
                    
                    const data = await response.json();
                    console.log('🔍 Portal: Direct fetch data:', data);
                    
                    if (data && data.success) {
                        setBusinessInfo(data.data);
                    }
                } catch (error) {
                    console.error('🔍 Portal: Direct fetch error:', error);
                    console.error('🔍 Portal: Error details:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    });
                } finally {
                    setIsLoadingBusinessInfo(false);
                }
            })();

            // Initial fetch
            fetchApplicationData(parsedUser.user_id, parsedUser);

            // Optimized polling: only poll if user has active application
            const interval = setInterval(() => {
                if (hasApplication && applicationStatus && 
                    ['live_auction'].includes(applicationStatus)) {
                    fetchApplicationData(parsedUser.user_id, parsedUser);
                }
            }, 60000); // Increased to 60 seconds to reduce server load

            return () => clearInterval(interval);
            } catch (error) {
                console.error('Error parsing user data or setting up portal:', error);
            }
        }
    }, [hasApplication, applicationStatus, fetchApplicationData]);

    return (
      <div className="min-h-screen flex flex-col">
        {isSubmitted && <ApplicationSubmittedModal />}
        <BusinessNavbar />

        {/* 🟪 Container 1 (Business Info) */}
        <div className="flex-1">
          <div className="pt-5">
            <main>
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6">
                  {isLoadingBusinessInfo ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                      <div className="px-8 py-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading business information...</p>
                      </div>
                    </div>
                  ) : (
                    <BusinessInformation businessInfo={businessInfo} />
                  )}
                </div>
                <div className="mx-auto max-w-7xl py-2">
                  {/* Application Status Display */}
                  {hasApplication && applicationStatus && (
                    <div className="w-full mb-8">
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <div className="text-2xl text-white">
                                  {statusInfo?.icon || '⏳'}
                                </div>
                              </div>
                              <div>
                                <h1 className="text-2xl font-bold text-white">{t('portal.applicationStatus')}</h1>
                                <p className="text-indigo-100">{t('portal.trackApplicationProgress')}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => userInfo && fetchApplicationData(userInfo.user_id, userInfo)}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                              >
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('common.refresh')}
                              </button>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                                  {statusInfo?.label || 'Loading...'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Bar */}
                        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                              {statusInfo?.description || 'Loading application status...'}
                            </p>
                            {lastUpdate && (
                              <p className="text-xs text-slate-500">
                                {t('common.lastUpdated')}: {lastUpdate.toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Details */}
                        <div className="px-8 py-6">
                          {/* Status Information */}
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                            <div className="divide-y divide-gray-200">
                              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                                    <div className="text-lg text-purple-600">
                                      {statusInfo?.icon || '⏳'}
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">Current Status</span>
                                </div>
                                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                                  {statusInfo?.label || 'Loading...'}
                                </span>
                              </div>
                              
                              <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                                    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">Status Description</span>
                                </div>
                                <span className="text-sm text-gray-900 font-semibold max-w-md text-right">
                                  {statusInfo.description}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Application Details */}
                          {applicationData && (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                                  <svg className="h-5 w-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Application Details
                                </h5>
                              </div>
                              <div className="divide-y divide-gray-200">
                                {applicationData.submitted_at && (
                                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                                        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-gray-700">Submitted Date</span>
                                    </div>
                                    <span className="text-sm text-gray-900 font-semibold">
                                      {new Date(applicationData.submitted_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                
                                {applicationData.submitted_at && (
                                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                                        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-gray-700">Submitted Time</span>
                                    </div>
                                    <span className="text-sm text-gray-900 font-semibold">
                                      {new Date(applicationData.submitted_at).toLocaleTimeString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Only show application-related components if user has submitted an application */}
                  {hasApplication && (
                    <div className="space-y-8">
                      <Suspense fallback={<div className="text-center py-8">Loading application details...</div>}>
                        <LazyYourApplication user={userInfo} />
                      </Suspense>
                    </div>
                  )}

                </div>
                {!hasApplication && (
                <div className="bg-white pt-5">
                  <div className="mx-auto max-w-7xl pt-2">
                    <header className="mb-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-purple-900">
                        {t('portal.applyForService')}
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
        <NewFooter className="mt-auto" />
      </div>
    )
}


export default function BusinessDashboardPage() {
    return <BusinessPortal />
}
