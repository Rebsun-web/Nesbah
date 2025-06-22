"use client";

import { Button } from '@/components/button';
import { GradientBackground } from '@/components/gradient';
import { Link } from '@/components/link';
import { Checkbox, Field, Input, Label } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/16/solid';
import { clsx } from 'clsx';
import React, { useState } from 'react';
import RegistrationModal from '@/components/RegistrationModal';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import {Navbar} from "@/components/navbar";
import {Container} from "@/components/container";

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [cr_national_number, setCrNationalNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isOpen, setIsModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [modalMessage, setModalMessage] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/users/register/business_users/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    cr_national_number,
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setModalMessage('تم تسجيل حسابك بنجاح.');
            } else {
                setIsSuccess(false);
                const errorMessage = data?.error || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
                setModalMessage(errorMessage);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setIsSuccess(false);
            setModalMessage('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى لاحقًا.');
        } finally {
            setIsModalOpen(true);
        }
    };


    return (
      <main className="overflow-hidden bg-white">
          <Container className="relative">
              <Navbar />
          </Container>
        <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-xl rounded-xl bg-[#F4F4F4] shadow-md ring-1 ring-black/5">
            <form onSubmit={handleRegister} className="p-3 sm:p-11">
              <div className="flex items-center justify-center pb-6">
                <h2 className="text-center text-lg font-semibold">Create an account</h2>
              </div>

              <div className="flex items-center justify-center pb-4 pt-6">
                <img
                  src="/characters/login.png" // Replace with your actual image path
                  className="w-full max-w-sm object-contain"
                  alt="Login illustration"
                />
              </div>

              <Field className="mt-4 space-y-3">
                <Label className="text-sm/5 font-medium">
                  رقم السجل التجاري (CR National Number)
                </Label>
                <input
                  type="text"
                  value={cr_national_number}
                  onChange={(e) => setCrNationalNumber(e.target.value)}
                  required
                  placeholder="رقم السجل التجاري"
                  className="block w-full rounded-lg border px-4 py-2 shadow"
                />
              </Field>

              <Field className="mt-4 space-y-3">
                <Label className="text-sm/5 font-medium">
                  البريد الإلكتروني
                </Label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="البريد الإلكتروني"
                  className="block w-full rounded-lg border px-4 py-2 shadow"
                />
              </Field>

              <Field className="relative mt-4 space-y-3">
                <Label className="text-sm/5 font-medium">كلمة المرور</Label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (e.target.value.length < 8) {
                        setErrorMessage(
                          'يُوصى بأن تحتوي على كلمة مرور على 8 أحرف على الأقل ورقم.',
                        )
                      } else {
                        setErrorMessage('')
                      }
                    }}
                    required
                    placeholder="كلمة المرور"
                    className={`block w-full rounded-lg border px-4 py-2 pr-12 shadow ring-1 ${
                      errorMessage
                        ? 'border-red-500 ring-red-500'
                        : 'ring-black/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errorMessage && (
                  <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
                )}
              </Field>

              <Field className="relative mt-4 space-y-3">
                <Label className="text-sm/5 font-medium">
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="تأكيد كلمة المرور"
                    className="block w-full rounded-lg border px-4 py-2 pr-12 shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-500">{passwordError}</p>
                )}
              </Field>

              <div className="mt-8 flex items-center justify-between text-sm/5">
                <Field className="flex items-center gap-3">
                  <Checkbox
                    name="terms"
                    className={clsx(
                      'group block size-4 rounded border border-transparent shadow ring-1 ring-black/10 focus:outline-none',
                      'data-[checked]:bg-black data-[checked]:ring-black',
                      'data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-black',
                    )}
                  >
                    <CheckIcon className="fill-white opacity-0 group-data-[checked]:opacity-100" />
                  </Checkbox>
                  <Label>
                    أوافق على شروط وأحكام الخدمة وسياسة الخصوصية لنسبة
                  </Label>
                </Field>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-[#1E1851] to-[#4436B7] px-6 py-3 text-white transition hover:shadow-lg"
                >
                  تسجيل
                </button>
              </div>
            </form>

            <div className="m-1.5 rounded-lg bg-gray-50 py-4 text-center text-sm/5 ring-1 ring-black/5">
              هل لديك حساب بالفعل؟{' '}
              <Link href="/login" className="font-medium hover:text-gray-600">
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>

        <RegistrationModal
          isOpen={isOpen}
          onClose={() => setIsModalOpen(false)}
          isSuccess={isSuccess}
          modalMessage={modalMessage}
        />
      </main>
    )
}
