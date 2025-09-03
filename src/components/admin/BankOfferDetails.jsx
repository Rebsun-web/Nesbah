'use client'

export default function BankOfferDetails({ offer, onClose, onEdit }) {
    if (!offer) return null

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A'
        return `SAR ${parseFloat(amount).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'submitted': return 'bg-blue-100 text-blue-800'
            case 'accepted': return 'bg-green-100 text-green-800'
            case 'rejected': return 'bg-red-100 text-red-800'
            case 'expired': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                        Bank Offer #{offer.offer_id}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {offer.bank_email || 'Unknown Bank'}
                    </p>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                    {offer.status || 'Unknown'}
                </span>
            </div>

            {/* Application Information */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Application Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-700">Application ID:</span>
                        <span className="ml-2 text-gray-900">#{offer.submitted_application_id}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Business Name:</span>
                        <span className="ml-2 text-gray-900">{offer.business_name || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">CR Number:</span>
                        <span className="ml-2 text-gray-900">{offer.cr_number || offer.cr_national_number || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">City:</span>
                        <span className="ml-2 text-gray-900">{offer.business_city || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">CR Capital:</span>
                        <span className="ml-2 text-gray-900">
                            {offer.cr_capital ? formatCurrency(offer.cr_capital) : 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Preferred Period:</span>
                        <span className="ml-2 text-gray-900">
                            {offer.preferred_repayment_period ? `${offer.preferred_repayment_period} months` : 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Legal Form:</span>
                        <span className="ml-2 text-gray-900">{offer.legal_form || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Registration Status:</span>
                        <span className="ml-2 text-gray-900">{offer.registration_status || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Business Email:</span>
                        <span className="ml-2 text-gray-900">{offer.business_email || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Contact Person:</span>
                        <span className="ml-2 text-gray-900">{offer.business_contact || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Contact Phone:</span>
                        <span className="ml-2 text-gray-900">{offer.business_phone || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Financial Terms */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Financial Terms</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-700">Approved Amount:</span>
                        <span className="ml-2 text-gray-900">
                            {formatCurrency(offer.approved_financing_amount)}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Repayment Period:</span>
                        <span className="ml-2 text-gray-900">
                            {offer.proposed_repayment_period_months ? `${offer.proposed_repayment_period_months} months` : 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Interest Rate:</span>
                        <span className="ml-2 text-gray-900">
                            {offer.interest_rate ? `${offer.interest_rate}%` : 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Monthly Installment:</span>
                        <span className="ml-2 text-gray-900">
                            {formatCurrency(offer.monthly_installment_amount)}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Grace Period:</span>
                        <span className="ml-2 text-gray-900">
                            {offer.grace_period_months ? `${offer.grace_period_months} months` : 'None'}
                        </span>
                    </div>
                </div>
            </div>



            {/* Additional Information */}
            {(offer.offer_comment || offer.offer_terms || offer.admin_notes) && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h4>
                    <div className="space-y-4">
                        {offer.offer_comment && (
                            <div>
                                <span className="font-medium text-gray-700">Offer Comment:</span>
                                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{offer.offer_comment}</p>
                            </div>
                        )}
                        {offer.offer_terms && (
                            <div>
                                <span className="font-medium text-gray-700">Offer Terms:</span>
                                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{offer.offer_terms}</p>
                            </div>
                        )}
                        {offer.admin_notes && (
                            <div>
                                <span className="font-medium text-gray-700">Admin Notes:</span>
                                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{offer.admin_notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Uploaded File */}
            {offer.uploaded_document && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Uploaded Document</h4>
                    <div className="space-y-4">
                        <div>
                            <span className="font-medium text-gray-700">Filename:</span>
                            <span className="ml-2 text-gray-900">{offer.uploaded_filename || 'Unknown'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">File Type:</span>
                            <span className="ml-2 text-gray-900">{offer.uploaded_mimetype || 'Unknown'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">File Size:</span>
                            <span className="ml-2 text-gray-900">
                                {offer.uploaded_document ? `${Math.round(offer.uploaded_document.length / 1024)} KB` : 'Unknown'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Download:</span>
                            <button
                                onClick={() => {
                                    const blob = new Blob([offer.uploaded_document], { type: offer.uploaded_mimetype || 'application/octet-stream' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = offer.uploaded_filename || 'document';
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                }}
                                className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Download File
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Information */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Bank Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-700">Bank Name:</span>
                        <span className="ml-2 text-gray-900">{offer.bank_entity_name || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Bank Email:</span>
                        <span className="ml-2 text-gray-900">{offer.bank_email || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Bank ID:</span>
                        <span className="ml-2 text-gray-900">{offer.bank_user_id || 'N/A'}</span>
                    </div>
                    {offer.bank_contact_person && (
                        <div>
                            <span className="font-medium text-gray-700">Bank Contact:</span>
                            <span className="ml-2 text-gray-900">{offer.bank_contact_person}</span>
                        </div>
                    )}
                    {offer.bank_contact_number && (
                        <div>
                            <span className="font-medium text-gray-700">Bank Phone:</span>
                            <span className="ml-2 text-gray-900">{offer.bank_contact_number}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Edit Offer
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                    Close
                </button>
            </div>
        </div>
    )
}
