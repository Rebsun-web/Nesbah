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
              {businessInfo.trade_name && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
          <div>
                      <div className="text-xs font-medium text-blue-700">{t('business.tradeName')}</div>
                      <div className="text-sm font-bold text-blue-900">{businessInfo.trade_name}</div>
                    </div>
                  </div>
          </div>
              )}

              {businessInfo.address && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-green-600" />
          <div>
                      <div className="text-xs font-medium text-green-700">{t('business.address')}</div>
                      <div className="text-sm font-bold text-green-900">{businessInfo.address}</div>
          </div>
          </div>
          </div>
              )}

              {businessInfo.cr_national_number && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-medium text-purple-700">{t('business.nationalCR')}</div>
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
                      <div className="text-xs font-medium text-orange-700">{t('business.crNumber')}</div>
                      <div className="text-sm font-bold text-orange-900">{businessInfo.cr_number}</div>
                    </div>
                  </div>
                </div>
              )}

              {businessInfo.cr_capital && (
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100">
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-teal-600" />
                    <div>
                      <div className="text-xs font-medium text-teal-700">{t('business.capital')}</div>
                      <div className="text-sm font-bold text-teal-900">{businessInfo.cr_capital} SAR</div>
                    </div>
                  </div>
                </div>
              )}

              {businessInfo.store_url && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-medium text-blue-700">{t('business.website')}</div>
                      <div className="text-sm font-bold text-blue-900">{businessInfo.store_url}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activities - Full Width */}
            {businessInfo.sector && (
              <div className="mt-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-100">
                <div className="flex items-start space-x-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-indigo-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-indigo-700">{t('business.activities')}</div>
                    <div className="text-sm text-indigo-900">
                      {businessInfo.sector?.split(',').map((activity, index) => (
                        <span key={index} className="font-medium">{activity.trim()}{index < businessInfo.sector.split(',').length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Section */}
          {(businessInfo.contact_person || businessInfo.contact_person_number || businessInfo.contact_info) && (
            <div className="mb-6 pt-6 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                {t('business.contactInformation')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessInfo.contact_person && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="text-xs font-medium text-indigo-700">{t('business.contactPerson')}</div>
                        <div className="text-sm font-bold text-indigo-900">{businessInfo.contact_person}</div>
                      </div>
                    </div>
                  </div>
                )}

                {businessInfo.contact_person_number && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-xs font-medium text-green-700">{t('business.contactNumber')}</div>
                        <div className="text-sm font-bold text-green-900">{businessInfo.contact_person_number}</div>
                      </div>
                    </div>
                  </div>
                )}

                {businessInfo.contact_info?.email && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-xs font-medium text-blue-700">{t('business.email')}</div>
                        <div className="text-sm font-bold text-blue-900">{businessInfo.contact_info.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {businessInfo.contact_info?.mobileNo && (
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="text-xs font-medium text-purple-700">{t('business.mobile')}</div>
                        <div className="text-sm font-bold text-purple-900">{businessInfo.contact_info.mobileNo}</div>
                      </div>
                    </div>
                  </div>
                )}

                {businessInfo.contact_info?.phoneNo && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-xs font-medium text-orange-700">{t('business.phone')}</div>
                        <div className="text-sm font-bold text-orange-900">{businessInfo.contact_info.phoneNo}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* About Section */}
          <div className="mb-6 pt-6 border-t border-slate-200">
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
              {t('business.about')}
            </h4>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-100">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-yellow-700">{t('business.companyDescription')}</div>
                  <div className="text-sm text-yellow-900">{t('business.aboutDescription')}</div>
                </div>
              </div>
            </div>
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
