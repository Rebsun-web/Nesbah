'use client'
import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'

export function BusinessInformation({ businessInfo }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!businessInfo) {
    return (
        <div className="rounded-lg bg-[#F4F4F4] p-4 sm:p-8 shadow">
          <h3 className="text-base font-semibold text-[#742CFF]">Business Information</h3>
          <p className="mt-4 text-sm text-gray-600">Loading or no data available.</p>
        </div>
    )
  }

  return (
    <div className="rounded-lg bg-[#F4F4F4] p-4 shadow sm:p-8">
      {/* Header with toggle on mobile */}
      <div className="flex items-center justify-between sm:block sm:px-0">
        <h3 className="text-base font-semibold text-[#742CFF]">
          Business Information
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-[#742CFF] focus:outline-none sm:hidden"
        >
          {isOpen ? (
            <>
              Hide <ChevronUpIcon className="h-4 w-4" />
            </>
          ) : (
            <>
              Show <ChevronDownIcon className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Details section */}
      <div className={`${isOpen ? 'block' : 'hidden'} mt-4 sm:block`}>
        <dl className="grid grid-cols-1 gap-x-2 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-900">Trade name</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.trade_name}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Address</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.address}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">
              CR National Number
            </dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.cr_national_number}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-900">CR Number</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.cr_number}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Activities</dt>
            <dd className="mt-1 text-sm text-gray-700 space-y-1">
              {businessInfo.sector?.split(',').map((activity, index) => (
                  <div key={index}> {activity.trim()}</div>
              ))}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-900">Capital</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.cr_capital} SAR
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Cash capital</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.cash_capital} SAR
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">
              In kind capital
            </dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.in_kind_capital} SAR
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Website</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.store_url}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Contact Info</dt>
            <dd className="mt-1 text-sm text-gray-700">
              {businessInfo.contact_person && (
                  <div>Contact Person: {businessInfo.contact_person}</div>
              )}
              {businessInfo.contact_person_number && (
                  <div>Contact Number: {businessInfo.contact_person_number}</div>
              )}
              {businessInfo.contact_info?.email && (
                  <div>Email: {businessInfo.contact_info.email}</div>
              )}
              {businessInfo.contact_info?.mobileNo && (
                  <div>Mobile: {businessInfo.contact_info.mobileNo}</div>
              )}
              {businessInfo.contact_info?.phoneNo && (
                  <div>Phone: {businessInfo.contact_info.phoneNo}</div>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-sm font-medium text-gray-900">About</dt>
            <dd className="mt-1 text-sm text-gray-700">
              This section could describe the business more if needed.
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-gray-900">
              Wrong information? Contact us.
            </p>
          </div>
        </dl>
      </div>
    </div>
  )
}
