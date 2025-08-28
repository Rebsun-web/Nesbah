'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import {
    DescriptionDetails,
    DescriptionList,
    DescriptionTerm,
} from '@/components/description-list'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import {
    BanknotesIcon,
    CalendarIcon,
    ChevronLeftIcon,
} from '@heroicons/react/16/solid'
import { useViewTracking } from '@/hooks/useViewTracking';


export default function LeadPage({ params }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const [application, setApplication] = useState(null)
    const [bankUser, setBankUser] = useState(null)
    const [isPurchased, setIsPurchased] = useState(false)
    const [showRejectedModal, setShowRejectedModal] = useState(false);
    const [submittedOffer, setSubmittedOffer] = useState({});
    const [rejectionInfo, setRejectionInfo] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('✅ Logged in bank user:', parsed); // ← LOG HERE
            setBankUser(parsed);
        }
    }, []);

    const fetchApplication = async () => {
        if (!bankUser || !bankUser.user_id) return;

        const res = await fetch(`/api/leads/${resolvedParams.id}`, {
            headers: {
                'x-user-id': bankUser.user_id,
            },
        });

        const data = await res.json();
        if (data.success) {
            setApplication(data.data);
            setIsPurchased(
                data.data.contact_info &&
                Object.keys(data.data.contact_info).length > 0
            );

            setSubmittedOffer(data.offer_data || {});

            const rejectionByUser = Array.isArray(data.data.rejection_data)
                ? data.data.rejection_data.find(
                      (r) => Number(r.user_id) === Number(bankUser.user_id)
                  )
                : null;
            setRejectionInfo(rejectionByUser || null);
        }
    }

    useEffect(() => {
        fetchApplication()
    }, [bankUser, resolvedParams.id])

    // Add view tracking for this application
    useViewTracking(
        resolvedParams.id, 
        bankUser?.user_id, 
        !!bankUser && !!resolvedParams.id
    );

    if (!application) {
        return <p className="px-4 py-6">Loading application...</p>
    }

    const contactInfo = application.contact_info || {}
    const sector = Array.isArray(application.sector)
        ? application.sector.map((a) => a.name).join(', ')
        : application.sector || 'N/A'

    return (
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="max-lg:hidden">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm/6 text-zinc-500"
                >
                    <ChevronLeftIcon className="size-4 fill-zinc-400" />
                    Back
                </button>
            </div>

            <div className="mt-4 lg:mt-8">
                <div className="flex items-center gap-4">
                    <Heading>Application #{application.application_id}</Heading>
                    <Badge color={isPurchased ? 'lime' : 'rose'}>
                        {isPurchased ? 'Purchased' : 'Unopened'}
                    </Badge>
                </div>

                <div className="isolate mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
            <span className="flex items-center gap-3 text-sm text-zinc-800">
              <BanknotesIcon className="size-4 shrink-0 fill-zinc-400" />
              Cash capital: {application.cash_capital ?? 'N/A'}
            </span>

                        <span className="flex items-center gap-3 text-sm text-zinc-800">
              <BanknotesIcon className="size-4 shrink-0 fill-zinc-400" />
              In kind capital: {application.in_kind_capital ?? 'N/A'}
            </span>

                        <span className="flex items-center gap-3 text-sm text-zinc-800">
              <CalendarIcon className="size-4 shrink-0 fill-zinc-400" />
              Submitted: {new Date(application.submitted_at).toLocaleString()}
            </span>
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <Subheading>Business Details</Subheading>
                <Divider className="mt-4" />
                <DescriptionList>
                    <DescriptionTerm>Business Name</DescriptionTerm>
                    <DescriptionDetails>{application.trade_name}</DescriptionDetails>

                    <DescriptionTerm>CR number</DescriptionTerm>
                    <DescriptionDetails>
                        {application.cr_national_number}
                    </DescriptionDetails>

                    <DescriptionTerm>Sector</DescriptionTerm>
                    <DescriptionDetails>{sector}</DescriptionDetails>

                    <DescriptionTerm>City</DescriptionTerm>
                    <DescriptionDetails>{application.address}</DescriptionDetails>

                    <DescriptionTerm>Store URL</DescriptionTerm>
                    <DescriptionDetails>
                        {application.store_url || 'N/A'}
                    </DescriptionDetails>

                    <DescriptionTerm>Own POS System</DescriptionTerm>
                    <DescriptionDetails>
                        {application.own_pos_system ? 'Yes' : 'No'}
                    </DescriptionDetails>

                    <DescriptionTerm>Number of POS device</DescriptionTerm>
                    <DescriptionDetails>{application.number_of_pos_devices}</DescriptionDetails>

                    <DescriptionTerm>City of operations</DescriptionTerm>
                    <DescriptionDetails>{application.city_of_operation}</DescriptionDetails>

                    <DescriptionTerm>Notes</DescriptionTerm>
                    <DescriptionDetails>{application.notes}</DescriptionDetails>

                    <DescriptionTerm>eCommerce</DescriptionTerm>
                    <DescriptionDetails>
                        {application.has_ecommerce ? 'Yes' : 'No'}{' '}
                        {application.store_url ? `(${application.store_url})` : ''}
                    </DescriptionDetails>

                    <DescriptionTerm>Uploaded Document</DescriptionTerm>
                    <DescriptionDetails>
                        {application.uploaded_document ? (
                            <a
                                href={`/api/leads/${application.application_id}/document`}
                                className="text-indigo-600 hover:underline"
                            >
                                {application.uploaded_filename || 'Download file'}
                            </a>
                        ) : (
                            'N/A'
                        )}
                    </DescriptionDetails>
                </DescriptionList>
            </div>

            <div className="mt-6">
                <Subheading>Contact Information</Subheading>
                <Divider className="mt-4" />
                <DescriptionList>
                    <DescriptionTerm>Contact person</DescriptionTerm>
                    <DescriptionDetails>
                        {isPurchased ? application.contact_person || 'N/A' : 'Hidden'}
                    </DescriptionDetails>

                    <DescriptionTerm>Mobile number 1</DescriptionTerm>
                    <DescriptionDetails>
                        {isPurchased ? application.contact_person_number || 'N/A' : 'Hidden'}
                    </DescriptionDetails>

                    <DescriptionTerm>Mobile number 2</DescriptionTerm>
                    <DescriptionDetails>
                        {isPurchased ? contactInfo.mobileNo || 'N/A' : 'Hidden'}
                    </DescriptionDetails>

                    <DescriptionTerm>Email</DescriptionTerm>
                    <DescriptionDetails>
                        {isPurchased ? contactInfo.email || 'N/A' : 'Hidden'}
                    </DescriptionDetails>

                    <DescriptionTerm>Phone</DescriptionTerm>
                    <DescriptionDetails>
                        {isPurchased ? contactInfo.phoneNo || 'N/A' : 'Hidden'}
                    </DescriptionDetails>
                </DescriptionList>
            </div>

            {/* Offer and rejection info sections */}

                <div className="mt-12">
                    <Subheading>Submitted Offer</Subheading>
                    <Divider className="mt-4" />
                    <DescriptionList>
                        <DescriptionTerm>Device Setup Fee</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_device_setup_fee || 'N/A'}</DescriptionDetails>
                        <DescriptionTerm>Transaction Fee MADA</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_transaction_fee_mada || 'N/A'}</DescriptionDetails>
                        <DescriptionTerm>Transaction Fee Visa/MC</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_transaction_fee_visa_mc || 'N/A'}</DescriptionDetails>
                        <DescriptionTerm>Settlement Time MADA</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_settlement_time_mada || 'N/A'}</DescriptionDetails>
                        <DescriptionTerm>Comment</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_comment || 'N/A'}</DescriptionDetails>
                        <DescriptionTerm>Uploaded File</DescriptionTerm>
                        <DescriptionDetails>
                            {submittedOffer.uploaded_filename ? (
                                <a
                                    href={`/api/leads/${application.application_id}/offer-file`}
                                    className="text-indigo-600 hover:underline"
                                >
                                    {submittedOffer.uploaded_filename}
                                </a>
                            ) : (
                                'N/A'
                            )}
                        </DescriptionDetails>
                    </DescriptionList>
                </div>


            {rejectionInfo && (
                <div className="mt-12">
                    <Subheading>Rejection Information</Subheading>
                    <Divider className="mt-4" />
                    <DescriptionList>
                        <DescriptionTerm>Rejection Reason</DescriptionTerm>
                        <DescriptionDetails>{rejectionInfo.reason || 'N/A'}</DescriptionDetails>
                        <DescriptionTerm>Rejected At</DescriptionTerm>
                        <DescriptionDetails>{new Date(rejectionInfo.created_at).toLocaleString()}</DescriptionDetails>
                    </DescriptionList>
                </div>
            )}

        </div>
    )
}