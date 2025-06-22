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
import LeadPurchasedModal from '@/components/LeadPurchasedModal';
import RejectLeadSlide from '@/components/RejectLeadSlide';
import OfferSentModal from '@/components/OfferSentModal';


export default function LeadPage({ params }) {
  const router = useRouter()
  const [application, setApplication] = useState(null)
  const [bankUser, setBankUser] = useState(null)
  const [isPurchased, setIsPurchased] = useState(false)
  const [showPurchasedModal, setShowPurchasedModal] = useState(false);
  const [isRejectSlideOpen, setIsRejectSlideOpen] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showOfferSentModal, setShowOfferSentModal] = useState(false);
  // Offer and rejection info state
  const [submittedOffer, setSubmittedOffer] = useState(null);
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
    if (!bankUser || !bankUser.user_id) return

    const res = await fetch(`/api/leads/${params.id}`, {
      headers: {
        'x-user-id': bankUser.user_id,
      },
    })

    const data = await res.json()
    if (data.success) {
      setApplication(data.data)
      setIsPurchased(
        data.data.contact_info &&
        Object.keys(data.data.contact_info).length > 0
      )
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
      const rejectionByUser = Array.isArray(data.data.rejection_data)
        ? data.data.rejection_data.find(r => Number(r.user_id) === Number(bankUser.user_id))
        : null;
      setRejectionInfo(rejectionByUser);
    }
  }

  useEffect(() => {
    fetchApplication()
  }, [bankUser, params.id])


  const handleBuy = async () => {
    if (!bankUser?.user_id) return;

    const formData = new FormData();
    formData.append('action', 'approve');

    const res = await fetch(`/api/leads/${params.id}/purchased_applications`, {
      method: 'POST',
      headers: {
        'x-user-id': bankUser.user_id,
      },
      body: formData,
    });

    const result = await res.json();
    if (result.success) {
      setShowPurchasedModal(true);
    } else {
      console.error('❌ Failed to mark lead as purchased:', result.message);
    }
  }

  const handleIgnore = async () => {
    if (!bankUser?.user_id) return;
    setIsRejectSlideOpen(true);
  };

  // Add the handleReject function
  const handleReject = async (rejectionReason) => {
    if (!bankUser?.user_id) return;
    setIsRejectSlideOpen(true);

    try {
      const res = await fetch(`/api/leads/${params.id}/ignored_applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': bankUser.user_id,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const result = await res.json();
      if (result.success) {
        console.log('✅ Lead rejected successfully');
        fetchApplication(); // Optionally refresh the state
      } else {
        console.error('❌ Failed to reject lead:', result.message);
      }
    } catch (error) {
      console.error('❌ Error rejecting lead:', error);
    }
  };

  // Offer form state and handlers
  const [offerForm, setOfferForm] = useState({
    offer_device_setup_fee: '',
    offer_transaction_fee_mada: '',
    offer_transaction_fee_visa_mc: '',
    offer_settlement_time_mada: '',
    offer_comment: '',
    file: null,
  });

  const [selectedFile, setSelectedFile] = useState(null);

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
        fetchApplication(); // Refresh the lead info
      } else {
        console.error('❌ Failed to submit offer:', result.message);
      }
    } catch (error) {
      console.error('❌ Error submitting offer:', error);
    }
  };

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

          {!isPurchased && (
            <div className="flex gap-4">
              <Button
                onClick={handleBuy}
                className="bg-gradient-to-r from-[#1E1851] to-[#4436B7] text-white"
              >
                Approve lead
              </Button>
              <Button
                onClick={handleReject}
                className="bg-gray-200 text-zinc-800"
              >
                Reject lead
              </Button>
            </div>
          )}
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
          <DescriptionTerm>Email</DescriptionTerm>
          <DescriptionDetails>
            {isPurchased ? contactInfo.email || 'N/A' : 'Hidden'}
          </DescriptionDetails>

          <DescriptionTerm>Mobile</DescriptionTerm>
          <DescriptionDetails>
            {isPurchased ? contactInfo.mobileNo || 'N/A' : 'Hidden'}
          </DescriptionDetails>

          <DescriptionTerm>Phone</DescriptionTerm>
          <DescriptionDetails>
            {isPurchased ? contactInfo.phoneNo || 'N/A' : 'Hidden'}
          </DescriptionDetails>
        </DescriptionList>
      </div>

      {/* Offer and rejection info sections */}
      {submittedOffer && (
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
      )}

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

      {isPurchased && (
        <div>
          {console.log('📋 Current offerForm state:', offerForm)}
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
      {showPurchasedModal && (
          <LeadPurchasedModal
            onClose={() => {
              setShowPurchasedModal(false);
              window.location.reload();
            }}
            onComplete={() => {
              setIsPurchased(true);
              fetchApplication();
            }}
          />
      )}
      {isRejectSlideOpen && (
        <RejectLeadSlide
          open={isRejectSlideOpen}
          onClose={() => setIsRejectSlideOpen(false)}
          leadId={params.id}
          userId={bankUser?.user_id}
        />
      )}
      {showOfferSentModal && (
        <OfferSentModal onClose={() => setShowOfferSentModal(false)} />
      )}
    </div>
  )
}