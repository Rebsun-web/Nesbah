'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { GradientBackground } from '@/components/gradient';
import { Link } from '@/components/link';
import LoginStatusModal from '@/components/LoginStatusModal';
import { Checkbox, Field, Input, Label } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/16/solid';
import { clsx } from 'clsx';
import { Mark } from '@/components/logo';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Navbar } from '@/components/navbar';
import { Container } from '@/components/container';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Login() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('🔐 Login form submitted for:', email);
    
    if (isLoading) {
      console.log('⚠️ Login already in progress, ignoring duplicate submission');
      return;
    }
    
    setIsLoading(true);
    setIsModalOpen(false);

    try {
      // Use unified login endpoint for all user types
      console.log('🔐 Attempting unified login...');
      const response = await fetch('/api/auth/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password
        }),
      });

      const data = await response.json();
      console.log('Unified login response:', response.status, data);

      if (response.ok && data?.success) {
        const user = data.user;
        
        if (user.user_type === 'admin_user') {
          // Admin login successful
          console.log('✅ Admin login successful, redirecting to admin dashboard...');
          router.push('/admin');
        } else if (user.user_type === 'bank_employee') {
          // Bank employee login successful
          console.log('✅ Bank employee login successful, storing in localStorage');
          localStorage.setItem('user', JSON.stringify(user));
          router.push('/bankPortal');
        } else {
          // Regular user login successful
          console.log('✅ Regular user login successful, storing in localStorage');
          localStorage.setItem('user', JSON.stringify(user));
          router.push(data.redirect || '/portal');
        }
      } else {
        // Login failed
        setModalMessage(data.error || t('auth.invalidCredentials'));
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setModalMessage(t('auth.loginError'));
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <main className="overflow-hidden bg-white">
      <Container className="relative">
        <Navbar />
      </Container>
      <div className="isolate flex min-h-dvh items-start justify-center p-6 lg:p-8 pt-20 lg:pt-32">
        <div className="w-full max-w-xl rounded-xl bg-gray-50 shadow-md ring-1 ring-black/5">
          <form onSubmit={handleLogin} className="p-7">
            <h1 className="pt-4 text-base/6 font-medium">{t('auth.welcome')}</h1>
            <p className="mt-1 text-sm/5 text-gray-600">{t('auth.loginToContinue')}</p>

            <Field className="mt-8 space-y-3">
              <Label className="text-sm/5 font-medium">{t('auth.email')}</Label>
              <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('auth.email')}
                  className="block w-full rounded-lg border shadow ring-1 ring-black/10 px-4 py-2"
              />
            </Field>

            <Field className="relative pt-4 space-y-3">
              <Label className="text-sm/5 font-medium">{t('auth.password')}</Label>
              <div className="relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t('auth.password')}
                    className="block w-full rounded-lg border px-4 py-2 pr-12 shadow ring-1 ring-black/10"
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

            <div className="mt-8 flex items-center justify-between text-sm/5">
              <Field className="flex items-center gap-3">
                <Checkbox
                    name="remember-me"
                    className={clsx(
                        'group block size-4 rounded border shadow ring-1 ring-black/10 focus:outline-none',
                        'data-[checked]:bg-black data-[checked]:ring-black',
                        'data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-black'
                    )}
                >
                  <CheckIcon className="fill-white opacity-0 group-data-[checked]:opacity-100" />
                </Checkbox>
                <Label>{t('auth.rememberMe')}</Label>
              </Field>
              <Link href="/forgotPassword" className="font-medium hover:text-gray-600">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <div className="mt-8">
              <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-[#1E1851] to-[#4436B7] px-6 py-3 text-white transition duration-200 ease-in-out hover:bg-opacity-50 hover:shadow-lg hover:shadow-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </div>
          </form>

          <div className="m-1.5 rounded-lg bg-gray-50 py-4 text-center text-sm/5 ring-1 ring-black/5">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="font-medium hover:text-gray-600">
              {t('auth.createAccount')}
            </Link>
          </div>
        </div>
      </div>

      {isModalOpen && (
          <LoginStatusModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              message={modalMessage}
          />
      )}
    </main>
  );
}
