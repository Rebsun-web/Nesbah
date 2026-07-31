'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'

export default function OfferSuccessModal({ isOpen, onClose, onViewLeads }) {
    const { t } = useLanguage()

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-[hsl(var(--foreground)/0.6)] transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-md sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                    >
                        <div>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
                                <CheckCircleIcon aria-hidden="true" className="size-6 text-green-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-5">
                                <DialogTitle as="h3" className="text-base font-semibold text-[hsl(var(--foreground))]">
                                    {t('offers.offerSubmittedSuccessfully')}
                                </DialogTitle>
                                <div className="mt-2">
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        {t('offers.offerSuccessMessage')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex w-full justify-center rounded-md bg-[hsl(var(--muted))] px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground))] shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                            >
                                {t('common.close')}
                            </button>
                            {onViewLeads && (
                                <button
                                    type="button"
                                    onClick={onViewLeads}
                                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                >
                                    {t('offers.viewLeads')}
                                </button>
                            )}
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
