'use client'

import { useEffect, useState } from 'react'
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
import OfferSentModal from '@/components/OfferSentModal';
import { useViewTracking } from '@/hooks/useViewTracking';
import AuthGuard from '@/components/auth/AuthGuard';


function LeadPageContent({ params }) {
  const router = useRouter()
  const [application, setApplication] = useState(null)
  const [bankUser, setBankUser] = useState(null)
  const [showOfferSentModal, setShowOfferSentModal] = useState(false);
  // Offer info state
  const [submittedOffer, setSubmittedOffer] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('✅ Logged in bank user:', parsed);
        setBankUser(parsed);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
      }
    }
  }, []);

  const fetchApplication = async () => {
    if (!bankUser || !bankUser.user_id) return

    const res = await fetch(`/api/leads/${params.id}`, {
      headers: {
        'x-user-id': bankUser.user_id,
        'x-user-type': bankUser.user_type,
      },
    })

    const data = await res.json()
    if (data.success) {
      setApplication(data.data)
      const offerByUser = Array.isArray(data.data.offer_data)
        ? data.data.offer_data.find(o => Number(o.submitted_by_user_id) === Number(bankUser.user_id))
        : null;
      setSubmittedOffer(offerByUser);
      console.log('🎯 Matched offer for this user:', offerByUser);
      // Prefill offerForm inline if offerByUser exists
      if (offerByUser && typeof offerByUser === 'object') {
        console.log('💡 Prefilling form with submitted offer (inline):', offerByUser);

        setOfferForm({
          offer_device_setup_fee: offerByUser.offer_device_setup_fee || '',
          offer_transaction_fee_mada: offerByUser.offer_transaction_fee_mada || '',
          offer_transaction_fee_visa_mc: offerByUser.offer_transaction_fee_visa_mc || '',
          offer_settlement_time_mada: offerByUser.offer_settlement_time_mada || '',
          offer_comment: offerByUser.offer_comment || '',
          file: offerByUser.uploaded_filename
            ? {
                name: offerByUser.uploaded_filename,
                type: offerByUser.uploaded_mimetype || 'application/octet-stream'
              }
            : null,
        });
      }
    }
  }

  useEffect(() => {
    fetchApplication()
  }, [bankUser, params.id])

  // Add view tracking for this application
  useViewTracking(
    params.id, 
    bankUser?.user_id, 
    !!bankUser && !!params.id
  );

  // Handle back button click: navigate back to bank portal
  const handleBackClick = () => {
    if (isNavigating) return; // Prevent multiple clicks
    
    setIsNavigating(true);
    try {
      router.push('/bankPortal');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to home page if bank portal fails
      router.push('/');
    } finally {
      setIsNavigating(false);
    }
  };

  // Offer form state and handlers
  const [offerForm, setOfferForm] = useState({
    offer_device_setup_fee: '',
    offer_transaction_fee_mada: '',
    offer_transaction_fee_visa_mc: '',
    offer_settlement_time_mada: '',
    offer_settlement_time_visa_mc: '',
    offer_comment: '',
    offer_terms: '',
    settlement_time: '',
    file: null,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [feeAccepted, setFeeAccepted] = useState(false);
  const [showFeeNotification, setShowFeeNotification] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);

  const handleOfferChange = (e) => {
    const { name, value } = e.target;
    setOfferForm((prev) => ({ ...prev, [name]: value }));
  };

  // Update file handler to store file in offerForm state as well
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setOfferForm((prev) => ({ ...prev, file: file }));
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!bankUser?.user_id) return;

    // Show fee notification first if not already accepted
    if (!feeAccepted) {
      setShowFeeNotification(true);
      return;
    }

    const formData = new FormData();
    Object.entries(offerForm).forEach(([key, value]) => {
      // Don't append the file here, will append separately below.
      if (key !== 'file') {
        formData.append(key, value);
      }
    });

    if (selectedFile) {
      formData.append('uploaded_file', selectedFile);
    }
    formData.append('action', 'approve');

    try {
      const res = await fetch(`/api/leads/${params.id}/purchased_applications`, {
        method: 'POST',
        headers: {
          'x-user-id': bankUser.user_id,
        },
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        console.log('✅ Offer submitted successfully');
        setShowOfferSentModal(true);
        setShowOfferForm(false);
        setFeeAccepted(false);
        fetchApplication(); // Refresh the lead info
      } else {
        console.error('❌ Failed to submit offer:', result.message);
      }
    } catch (error) {
      console.error('❌ Error submitting offer:', error);
    }
  };

  // New handler for starting offer submission
  const handleStartOffer = () => {
    setShowFeeNotification(true);
  };

  // Handler for accepting the fee
  const handleAcceptFee = () => {
    setFeeAccepted(true);
    setShowFeeNotification(false);
    setShowOfferForm(true);
  };

  // Handler for declining the fee
  const handleDeclineFee = () => {
    setShowFeeNotification(false);
    setFeeAccepted(false);
  };

  if (!application) {
    return <p className="px-4 py-6">Loading application...</p>
  }

  const contactInfo = application.contact_info || {}
  const sector = Array.isArray(application.sector)
      ? application.sector.map((a) => a.name).join(', ')
      : application.sector || 'Not Provided'
  
  // Format sector data to display each activity on a new line
  const formattedSector = sector !== 'Not Provided' 
    ? sector.split(', ').map((activity, index) => (
        <div key={index} className="mb-1">
          {activity.trim()}
        </div>
      ))
    : 'Not Provided'

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="max-lg:hidden">
        <button
          type="button"
          onClick={handleBackClick}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400" />
          Back
        </button>
      </div>
      <div className="lg:hidden">
        <button
          key={`back-${!!submittedOffer}`}
          type="button"
          onClick={handleBackClick}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400" />
          Back
        </button>
      </div>



      <div className="mt-4 lg:mt-8">
        <div className="flex items-center gap-4">
          <Heading>Application #{application.application_id}</Heading>
          <Badge color="rose">
            Live Auction
          </Badge>
        </div>

        <div className="isolate mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
            <span className="flex items-center gap-3 text-sm text-zinc-800">
              <BanknotesIcon className="size-4 shrink-0 fill-zinc-400" />
              Cash capital: {application.cash_capital ?? 'Not Provided'}
            </span>

            <span className="flex items-center gap-3 text-sm text-zinc-800">
              <BanknotesIcon className="size-4 shrink-0 fill-zinc-400" />
              In kind capital: {application.in_kind_capital ?? 'Not Provided'}
            </span>

            <span className="flex items-center gap-3 text-sm text-zinc-800">
              <CalendarIcon className="size-4 shrink-0 fill-zinc-400" />
              Submitted: {new Date(application.submitted_at).toLocaleString()}
            </span>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleStartOffer}
              className="bg-gradient-to-r from-[#1E1851] to-[#4436B7] text-white"
            >
              Submit Offer
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Subheading>Application Details</Subheading>
        <Divider className="mt-4" />
        <DescriptionList>
          <DescriptionTerm>POS Provider</DescriptionTerm>
          <DescriptionDetails>
            {application.pos_provider_name || 'N/A'}
          </DescriptionDetails>

          <DescriptionTerm>POS Age</DescriptionTerm>
          <DescriptionDetails>
            {application.pos_age_duration_months ? `${application.pos_age_duration_months} months` : 'N/A'}
          </DescriptionDetails>

          <DescriptionTerm>Monthly Sales</DescriptionTerm>
          <DescriptionDetails>
            {application.avg_monthly_pos_sales ? `SAR ${application.avg_monthly_pos_sales.toLocaleString()}` : 'N/A'}
          </DescriptionDetails>

          <DescriptionTerm>Financing Amount</DescriptionTerm>
          <DescriptionDetails>
            {application.requested_financing_amount ? `SAR ${application.requested_financing_amount.toLocaleString()}` : 'N/A'}
          </DescriptionDetails>

          <DescriptionTerm>Repayment Period</DescriptionTerm>
          <DescriptionDetails>
            {application.preferred_repayment_period_months ? `${application.preferred_repayment_period_months} months` : 'N/A'}
          </DescriptionDetails>

          <DescriptionTerm>Own POS System</DescriptionTerm>
          <DescriptionDetails>
            {application.own_pos_system ? 'Yes' : 'No'}
          </DescriptionDetails>

          <DescriptionTerm>Number of POS Devices</DescriptionTerm>
          <DescriptionDetails>{application.number_of_pos_devices || 'N/A'}</DescriptionDetails>

          <DescriptionTerm>City of Operations</DescriptionTerm>
          <DescriptionDetails>{application.city_of_operation || 'N/A'}</DescriptionDetails>

          <DescriptionTerm>Has E-commerce</DescriptionTerm>
          <DescriptionDetails>
            {application.has_ecommerce ? 'Yes' : 'No'}
            {application.store_url && ` (${application.store_url})`}
          </DescriptionDetails>

          <DescriptionTerm>Notes</DescriptionTerm>
          <DescriptionDetails>{application.notes || 'N/A'}</DescriptionDetails>

          <DescriptionTerm>Uploaded Document</DescriptionTerm>
          <DescriptionDetails>
            {application.uploaded_document ? (
              <a
                href={`/api/leads/${application.application_id}/document`}
                className="text-indigo-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                📎 {application.uploaded_filename || 'Download file'}
              </a>
            ) : (
              'N/A'
            )}
          </DescriptionDetails>
        </DescriptionList>
      </div>

      <div className="mt-12">
        <Subheading>User Wathiq Data</Subheading>
        <Divider className="mt-4" />
        <DescriptionList>
          <DescriptionTerm>Business Name</DescriptionTerm>
          <DescriptionDetails>{application.trade_name}</DescriptionDetails>

          <DescriptionTerm>CR National Number</DescriptionTerm>
          <DescriptionDetails>{application.cr_national_number}</DescriptionDetails>

          <DescriptionTerm>CR Number</DescriptionTerm>
          <DescriptionDetails>{application.cr_number || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Registration Status</DescriptionTerm>
          <DescriptionDetails>{application.registration_status || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Legal Form</DescriptionTerm>
          <DescriptionDetails>{application.legal_form || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Issue Date (Gregorian)</DescriptionTerm>
          <DescriptionDetails>{application.issue_date_gregorian || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Confirmation Date (Gregorian)</DescriptionTerm>
          <DescriptionDetails>{application.confirmation_date_gregorian || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Address</DescriptionTerm>
          <DescriptionDetails>{application.address}</DescriptionDetails>

          <DescriptionTerm>City</DescriptionTerm>
          <DescriptionDetails>{application.city || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Sector</DescriptionTerm>
          <DescriptionDetails>{formattedSector}</DescriptionDetails>

          <DescriptionTerm>CR Capital</DescriptionTerm>
          <DescriptionDetails>{application.cr_capital ? `${application.cr_capital.toLocaleString()} SAR` : 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Cash Capital</DescriptionTerm>
          <DescriptionDetails>{application.cash_capital ? `${application.cash_capital.toLocaleString()} SAR` : 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>In-Kind Capital</DescriptionTerm>
          <DescriptionDetails>{application.in_kind_capital || 'N/A'}</DescriptionDetails>

          <DescriptionTerm>Average Capital</DescriptionTerm>
          <DescriptionDetails>{application.avg_capital ? `${application.avg_capital.toLocaleString()} SAR` : 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Has eCommerce</DescriptionTerm>
          <DescriptionDetails>
            {application.has_ecommerce ? 'Yes' : 'No'}{' '}
            {application.store_url ? `(${application.store_url})` : ''}
          </DescriptionDetails>

          <DescriptionTerm>Store URL</DescriptionTerm>
          <DescriptionDetails>{application.store_url || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Management Structure</DescriptionTerm>
          <DescriptionDetails>{application.management_structure || 'Not Provided'}</DescriptionDetails>

          <DescriptionTerm>Activities</DescriptionTerm>
          <DescriptionDetails>
            {application.activities && Array.isArray(application.activities) 
              ? application.activities.map((activity, index) => (
                  <div key={index} className="mb-1">
                    {activity}
                  </div>
                ))
              : 'Not Provided'}
          </DescriptionDetails>

          <DescriptionTerm>Is Verified</DescriptionTerm>
          <DescriptionDetails>{application.is_verified ? 'Yes' : 'No'}</DescriptionDetails>

          <DescriptionTerm>Verification Date</DescriptionTerm>
          <DescriptionDetails>
            {application.verification_date 
              ? new Date(application.verification_date).toLocaleDateString() 
              : 'Not Provided'}
          </DescriptionDetails>

          <DescriptionTerm>Admin Notes</DescriptionTerm>
          <DescriptionDetails>{application.admin_notes || 'Not Provided'}</DescriptionDetails>
        </DescriptionList>
      </div>



      {/* Offer and rejection info sections */}
      {submittedOffer && (
        <div className="mt-12">
          <Subheading>Submitted Offer</Subheading>
          <Divider className="mt-4" />
          <DescriptionList>
            <DescriptionTerm>Device Setup Fee</DescriptionTerm>
            <DescriptionDetails>{submittedOffer.offer_device_setup_fee || 'Not Provided'}</DescriptionDetails>
            <DescriptionTerm>Transaction Fee MADA</DescriptionTerm>
            <DescriptionDetails>{submittedOffer.offer_transaction_fee_mada || 'Not Provided'}</DescriptionDetails>
            <DescriptionTerm>Transaction Fee Visa/MC</DescriptionTerm>
            <DescriptionDetails>{submittedOffer.offer_transaction_fee_visa_mc || 'Not Provided'}</DescriptionDetails>
            <DescriptionTerm>Settlement Time MADA</DescriptionTerm>
            <DescriptionDetails>{submittedOffer.offer_settlement_time_mada || 'Not Provided'}</DescriptionDetails>
            <DescriptionTerm>Settlement Time Visa/MC</DescriptionTerm>
            <DescriptionDetails>{submittedOffer.offer_settlement_time_visa_mc || 'Not Provided'}</DescriptionDetails>
            <DescriptionTerm>Comment</DescriptionTerm>
            <DescriptionDetails>{submittedOffer.offer_comment || 'Not Provided'}</DescriptionDetails>
            <DescriptionTerm>Terms</DescriptionTerm>
            <DescriptionDetails>{submittedOffer.offer_terms || 'Not Provided'}</DescriptionDetails>
            <DescriptionTerm>Status</DescriptionTerm>
            <DescriptionDetails>
              <Badge color={submittedOffer.status === 'submitted' ? 'blue' : 'green'}>
                {submittedOffer.status}
              </Badge>
            </DescriptionDetails>
            <DescriptionTerm>Submitted At</DescriptionTerm>
            <DescriptionDetails>
              {new Date(submittedOffer.submitted_at).toLocaleString()}
            </DescriptionDetails>
            <DescriptionTerm>Expires At</DescriptionTerm>
            <DescriptionDetails>
              {submittedOffer.expires_at ? new Date(submittedOffer.expires_at).toLocaleString() : 'Not Set'}
            </DescriptionDetails>
            <DescriptionTerm>Uploaded File</DescriptionTerm>
            <DescriptionDetails>
              {submittedOffer.uploaded_filename ? (
                <a
                  href={`/api/leads/${application.application_id}/offer-file`}
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 {submittedOffer.uploaded_filename}
                </a>
              ) : (
                'Not Provided'
              )}
            </DescriptionDetails>
          </DescriptionList>
        </div>
      )}

      {/* All Offers Section */}
      {application.offers && application.offers.length > 0 && (
        <div className="mt-12">
          <Subheading>All Offers ({application.offers.length})</Subheading>
          <Divider className="mt-4" />
          <div className="space-y-6">
            {application.offers.map((offer, index) => (
              <div key={offer.offer_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Offer #{offer.offer_id} by {offer.bank_name}
                  </h4>
                  <Badge color={offer.status === 'submitted' ? 'blue' : 'green'}>
                    {offer.status}
                  </Badge>
                </div>
                <DescriptionList>
                  <DescriptionTerm>Device Setup Fee</DescriptionTerm>
                  <DescriptionDetails>{offer.setup_fee || 'Not Provided'}</DescriptionDetails>
                  <DescriptionTerm>Transaction Fee MADA</DescriptionTerm>
                  <DescriptionDetails>{offer.transaction_fee_mada || 'Not Provided'}</DescriptionDetails>
                  <DescriptionTerm>Transaction Fee Visa/MC</DescriptionTerm>
                  <DescriptionDetails>{offer.transaction_fee_visa_mc || 'Not Provided'}</DescriptionDetails>
                  <DescriptionTerm>Settlement Time MADA</DescriptionTerm>
                  <DescriptionDetails>{offer.offer_settlement_time_mada || 'Not Provided'}</DescriptionDetails>
                  <DescriptionTerm>Settlement Time Visa/MC</DescriptionTerm>
                  <DescriptionDetails>{offer.offer_settlement_time_visa_mc || 'Not Provided'}</DescriptionDetails>
                  <DescriptionTerm>Comment</DescriptionTerm>
                  <DescriptionDetails>{offer.offer_comment || 'Not Provided'}</DescriptionDetails>
                  <DescriptionTerm>Terms</DescriptionTerm>
                  <DescriptionDetails>{offer.offer_terms || 'Not Provided'}</DescriptionDetails>
                  <DescriptionTerm>Submitted At</DescriptionTerm>
                  <DescriptionDetails>
                    {new Date(offer.submitted_at).toLocaleString()}
                  </DescriptionDetails>
                  <DescriptionTerm>Expires At</DescriptionTerm>
                  <DescriptionDetails>
                    {offer.expires_at ? new Date(offer.expires_at).toLocaleString() : 'Not Set'}
                  </DescriptionDetails>
                  <DescriptionTerm>Uploaded File</DescriptionTerm>
                  <DescriptionDetails>
                    {offer.uploaded_filename ? (
                      <a
                        href={`/api/leads/${application.application_id}/offer-file/${offer.offer_id}`}
                        className="text-indigo-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📎 {offer.uploaded_filename}
                      </a>
                    ) : (
                      'Not Provided'
                    )}
                  </DescriptionDetails>
                </DescriptionList>
              </div>
            ))}
          </div>
        </div>
      )}

      {showOfferForm && (
        <div>
          <form onSubmit={handleSubmitOffer}>
            <div className="space-y-12 sm:space-y-16">
              <div className="py-12">
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Submit an offer
                </h2>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-600">
                  This information will be displayed publicly so be careful what
                  you share.
                </p>

                <div
                  className="mt-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="offer_device_setup_fee"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Device & Setup fees
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 sm:max-w-md">
                        <input
                          id="offer_device_setup_fee"
                          name="offer_device_setup_fee"
                          type="text"
                          placeholder="Device & Setup fees"
                          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                          value={offerForm.offer_device_setup_fee}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="offer_transaction_fee_mada"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Transaction fees MADA
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 sm:max-w-md">
                        <input
                          id="offer_transaction_fee_mada"
                          name="offer_transaction_fee_mada"
                          type="text"
                          placeholder="Transaction fees MADA"
                          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                          value={offerForm.offer_transaction_fee_mada}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="offer_transaction_fee_visa_mc"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Transaction fees Visa/Mastercard
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 sm:max-w-md">
                        <input
                          id="offer_transaction_fee_visa_mc"
                          name="offer_transaction_fee_visa_mc"
                          type="text"
                          placeholder="Transaction fees Visa/Mastercard"
                          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                          value={offerForm.offer_transaction_fee_visa_mc}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="offer_settlement_time_mada"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Settlement time MADA
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 sm:max-w-md">
                        <input
                          id="offer_settlement_time_mada"
                          name="offer_settlement_time_mada"
                          type="text"
                          placeholder="Settlement time MADA"
                          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                          value={offerForm.offer_settlement_time_mada}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="offer_settlement_time_visa_mc"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Settlement time Visa/MC
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 sm:max-w-md">
                        <input
                          id="offer_settlement_time_visa_mc"
                          name="offer_settlement_time_visa_mc"
                          type="text"
                          placeholder="Settlement time Visa/MC"
                          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                          value={offerForm.offer_settlement_time_visa_mc}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="settlement_time"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      General Settlement Time
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 sm:max-w-md">
                        <input
                          id="settlement_time"
                          name="settlement_time"
                          type="text"
                          placeholder="24-48 hours"
                          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                          value={offerForm.settlement_time}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>








                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="offer_terms"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Offer Terms & Conditions
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white sm:max-w-md">
                        <textarea
                          id="offer_terms"
                          name="offer_terms"
                          placeholder="Detailed terms and conditions of this offer..."
                          rows={4}
                          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-3 text-base text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                          value={offerForm.offer_terms}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="offer_comment"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Comment (optional)
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex items-center rounded-md bg-white sm:max-w-md">
                        <textarea
                          id="offer_comment"
                          name="offer_comment"
                          placeholder="Add comment (optional)"
                          rows={4}
                          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-3 text-base text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                          value={offerForm.offer_comment}
                          onChange={handleOfferChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                      htmlFor="cover-photo"
                      className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5"
                    >
                      Upload file
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div
                        className="flex max-w-2xl justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                        <div className="text-center">
                          <div className="mt-4 flex text-sm/6 text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs/5 text-gray-600">
                            PNG, JPG, GIF up to 10MB
                          </p>
                          {(selectedFile || offerForm.file) && (
                            <div className="mt-4 text-sm text-gray-700">
                              <p><strong>Selected file:</strong> {(selectedFile?.name || offerForm.file?.name) ?? 'N/A'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-6">
              <button
                type="button"
                className="text-sm/6 font-semibold text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmitOffer}
                className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {showOfferSentModal && (
        <OfferSentModal onClose={() => setShowOfferSentModal(false)} />
      )}
        {showFeeNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Important Fee Notice</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="mb-3">
                    <strong>We charge a 3% fee from the total deal value</strong> when you submit an offer and it gets accepted.
                  </p>
                  <p className="text-xs text-gray-500">
                    This fee covers our platform services, lead verification, and business facilitation.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDeclineFee}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleAcceptFee}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Accept & Continue
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default function LeadPage({ params }) {
  return (
    <AuthGuard requiredUserType="bank_user">
      <LeadPageContent params={params} />
    </AuthGuard>
  )
}