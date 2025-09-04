'use client'

import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function SetNewPasswordModal({ isOpen, onClose, isSuccess }) {
    const buttonText = isSuccess ? 'تسجيل الدخول' : 'تمام';

    const handleButtonClick = () => {
        if (isSuccess) {
            window.location.href = '/login';
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-10">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                    >
                        <div>
                            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                                {isSuccess ? (
                                    <CheckIcon aria-hidden="true" className="h-6 w-6 text-green-600" />
                                ) : (
                                    <XCircleIcon aria-hidden="true" className="h-6 w-6 text-red-600" />
                                )}
                            </div>
                            <div className="mt-3 text-center sm:mt-5">
                                <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                    {isSuccess ? 'تم تحديث كلمة المرور' : 'حدث خطأ ما'}
                                </DialogTitle>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {isSuccess
                                            ? 'يمكنك تسجيل الدخول باستخدام كلمة المرور الجديدة الخاصة بك'
                                            : 'تواصل معنا : admin@nesbah.net'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-6">
                            <button
                                type="button"
                                onClick={handleButtonClick}
                                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                {buttonText}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
