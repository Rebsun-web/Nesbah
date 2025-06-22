'use client'
import { useState } from 'react'
import { PaperClipIcon } from '@heroicons/react/20/solid'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid'

export function BusinessFinancialInformation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-lg bg-[#F4F4F4] p-4 sm:p-8 shadow">
      {/* Header with toggle on mobile */}
      <div className="flex items-center justify-between sm:px-0 sm:block">
        <h3 className="text-base font-semibold text-[#742CFF]">Financial Information</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="sm:hidden text-[#742CFF] focus:outline-none flex items-center gap-1 text-sm"
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
      <div className={`${isOpen ? 'block' : 'hidden'} sm:block mt-4`}>
        <dl className="grid grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-900">Full name</dt>
            <dd className="mt-1 text-sm text-gray-700">Margot Foster</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Application for</dt>
            <dd className="mt-1 text-sm text-gray-700">Backend Developer</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Email address</dt>
            <dd className="mt-1 text-sm text-gray-700">margotfoster@example.com</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-900">Salary expectation</dt>
            <dd className="mt-1 text-sm text-gray-700">$120,000</dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-sm font-medium text-gray-900">About</dt>
            <dd className="mt-1 text-sm text-gray-700">
              Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim incididunt cillum culpa consequat.
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-gray-900">Wrong information? Contact us.</p>
          </div>
        </dl>
      </div>
    </div>
  )
}
