'use client'
import { useEffect, useState } from 'react'

export default function ApprovedLeadReaction({ user }) {
  const [approvedOffers, setApprovedOffers] = useState([]);

  useEffect(() => {
    console.log('Received user object:', user); // 🐞 DEBUG
    const fetchApprovedOffers = async () => {
      try {
        // Use the correct API endpoint for business users
        const res = await fetch(`/api/posApplication/${user.user_id}/response`);
        const data = await res.json();
        console.log('API response:', data); // 🐞 DEBUG
        console.log('Approved offers:', data.offers); // 🐞 DEBUG
        if (data.offers && Array.isArray(data.offers)) {
          setApprovedOffers(data.offers);
        }
      } catch (err) {
        console.error('Error fetching approved offer data:', err);
      }
    };

    if (user?.user_id) {
      fetchApprovedOffers();
    }
  }, [user]);

  if (!Array.isArray(approvedOffers) || approvedOffers.length === 0) return null;

  return (
      <div className="mx-auto max-w-7xl">
        <div className="space-y-4 pt-6">
          {approvedOffers.map((offer, index) => (
              <div
                  key={index}
                  className="overflow-hidden rounded-lg shadow bg-green-800 border border-gray-200"
              >
                <div className="px-4 py-5 sm:px-6 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    Approved by {offer.bank_name}
                  </h2>
                  <span className="text-sm text-white">
                {offer.submitted_at ? new Date(offer.submitted_at).toLocaleString() : 'N/A'}
              </span>
                </div>
                <div className="bg-white px-4 py-5 sm:p-6 text-sm text-gray-800 space-y-1">
                  <p><strong>Device Setup Fee:</strong> {offer.offer_device_setup_fee}</p>
                  <p><strong>Transaction Fee mada:</strong> {offer.offer_transaction_fee_mada}</p>
                  <p><strong>Transaction Fee visa and mastercard:</strong> {offer.offer_transaction_fee_visa_mc}</p>
                  <p><strong>Settlement Time:</strong> {offer.offer_settlement_time_mada}</p>
                  <p><strong>Comment:</strong> {offer.offer_comment}</p>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}
