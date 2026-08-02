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
import { useLanguage } from '@/contexts/LanguageContext';


export default function LeadPage({ params }) {
    const { t } = useLanguage()
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
                'x-user-type': bankUser.user_type,
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
        return <p className="px-4 py-6">{t('leads.loadingApplication')}</p>
    }

    const contactInfo = application.contact_info || {}
    const notProvided = t('leads.notProvided')
    const sector = Array.isArray(application.sector)
        ? (() => {
            try {
              return application.sector.map((a) => a.name || 'N/A').join(', ');
            } catch (error) {
              console.error('Error processing sector array:', error);
              return 'Error loading sector data';
            }
          })()
        : application.sector || notProvided

    // Format sector data to display each activity on a new line
    const formattedSector = sector !== notProvided
        ? (() => {
            try {
              return sector.split(', ').map((activity, index) => (
                <div key={index} className="mb-1">
                  {activity.trim() || 'N/A'}
                </div>
              ));
            } catch (error) {
              console.error('Error formatting sector:', error);
              return <div className="text-red-600">Error loading sector data</div>;
            }
          })()
        : notProvided

    return (
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="max-lg:hidden">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm/6 text-zinc-500"
                >
                    <ChevronLeftIcon className="size-4 fill-zinc-400" />
                    {t('leads.back')}
                </button>
            </div>

            <div className="mt-4 lg:mt-8">
                <div className="flex items-center gap-4">
                    <Heading>{t('application.application')} #{application.application_id}</Heading>
                    <Badge color={isPurchased ? 'lime' : 'rose'}>
                        {isPurchased ? t('leads.purchased') : t('leads.unopened')}
                    </Badge>
                </div>

                <div className="isolate mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
            <span className="flex items-center gap-3 text-sm text-zinc-800">
              <BanknotesIcon className="size-4 shrink-0 fill-zinc-400" />
              {t('leads.cashCapital')}: {application.cash_capital ?? notProvided}
            </span>

                        <span className="flex items-center gap-3 text-sm text-zinc-800">
              <BanknotesIcon className="size-4 shrink-0 fill-zinc-400" />
              {t('leads.inKindCapital')}: {application.in_kind_capital ?? notProvided}
            </span>

                        <span className="flex items-center gap-3 text-sm text-zinc-800">
              <CalendarIcon className="size-4 shrink-0 fill-zinc-400" />
              {t('offers.submitted')}: {new Date(application.submitted_at).toLocaleString()}
            </span>
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <Subheading>{t('leads.businessDetails')}</Subheading>
                <Divider className="mt-4" />
                <DescriptionList>
                    <DescriptionTerm>{t('leads.businessName')}</DescriptionTerm>
                    <DescriptionDetails>{application.trade_name}</DescriptionDetails>

                    <DescriptionTerm>{t('leads.crNumber')}</DescriptionTerm>
                    <DescriptionDetails>
                        {application.cr_national_number}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('business.sector')}</DescriptionTerm>
                    <DescriptionDetails>{formattedSector}</DescriptionDetails>

                    <DescriptionTerm>{t('common.city')}</DescriptionTerm>
                    <DescriptionDetails>{application.address}</DescriptionDetails>

                    <DescriptionTerm>{t('leads.storeUrl')}</DescriptionTerm>
                    <DescriptionDetails>
                        {application.store_url || notProvided}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('leads.ownPosSystem')}</DescriptionTerm>
                    <DescriptionDetails>
                        {typeof application.own_pos_system === 'boolean'
                            ? (application.own_pos_system ? t('common.yes') : t('common.no'))
                            : notProvided}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('leads.numberOfPosDevice')}</DescriptionTerm>
                    <DescriptionDetails>{application.number_of_pos_devices}</DescriptionDetails>

                    <DescriptionTerm>{t('leads.cityOfOperation')}</DescriptionTerm>
                    <DescriptionDetails>{application.city_of_operation}</DescriptionDetails>

                    <DescriptionTerm>{t('application.notes')}</DescriptionTerm>
                    <DescriptionDetails>{application.notes}</DescriptionDetails>

                    <DescriptionTerm>{t('leads.eCommerce')}</DescriptionTerm>
                    <DescriptionDetails>
                        {application.has_ecommerce ? t('common.yes') : t('common.no')}{' '}
                        {application.store_url ? `(${application.store_url})` : ''}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('application.uploadedDocument')}</DescriptionTerm>
                    <DescriptionDetails>
                        {application.uploaded_document ? (
                            <a
                                href={`/api/leads/${application.application_id}/document`}
                                className="text-indigo-600 hover:underline"
                            >
                                {application.uploaded_filename || t('leads.downloadFile')}
                            </a>
                        ) : (
                            notProvided
                        )}
                    </DescriptionDetails>
                </DescriptionList>
            </div>

            <div className="mt-6">
                <Subheading>{t('business.contactInformation')}</Subheading>
                <Divider className="mt-4" />
                <DescriptionList>
                    <DescriptionTerm>{t('business.contactPerson')}</DescriptionTerm>
                    <DescriptionDetails>
                        {application.contact_person || notProvided}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('leads.mobileNumber1')}</DescriptionTerm>
                    <DescriptionDetails>
                        {application.contact_person_number || notProvided}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('leads.mobileNumber2')}</DescriptionTerm>
                    <DescriptionDetails>
                        {contactInfo.mobileNo || notProvided}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('business.email')}</DescriptionTerm>
                    <DescriptionDetails>
                        {contactInfo.email || notProvided}
                    </DescriptionDetails>

                    <DescriptionTerm>{t('leads.phone')}</DescriptionTerm>
                    <DescriptionDetails>
                        {contactInfo.phoneNo || notProvided}
                    </DescriptionDetails>
                </DescriptionList>
            </div>

            {/* Offer and rejection info sections */}

                <div className="mt-12">
                    <Subheading>{t('leads.submittedOffer')}</Subheading>
                    <Divider className="mt-4" />
                    <DescriptionList>
                        <DescriptionTerm>{t('offers.deviceSetupFee')}</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_device_setup_fee || notProvided}</DescriptionDetails>
                        <DescriptionTerm>{t('leads.transactionFeeMada')}</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_transaction_fee_mada || notProvided}</DescriptionDetails>
                        <DescriptionTerm>{t('leads.transactionFeeVisaMc')}</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_transaction_fee_visa_mc || notProvided}</DescriptionDetails>
                        <DescriptionTerm>{t('leads.settlementTimeMada')}</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_settlement_time_mada || notProvided}</DescriptionDetails>
                        <DescriptionTerm>{t('leads.comment')}</DescriptionTerm>
                        <DescriptionDetails>{submittedOffer.offer_comment || notProvided}</DescriptionDetails>
                        <DescriptionTerm>{t('leads.uploadedFile')}</DescriptionTerm>
                        <DescriptionDetails>
                            {submittedOffer.uploaded_filename ? (
                                <a
                                    href={`/api/leads/${application.application_id}/offer-file`}
                                    className="text-indigo-600 hover:underline"
                                >
                                    {submittedOffer.uploaded_filename}
                                </a>
                            ) : (
                                notProvided
                            )}
                        </DescriptionDetails>
                    </DescriptionList>
                </div>


            {rejectionInfo && (
                <div className="mt-12">
                    <Subheading>{t('leads.rejectionInformation')}</Subheading>
                    <Divider className="mt-4" />
                    <DescriptionList>
                        <DescriptionTerm>{t('leads.rejectionReason')}</DescriptionTerm>
                        <DescriptionDetails>{rejectionInfo.reason || notProvided}</DescriptionDetails>
                        <DescriptionTerm>{t('leads.rejectedAt')}</DescriptionTerm>
                        <DescriptionDetails>{new Date(rejectionInfo.created_at).toLocaleString()}</DescriptionDetails>
                    </DescriptionList>
                </div>
            )}

        </div>
    )
}
