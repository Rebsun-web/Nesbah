'use client'

import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LinkIcon, PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import RejectLeadModal from '@/components/RejectLeadModal';

import { useParams } from 'next/navigation';

export default function RejectLeadSlide({ open, onClose, userId }) {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [modalSuccess, setModalSuccess] = useState(true);
    const [modalMessage, setModalMessage] = useState('');
   const params = useParams();

    return (
        <Dialog open={open} onClose={onClose} className="relative z-10">
            <div className="fixed inset-0" />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                        <DialogPanel
                            transition
                            className="pointer-events-auto w-screen max-w-2xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
                        >
                            <form className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                <div className="flex-1">
                                    {/* Header */}
                                    <div className="bg-red-700 px-4 py-6 sm:px-6">
                                        <div className="flex items-start justify-between space-x-3">
                                            <div className="space-y-1">
                                                <DialogTitle className="text-base font-semibold text-white">Reject Lead</DialogTitle>
                                                <p className="text-sm text-white">
                                                    Provide reason for rejection (Mandatory)
                                                </p>
                                            </div>
                                            <div className="flex h-7 items-center">
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="relative text-white hover:text-white"
                                                >
                                                    <span className="absolute -inset-2.5" />
                                                    <span className="sr-only">Close panel</span>
                                                    <XMarkIcon aria-hidden="true" className="size-6" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider container */}
                                    <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0">
                                        {/* Project description */}
                                        <div className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                                            <div>
                                                <label
                                                    htmlFor="Reason"
                                                    className="block text-sm/6 font-medium text-gray-900 sm:mt-1.5"
                                                >
                                                    Reason for rejection
                                                </label>
                                            </div>
                                            <div className="sm:col-span-2">
                        <textarea
                            id="Reason"
                            name="Reason"
                            rows={6}
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            defaultValue={''}
                        />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6">
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                const reason = document.getElementById('Reason')?.value || '';

                                                if (!userId) {
                                                    console.error('❌ No valid user ID provided to RejectLeadSlide.');
                                                    setModalSuccess(false);
                                                    setModalMessage('User not authenticated. Please log in again.');
                                                    setShowStatusModal(true);
                                                    return;
                                                }

                                                try {
                                                    const response = await fetch(`/api/leads/${params.id}/ignored_applications`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'x-user-id': userId,
                                                        },
                                                        body: JSON.stringify({ rejectionReason: reason }),
                                                    });

                                                    if (!response.ok) throw new Error('Failed to submit rejection');

                                                    setModalSuccess(true);
                                                    setModalMessage('Your rejection reason has been submitted.');
                                                } catch (error) {
                                                    console.error('❌ Rejection failed:', error);
                                                    setModalSuccess(false);
                                                    setModalMessage('Something went wrong. Please try again.');
                                                }

                                                setShowStatusModal(true);
                                            }}
                                            className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </div>
            <RejectLeadModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                isSuccess={modalSuccess}
                modalMessage={modalMessage}
            />
        </Dialog>
    )
}
