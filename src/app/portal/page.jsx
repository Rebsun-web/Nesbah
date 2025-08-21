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
import RejectionReaction from '@/components/RejectionReaction'
import OfferSelection from '@/components/OfferSelection'
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
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [applicationData, setApplicationData] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [previousStatus, setPreviousStatus] = useState(null);

    // Function to fetch application data
    const fetchApplicationData = async (userId) => {
        try {
            // Fetch POS applications
            const appResponse = await fetch(`/api/posApplication/${userId}`);
            const appData = await appResponse.json();
            
            if (appData.success && appData.data.length > 0) {
                const application = appData.data[0]; // Get the first (and only) application
                setApplicationData(application);
                
                // Check if status changed and show notification
                if (application.status !== applicationStatus) {
                    setPreviousStatus(applicationStatus);
                    setApplicationStatus(application.status);
                    
                    // Show notification for important status changes
                    if (application.status === 'offer_received') {
                        alert('🎉 Great news! You have received offers from banks. Please review and select your preferred offer within 24 hours.');
                    } else if (application.status === 'completed') {
                        alert('✅ Congratulations! Your deal has been completed successfully.');
                    } else if (application.status === 'abandoned') {
                        alert('ℹ️ No banks submitted offers for your application. You can submit a new application if needed.');
                    } else if (application.status === 'deal_expired') {
                        alert('⏰ The 24-hour offer selection window has expired. You can submit a new application if needed.');
                    }
                } else {
                    setApplicationStatus(application.status);
                }
                
                setHasApplication(true);
                
                // Fetch additional application details if needed
                if (application.application_id) {
                    const detailsResponse = await fetch(`/api/leads/${application.application_id}`);
                    const detailsData = await detailsResponse.json();
                    if (detailsData.success) {
                        setApplicationData(prev => ({ ...prev, ...detailsData.data }));
                    }
                }
            } else {
                setHasApplication(false);
                setApplicationStatus(null);
                setApplicationData(null);
            }
            
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Error fetching application data:', err);
            setHasApplication(false);
        }
    };

    // Function to get status display info
    const getStatusInfo = (status) => {
        const statusConfig = {
            'submitted': {
                label: 'Application Submitted',
                description: 'Your application has been submitted and is being reviewed.',
                color: 'bg-blue-100 text-blue-800',
                icon: '📝'
            },
            'pending_offers': {
                label: 'Live Auction Active',
                description: 'Banks are viewing and purchasing your application. Auction ends in 48 hours.',
                color: 'bg-yellow-100 text-yellow-800',
                icon: '⏰'
            },
            'purchased': {
                label: 'Application Purchased',
                description: 'A bank has purchased access to your business data and can now submit offers.',
                color: 'bg-purple-100 text-purple-800',
                icon: '💰'
            },
            'offer_received': {
                label: 'Offers Available',
                description: 'You have received offers from banks. Choose your preferred offer within 24 hours.',
                color: 'bg-green-100 text-green-800',
                icon: '💰'
            },
            'completed': {
                label: 'Deal Completed',
                description: 'You have successfully selected an offer. Deal is finalized.',
                color: 'bg-green-100 text-green-800',
                icon: '✅'
            },
            'abandoned': {
                label: 'Application Abandoned',
                description: 'No banks submitted offers for your application.',
                color: 'bg-gray-100 text-gray-800',
                icon: '❌'
            },
            'deal_expired': {
                label: 'Deal Expired',
                description: 'You did not select an offer within the 24-hour window.',
                color: 'bg-red-100 text-red-800',
                icon: '⏰'
            }
        };
        
        return statusConfig[status] || {
            label: 'Unknown Status',
            description: 'Application status is unknown.',
            color: 'bg-gray-100 text-gray-800',
            icon: '❓'
        };
    };

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

            // Initial fetch
            fetchApplicationData(parsedUser.user_id);

            // Set up polling for real-time updates (every 30 seconds)
            const interval = setInterval(() => {
                fetchApplicationData(parsedUser.user_id);
            }, 30000);

            return () => clearInterval(interval);
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
        <BusinessNavbar />

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
                  {/* Application Status Display */}
                  {hasApplication && applicationStatus && (
                    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Application Status</h3>
                        <div className="flex items-center space-x-3">
                          {lastUpdate && (
                            <span className="text-sm text-gray-500">
                              Last updated: {lastUpdate.toLocaleTimeString()}
                            </span>
                          )}
                          <button
                            onClick={() => userInfo && fetchApplicationData(userInfo.user_id)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getStatusInfo(applicationStatus).color.replace('text-', 'bg-').replace('bg-', '')}`}>
                          {getStatusInfo(applicationStatus).icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-lg font-medium ${getStatusInfo(applicationStatus).color.split(' ')[1]}`}>
                            {getStatusInfo(applicationStatus).label}
                          </h4>
                          <p className="text-gray-600 mt-1">
                            {getStatusInfo(applicationStatus).description}
                          </p>
                          
                          {/* Additional status-specific information */}
                          {applicationData && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {applicationData.submitted_at && (
                                <div>
                                  <span className="font-medium text-gray-700">Submitted:</span>
                                  <span className="ml-2 text-gray-600">
                                    {new Date(applicationData.submitted_at).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {applicationData.auction_end_time && (
                                <div>
                                  <span className="font-medium text-gray-700">Auction Ends:</span>
                                  <span className="ml-2 text-gray-600">
                                    {new Date(applicationData.auction_end_time).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {applicationData.offers_count !== undefined && (
                                <div>
                                  <span className="font-medium text-gray-700">Offers Received:</span>
                                  <span className="ml-2 text-gray-600">{applicationData.offers_count}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <YourApplication user={userInfo} />
                  <ApprovedLeadReaction user={userInfo} />
                  <RejectionReaction user={userInfo} />
                  {userInfo && businessInfo && (
                    <OfferSelection 
                      user={userInfo} 
                      applicationId={businessInfo.application_id} 
                    />
                  )}
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
