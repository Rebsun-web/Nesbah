"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { GradientBackground } from '@/components/gradient';
import { Link } from '@/components/link';
import SetNewPasswordModal from '@/components/setNewPasswordModal';
import { Checkbox, Field, Input, Label } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/16/solid';
import { clsx } from 'clsx';
import { Mark } from '@/components/logo';
import {EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";


export default function SetNewPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isOpen, setIsModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(true);

    const [passwordError, setPasswordError] = useState('');

    const [uid, setUid] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {

        const currentUrl = window.location.href;
        const urlParts = currentUrl.split('/');
        const uidFromUrl = urlParts[urlParts.length - 2];
        const tokenFromUrl = urlParts[urlParts.length - 1];

        setUid(uidFromUrl);
        setToken(tokenFromUrl);
    }, []);

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match. Please try again.');
            return;
        } else {
            setPasswordError('');
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        const formData = new FormData();
        formData.append('password1', password);
        formData.append('password2', confirmPassword);

        try {
            const response = await fetch(`https://portal.nesbah.com.sa/account/resetPassword/${uid}/${token}/`, {
                method: 'POST',
                credentials: "include",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
            } else {
                setIsSuccess(false);
            }
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error during setting new password:', error);
            setIsSuccess(false);
            setIsModalOpen(true);
        }
    };

    return (
        <main className="overflow-hidden bg-gray-50">
            <GradientBackground />
            <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
                <div className="w-full max-w-md rounded-xl bg-white shadow-md ring-1 ring-black/5">
                    <form onSubmit={handleForgotPassword} className="p-7 sm:p-11">
                        <div className="flex items-start">
                            <Link href="/" title="Home">
                                <Mark className="h-9 fill-black" />
                            </Link>
                        </div>
                        <h1 className="mt-8 text-base/6 font-medium">قم بتعيين كلمة المرور</h1>
                        {/*<p className="mt-1 text-sm/5 text-gray-600">سنرسل لك رابطًا لإنشاء كلمة مرور جديدة</p>*/}
                        <Field className="mt-8 space-y-3 relative">
                            <Label className="text-sm/5 font-medium">كلمة المرور</Label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    /*placeholder="كلمة المرور"*/
                                    className="block w-full rounded-lg border shadow px-4 py-2 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </Field>

                        <Field className="mt-8 space-y-3 relative">
                            <Label className="text-sm/5 font-medium">تأكيد كلمة المرور</Label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    /*placeholder="تأكيد كلمة المرور"*/
                                    className="block w-full rounded-lg border shadow px-4 py-2 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                            )}
                        </Field>

                        <div className="mt-8">
                            <button
                                type="submit"
                                className="w-full mt-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-full px-6 py-3 transition ease-in-out duration-200 hover:bg-opacity-50 hover:shadow-lg hover:shadow-pink-500/50"
                            >
                                إعادة تعيين كلمة المرور
                            </button>
                        </div>
                    </form>

                </div>
            </div>
            <SetNewPasswordModal
                isOpen={isOpen}
                onClose={() => setIsModalOpen(false)}
                isSuccess={isSuccess}
            />
        </main>
    );
}
