"use client";

import React, { useState } from 'react';
import { Button } from '@/components/button';
import { GradientBackground } from '@/components/gradient';
import { Link } from '@/components/link';
import ForgotPasswordLinkModal from '@/components/forgotPasswordLinkModal';
import { Checkbox, Field, Input, Label } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/16/solid';
import { clsx } from 'clsx';
import { Mark } from '@/components/logo'
import RegistrationModal from "@/components/RegistrationModal";
import { Navbar } from '@/components/navbar'
import { Container } from '@/components/container'

export default function ForgotPassword() {

    const [username, setUsername] = useState('');
    const [isOpen, setIsModalOpen] = useState(false); // Modal state
    const [isSuccess, setIsSuccess] = useState(true); // Modal state

    const ForgotPassword = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('username', username);

        try {
            const response = await fetch('https://portal.nesbah.com.sa/account/reset/', {
                method: 'POST',
                credentials: "include",
                body: formData,

            });

            const data = await response.json();

            if (response.ok) {

                setIsSuccess(true)
            } else {
                setIsSuccess(false);
            }
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error during login:', error);
            setIsSuccess(false);
            setIsModalOpen(true);
        }
    };

    return (
        <main className="overflow-hidden bg-gray-50">
            <Container className="relative">
                <Navbar />
            </Container>
            <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
                <div className="w-full max-w-md rounded-xl bg-white shadow-md ring-1 ring-black/5">
                    <form onSubmit={ForgotPassword} className="p-7 sm:p-11">
                        <div className="flex items-start">
                            <Link href="/" title="Home">
                                <Mark className="h-9 fill-black" />
                            </Link>
                        </div>
                        <h1 className="mt-8 text-base/6 font-medium">هل نسيت كلمة المرور؟</h1>
                        <p className="mt-1 text-sm/5 text-gray-600">سنرسل لك رابطًا لإنشاء كلمة مرور جديدة</p>
                        <Field className="mt-8 space-y-3">
                            <Label className="text-sm/5 font-medium">اسم المستخدم</Label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required

                                className="block w-full rounded-lg border shadow ring-1 ring-black/10 px-4 py-2"
                            />
                        </Field>



                        <div className="mt-8">
                            <button
                                type="submit"
                                className="w-full mt-4 bg-gradient-to-r from-[#1E1851] to-[#4436B7] text-white rounded-full px-6 py-3 transition ease-in-out duration-200 hover:bg-opacity-50 hover:shadow-lg hover:shadow-pink-500/50"
                            >
                                إعادة تعيين كلمة المرور
                            </button>
                        </div>
                    </form>
                    <div className="m-1.5 rounded-lg bg-gray-50 py-4 text-center text-sm/5 ring-1 ring-black/5">
                        هل لديك حساب بالفعل ؟{' '}
                        <Link href="/login" className="font-medium hover:text-gray-600">
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </div>
            {/* Render the modal and control its open state */}
            <ForgotPasswordLinkModal
                isOpen={isOpen}
                onClose={() => setIsModalOpen(false)}
                isSuccess={isSuccess}
            />

        </main>
    );
}
