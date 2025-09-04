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
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const { t } = useLanguage()

  // Early return if businessInfo is not loaded yet
  if (!businessInfo) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-8 py-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
            <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Business Information...</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Please wait while we load your business information.
          </p>
        </div>
      </div>
    )
  }

  // Money formatting function to add commas every 3 digits
  const formatMoney = (amount) => {
    if (!amount) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  // Helper function to display value or "Not Provided"
  const displayValue = (value, defaultValue = 'Not Provided') => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-500 italic">{defaultValue}</span>;
    }
    return value;
  };

  // Handle edit mode
  const handleEdit = () => {
    setEditData({
      trade_name: businessInfo?.trade_name || '',
      cr_national_number: businessInfo?.cr_national_number || '',
      cr_number: businessInfo?.cr_number || '',
      address: businessInfo?.address || '',
      city: businessInfo?.city || '',
      legal_form: businessInfo?.legal_form || '',
      sector: businessInfo?.sector || '',
      cr_capital: businessInfo?.cr_capital || '',
      cash_capital: businessInfo?.cash_capital || '',
      in_kind_capital: businessInfo?.in_kind_capital || '',
      issue_date_gregorian: businessInfo?.issue_date_gregorian || '',
      confirmation_date_gregorian: businessInfo?.confirmation_date_gregorian || '',
      has_ecommerce: businessInfo?.has_ecommerce || false,
      store_url: businessInfo?.store_url || '',
      management_structure: businessInfo?.management_structure || '',
      management_managers: businessInfo?.management_managers || [],
      contact_person: businessInfo?.contact_person || '',
      contact_person_number: businessInfo?.contact_person_number || ''
    });
    setIsEditing(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Here you would call an API to update the business information
      console.log('Saving updated business info:', editData);
      // TODO: Implement API call to update business information
      
      setIsEditing(false);
      // Optionally refresh the data or update the local state
    } catch (error) {
      console.error('Error saving business information:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

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
          <div className="bg-white border-b border-gray-200 px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <BuildingOfficeIcon className="h-7 w-7 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{t('business.yourInformation')}</h1>
                  <p className="text-gray-600 mt-1">{t('business.reviewInformation')}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium shadow-sm"
                  >
                    Edit Information
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium shadow-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
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
        <div className="px-8 py-8">
          {/* Business Information Section */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 text-purple-600 mr-3" />
              Business Information
            </h4>
            
            {/* List-based layout */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {/* Company Name */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Company Name</span>
                  </div>
                                          <span className="text-sm text-gray-900 font-semibold">{displayValue(businessInfo?.trade_name)}</span>
                </div>

                {/* CR National Number */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">CR National Number</span>
                  </div>
                                          <span className="text-sm text-gray-900 font-semibold">{displayValue(businessInfo?.cr_national_number)}</span>
                </div>

                {/* CR Number */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">CR Number</span>
                  </div>
                    <span className="text-sm text-gray-900 font-semibold">{displayValue(businessInfo?.cr_number)}</span>
                </div>

                {/* Registration Status */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <InformationCircleIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Registration Status</span>
                  </div>
                                          <span className="text-sm text-gray-900 font-semibold capitalize">{displayValue(businessInfo?.registration_status)}</span>
                </div>

                {/* Headquarters City */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <MapPinIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Headquarters City</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">{displayValue(businessInfo.address)}</span>
                </div>

                {/* Legal Form */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Legal Form</span>
                  </div>
                                          <span className="text-sm text-gray-900 font-semibold">{displayValue(businessInfo?.legal_form)}</span>
                </div>

                {/* E-commerce Status */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <GlobeAltIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">E-commerce Activities</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                                          {businessInfo?.has_ecommerce !== undefined ? (businessInfo?.has_ecommerce ? 'Yes' : 'No') : displayValue(businessInfo?.has_ecommerce, 'Not Provided')}
                  </span>
                </div>

                {/* Store URL */}
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                      <GlobeAltIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">E-commerce Store</span>
                  </div>
                  <div className="text-sm text-gray-900 font-semibold">
                    {businessInfo?.store_url ? (
                      <a href={businessInfo?.store_url} target="_blank" rel="noopener noreferrer" 
                         className="hover:underline text-purple-600">
                        {businessInfo?.store_url}
                      </a>
                    ) : (
                      displayValue(businessInfo?.store_url, 'Not Provided')
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="mt-8">
              <h5 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-purple-600 mr-3" />
                Financial Information
              </h5>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {/* CR Capital */}
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                        <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">CR Capital</span>
                    </div>
                    <span className="text-sm text-gray-900 font-semibold">
                      {businessInfo?.cr_capital ? `${formatMoney(businessInfo?.cr_capital)} SAR` : displayValue(businessInfo?.cr_capital, 'Not Provided')}
                    </span>
                  </div>

                  {/* Cash Capital */}
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                        <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Cash Capital</span>
                    </div>
                    <span className="text-sm text-gray-900 font-semibold">
                      {businessInfo?.cash_capital ? `${formatMoney(businessInfo?.cash_capital)} SAR` : displayValue(businessInfo?.cash_capital, 'Not Provided')}
                    </span>
                  </div>

                  {/* In-Kind Capital */}
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                        <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">In-Kind Capital</span>
                    </div>
                    <span className="text-sm text-gray-900 font-semibold">
                      {businessInfo?.in_kind_capital ? `${formatMoney(businessInfo?.in_kind_capital)} SAR` : displayValue(businessInfo?.in_kind_capital, 'Not Provided')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates Information */}
            <div className="mt-8">
              <h5 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-3" />
                Important Dates
              </h5>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                                      {businessInfo?.issue_date_gregorian && (
                      <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                            <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Issue Date</span>
                        </div>
                        <span className="text-sm text-gray-900 font-semibold">{businessInfo?.issue_date_gregorian}</span>
                      </div>
                    )}

                                      {businessInfo?.confirmation_date_gregorian && (
                      <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                            <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Confirmation Date</span>
                        </div>
                        <span className="text-sm text-gray-900 font-semibold">{businessInfo?.confirmation_date_gregorian}</span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Business Activities */}
            {businessInfo?.sector && (
              <div className="mt-8">
                <h5 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-purple-600 mr-3" />
                  Business Activities
                </h5>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="space-y-3">
                    {(() => {
                      // Split activities by comma and clean them up
                      const activities = businessInfo?.sector
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

                      // Display each activity on a new line
                      return activities.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 leading-relaxed">
                            {activity}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Management Structure */}
            <div className="mt-8">
              <h5 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <UserIcon className="h-5 w-5 text-purple-600 mr-3" />
                Management Structure
              </h5>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Management Structure</span>
                    </div>
                    <span className="text-sm text-gray-900 font-semibold">
                      {displayValue(businessInfo?.management_structure)}
                    </span>
                  </div>

                  {/* Management Team */}
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Management Team Members</span>
                    </div>
                    <div className="text-sm text-gray-900 font-semibold text-right max-w-xs">
                      {businessInfo?.management_managers ? (() => {
                        try {
                          const managers = typeof businessInfo?.management_managers === 'string' 
                            ? JSON.parse(businessInfo?.management_managers) 
                            : businessInfo?.management_managers;
                          
                          if (Array.isArray(managers) && managers.length > 0) {
                            return managers.map((manager, index) => (
                              <span key={index} className="block">
                                {typeof manager === 'object' ? manager.name : manager}
                              </span>
                            ));
                          } else if (typeof managers === 'string' && managers.trim()) {
                            return <span>{managers}</span>;
                          }
                          return displayValue(businessInfo?.management_managers, 'Not Provided');
                        } catch (error) {
                          console.error('Error parsing management_managers:', error);
                          return displayValue(businessInfo?.management_managers, 'Not Provided');
                        }
                      })() : displayValue(businessInfo?.management_managers, 'Not Provided')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Footer Note */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                <ExclamationTriangleIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">{t('business.needToUpdateInformation')}</h4>
                <p className="text-sm text-gray-600">
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
