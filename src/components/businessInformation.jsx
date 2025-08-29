'use client'
import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
    BuildingOfficeIcon,
    MapPinIcon,
    DocumentTextIcon,
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    CurrencyDollarIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export function BusinessInformation({ businessInfo }) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  console.log('🔍 BusinessInformation: Received businessInfo:', businessInfo);
  console.log('🔍 BusinessInformation: Data structure:', {
    // Core Business Information
    trade_name: businessInfo?.trade_name,
    cr_national_number: businessInfo?.cr_national_number,
    cr_number: businessInfo?.cr_number,
    cr_capital: businessInfo?.cr_capital,
    
    // Location & Address
    address: businessInfo?.address,
    city: businessInfo?.city,
    
    // Business Details
    registration_status: businessInfo?.registration_status,
    sector: businessInfo?.sector,
    legal_form: businessInfo?.legal_form,
    
    // Financial Information
    cash_capital: businessInfo?.cash_capital,
    in_kind_capital: businessInfo?.in_kind_capital,
    
    // Dates
    issue_date_gregorian: businessInfo?.issue_date_gregorian,
    confirmation_date_gregorian: businessInfo?.confirmation_date_gregorian,
    
    // Management Structure
    management_structure: businessInfo?.management_structure,
    management_managers: businessInfo?.management_managers,
    
    // E-commerce Information
    has_ecommerce: businessInfo?.has_ecommerce,
    store_url: businessInfo?.store_url,
    
    // Contact Information
    contact_person: businessInfo?.contact_person,
    contact_person_number: businessInfo?.contact_person_number,
    contact_info: businessInfo?.contact_info
  });

  // Debug contact information specifically
  if (businessInfo?.contact_info) {
    console.log('🔍 BusinessInformation: Raw contact_info:', businessInfo.contact_info);
    try {
      const parsedContactInfo = typeof businessInfo.contact_info === 'string' 
        ? JSON.parse(businessInfo.contact_info) 
        : businessInfo.contact_info;
      console.log('🔍 BusinessInformation: Parsed contact_info:', parsedContactInfo);
    } catch (error) {
      console.error('🔍 BusinessInformation: Error parsing contact_info:', error);
    }
  }

  if (!businessInfo) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <BuildingOfficeIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{t('business.yourInformation')}</h1>
                  <p className="text-indigo-100">{t('business.reviewInformation')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {t('business.loadingMessage')}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
                <BuildingOfficeIcon className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('business.noInformationAvailable')}</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                {t('business.noInformationMessage')}
              </p>
            </div>
          </div>
        </div>
        </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <BuildingOfficeIcon className="h-7 w-7 text-white" />
              </div>
                              <div>
                  <h1 className="text-2xl font-bold text-white">{t('business.yourInformation')}</h1>
                  <p className="text-indigo-100">{t('business.reviewInformation')}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
                className="sm:hidden inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
        >
          {isOpen ? (
            <>
                    <ChevronUpIcon className="h-4 w-4 mr-2" />
                    Hide
            </>
          ) : (
            <>
                    <ChevronDownIcon className="h-4 w-4 mr-2" />
                    Show
            </>
          )}
        </button>
      </div>
          </div>
          </div>

        {/* Status Bar */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {t('business.informationDisplayedBelow')}
            </p>
          </div>
          </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Business Information Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 mr-2" />
              {t('business.businessInformationTitle')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Core Business Information */}
              {businessInfo.trade_name && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-medium text-blue-700">Company Name</div>
                      <div className="text-sm font-bold text-blue-900">{businessInfo.trade_name}</div>
                    </div>
                  </div>
                </div>
              )}

              {businessInfo.cr_national_number && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-medium text-purple-700">CR National Number</div>
                      <div className="text-sm font-bold text-purple-900">{businessInfo.cr_national_number}</div>
                    </div>
                  </div>
                </div>
              )}

              {businessInfo.cr_number && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-xs font-medium text-orange-700">CR Number</div>
                      <div className="text-sm font-bold text-orange-900">{businessInfo.cr_number}</div>
                    </div>
                  </div>
                </div>
              )}

              {businessInfo.registration_status && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center space-x-2">
                    <InformationCircleIcon className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-xs font-medium text-green-700">Registration Status</div>
                      <div className="text-sm font-bold text-green-900 capitalize">{businessInfo.registration_status}</div>
                    </div>
                  </div>
                </div>
              )}

              {businessInfo.address && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-teal-600" />
                    <div>
                      <div className="text-xs font-medium text-teal-700">Headquarters City</div>
                      <div className="text-sm font-bold text-teal-900">{businessInfo.address}</div>
                    </div>
                  </div>
                </div>
              )}

              {businessInfo.legal_form && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-indigo-600" />
                    <div>
                      <div className="text-xs font-medium text-indigo-700">Legal Form</div>
                      <div className="text-sm font-bold text-indigo-900">{businessInfo.legal_form}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* E-commerce Status */}
              {businessInfo.has_ecommerce !== undefined && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-medium text-emerald-700">E-commerce Activities</div>
                      <div className="text-sm font-bold text-emerald-900">
                        {businessInfo.has_ecommerce ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Store URL */}
              {businessInfo.store_url && (
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-3 border border-sky-100">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-sky-600" />
                    <div>
                      <div className="text-xs font-medium text-sky-700">E-commerce Store</div>
                      <div className="text-sm font-bold text-sky-900">
                        <a href={businessInfo.store_url} target="_blank" rel="noopener noreferrer" 
                           className="hover:underline text-blue-600">
                          {businessInfo.store_url}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Information */}
            <div className="mt-6">
              <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                <CurrencyDollarIcon className="h-4 w-4 text-green-600 mr-2" />
                Financial Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {businessInfo.cr_capital && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-xs font-medium text-green-700">CR Capital</div>
                        <div className="text-sm font-bold text-green-900">{businessInfo.cr_capital?.toLocaleString()} SAR</div>
                      </div>
                    </div>
                  </div>
                )}

                {businessInfo.cash_capital && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-xs font-medium text-blue-700">Cash Capital</div>
                        <div className="text-sm font-bold text-blue-900">{businessInfo.cash_capital?.toLocaleString()} SAR</div>
                      </div>
                    </div>
                  </div>
                )}

                {businessInfo.in_kind_capital && (
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="text-xs font-medium text-purple-700">In-Kind Capital</div>
                        <div className="text-sm font-bold text-purple-900">{businessInfo.in_kind_capital?.toLocaleString()} SAR</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dates Information */}
            <div className="mt-6">
              <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                <DocumentTextIcon className="h-4 w-4 text-orange-600 mr-2" />
                Important Dates
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessInfo.issue_date_gregorian && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-xs font-medium text-orange-700">Issue Date</div>
                        <div className="text-sm font-bold text-orange-900">{businessInfo.issue_date_gregorian}</div>
                      </div>
                    </div>
                  </div>
                )}

                {businessInfo.confirmation_date_gregorian && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-teal-600" />
                      <div>
                        <div className="text-xs font-medium text-teal-700">Confirmation Date</div>
                        <div className="text-sm font-bold text-teal-900">{businessInfo.confirmation_date_gregorian}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Activities */}
            {businessInfo.sector && (
              <div className="mt-6">
                <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 text-indigo-600 mr-2" />
                  Business Activities
                </h5>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-start space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-indigo-700 mb-2">Sector Activities</div>
                      <div className="space-y-2">
                        {(() => {
                          // Preprocess the sector activities
                          const activities = businessInfo.sector
                            .split(',')
                            .map(activity => activity.trim())
                            .filter(activity => activity.length > 0)
                            .map(activity => {
                              // Clean up common formatting issues
                              let cleaned = activity
                                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                                .replace(/^and\s+/i, '') // Remove leading "and"
                                .replace(/^,\s*/, '') // Remove leading comma
                                .replace(/,\s*$/, ''); // Remove trailing comma
                              
                              // Capitalize first letter of each word
                              cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
                              
                              return cleaned;
                            });

                          // Group activities by type for better organization
                          const groupedActivities = {
                            'Manufacturing & Production': [],
                            'Retail & Sales': [],
                            'Storage & Logistics': [],
                            'Education & Services': [],
                            'Other Activities': []
                          };

                          activities.forEach(activity => {
                            const lowerActivity = activity.toLowerCase();
                            
                            if (lowerActivity.includes('manufacture') || lowerActivity.includes('production') || 
                                lowerActivity.includes('packing') || lowerActivity.includes('drying')) {
                              groupedActivities['Manufacturing & Production'].push(activity);
                            } else if (lowerActivity.includes('retail') || lowerActivity.includes('sale') || 
                                     lowerActivity.includes('supermarket') || lowerActivity.includes('cooperative')) {
                              groupedActivities['Retail & Sales'].push(activity);
                            } else if (lowerActivity.includes('storage') || lowerActivity.includes('warehouse') || 
                                     lowerActivity.includes('logistics')) {
                              groupedActivities['Storage & Logistics'].push(activity);
                            } else if (lowerActivity.includes('university') || lowerActivity.includes('education') || 
                                     lowerActivity.includes('service')) {
                              groupedActivities['Education & Services'].push(activity);
                            } else {
                              groupedActivities['Other Activities'].push(activity);
                            }
                          });

                          // Filter out empty groups
                          const nonEmptyGroups = Object.entries(groupedActivities)
                            .filter(([category, activities]) => activities.length > 0);

                          return nonEmptyGroups.map(([category, categoryActivities], groupIndex) => (
                            <div key={groupIndex} className="mb-3 last:mb-0">
                              <div className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wide">
                                {category}
                              </div>
                              <div className="space-y-1">
                                {categoryActivities.map((activity, activityIndex) => (
                                  <div key={activityIndex} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-indigo-900 leading-relaxed">
                                      {activity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Management Team */}
            {businessInfo.management_managers && (
              <div className="mt-6">
                <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                  <UserIcon className="h-4 w-4 text-pink-600 mr-2" />
                  Management Team
                </h5>
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-3 border border-pink-100">
                  <div className="flex items-start space-x-2">
                    <UserIcon className="h-4 w-4 text-pink-600 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-pink-700">Management Team Members</div>
                      <div className="text-sm text-pink-900">
                        {(() => {
                          try {
                            const managers = typeof businessInfo.management_managers === 'string' 
                              ? JSON.parse(businessInfo.management_managers) 
                              : businessInfo.management_managers;
                            
                            if (Array.isArray(managers)) {
                              return managers.map((manager, index) => (
                                <span key={index} className="font-medium">
                                  {typeof manager === 'object' ? manager.name : manager}
                                  {index < managers.length - 1 ? ', ' : ''}
                                </span>
                              ));
                            } else if (typeof managers === 'string') {
                              return <span className="font-medium">{managers}</span>;
                            }
                            return <span className="font-medium">No management team information available</span>;
                          } catch (error) {
                            console.error('Error parsing management_managers:', error);
                            return <span className="font-medium">Management team information unavailable</span>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* E-commerce Information */}
            {businessInfo.has_ecommerce && (
              <div className="mt-6">
                <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                  <GlobeAltIcon className="h-4 w-4 text-green-600 mr-2" />
                  E-commerce Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center space-x-2">
                      <GlobeAltIcon className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-xs font-medium text-green-700">E-commerce Status</div>
                        <div className="text-sm font-bold text-green-900">{businessInfo.has_ecommerce ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </div>

                  {businessInfo.store_url && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center space-x-2">
                        <GlobeAltIcon className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-xs font-medium text-blue-700">Store URL</div>
                          <div className="text-sm font-bold text-blue-900">
                            <a href={businessInfo.store_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                              {businessInfo.store_url}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* Footer Note */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                <ExclamationTriangleIcon className="h-3 w-3 text-orange-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{t('business.needToUpdateInformation')}</h4>
                <p className="text-sm text-slate-600">
              {t('business.wrongInformationContact')}
            </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
