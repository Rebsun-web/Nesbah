'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/components/link';
import LoginStatusModal from '@/components/LoginStatusModal';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { EMAIL_RE } from '@/lib/validators';

export default function Login() {
  const router = useRouter();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const toggleLang = () => changeLanguage(isRTL ? 'en' : 'ar');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('🔐 Login form submitted for:', email);
    
    if (isLoading) {
      console.log('⚠️ Login already in progress, ignoring duplicate submission');
      return;
    }

    // Format-only check (not "does this account exist") so we don't leak anything
    // beyond what a fat-fingered email address would already reveal.
    if (!email || !EMAIL_RE.test(email.trim()) || !password) {
      setModalMessage('Please enter a valid email address and password.');
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setIsModalOpen(false);

    let timeoutId;
    try {
      // No AbortController — server returns 503 after 28s so no client-side signal needed.
      // A signal that gets prematurely aborted (e.g. by browser navigation or a stale
      // timeout from a previous call) would produce "AbortError: signal is aborted without
      // reason" and make it look like the request never reached the server.
      const fetchPromise = fetch('/api/auth/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          mfaToken: requiresMFA ? mfaToken : undefined
        }),
      });

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Login timed out — please try again')), 35000);
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('Unified login response:', response.status, data);

      if (response.ok && data?.success) {
        const user = data.user;
        
        if (user.user_type === 'admin_user') {
          // Admin login successful
          console.log('✅ Admin login successful, storing JWT token and user data...');
          console.log('🔍 Login: Storing admin user data:', user);
          
          try {
            // Test localStorage functionality
            localStorage.setItem('test', 'test')
            localStorage.removeItem('test')
            console.log('✅ Login: localStorage is working')
            
            // Store admin user data
            localStorage.setItem('adminUser', JSON.stringify(user));
            
            // Store JWT token (this should be in the response from the backend)
            if (data.token) {
              localStorage.setItem('adminJWT', data.token);
              console.log('✅ Login: JWT token stored')
            } else {
              console.warn('⚠️ Login: No JWT token in response')
            }
            
            console.log('🔍 Login: adminUser stored in localStorage:', localStorage.getItem('adminUser'));
            
            // Small delay to ensure localStorage is set before navigation
            setTimeout(() => {
              router.push('/admin');
            }, 100);
          } catch (error) {
            console.error('❌ Login: Error with localStorage:', error)
            setModalMessage('Error storing authentication data. Please try again.');
            setIsModalOpen(true);
          }
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
      } else if (data?.requiresMFA) {
        // MFA is required
        console.log('🔐 MFA required, showing MFA input field');
        setRequiresMFA(true);
        // Don't show modal, just show the MFA field directly in the form
      } else {
        // Login failed
        setModalMessage(data.error || t('auth.invalidCredentials'));
        setIsModalOpen(true);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error during login:', error.message);
      const msg = error.message.startsWith('Login timed out')
        ? error.message
        : t('auth.loginError');
      setModalMessage(msg);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    // Layout ported 1:1 from the reference implementation's CustomerAuthShell
    // (src/components/customer-auth-shell.tsx): minimal header with logo + language
    // link, centred card on cream with the % watermark behind it, "NESBAH" eyebrow,
    // violet rule under the subtitle, ink pill button.
    //
    // Deliberate omission: no "Create one" link. There is no self-service account in
    // this product — public users submit an anonymous application via /onboarding, and
    // bank/admin accounts are provisioned by an admin.
    // Direction is pinned per-language here, mirroring the reference
    // CustomerAuthShell: this page uses LanguageContext, which no longer
    // writes <html dir>, so it cannot inherit the right direction.
    <div className="min-h-screen bg-cream" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-hairline/60 bg-cream/70 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={26} width={86} className="h-8 w-auto object-contain" />
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              className="text-xs font-semibold text-ink/70 transition-colors hover:text-violet"
            >
              {isRTL ? 'English' : 'العربية'}
            </button>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="pct-motif flex flex-1 items-center justify-center px-4 py-10">
          <div className="relative w-full max-w-md">
            <div className="rounded-3xl border border-hairline bg-white p-6 shadow-[0_30px_80px_-40px_rgba(30,24,81,0.35)] md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">
                {isRTL ? 'نسبة' : 'Nesbah'}
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold text-ink">{t('auth.welcome')}</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t('auth.loginToContinue')}</p>
              <div className="mt-5 h-px w-12 bg-violet" aria-hidden="true" />

              <form onSubmit={handleLogin} className="mt-6 space-y-5">
                {requiresMFA && (
                  <div className="rounded-xl border border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.08)] p-3 text-center">
                    <span className="text-sm font-semibold text-ink">
                      ✓ Credentials verified. Complete login with MFA token.
                    </span>
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-ink">{t('auth.email')}</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={requiresMFA}
                    className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink transition placeholder:text-ink-soft/50 focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20 disabled:bg-[hsl(var(--muted))]"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-ink">{t('auth.password')}</label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={requiresMFA}
                      className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 pe-11 text-sm text-ink transition placeholder:text-ink-soft/50 focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20 disabled:bg-[hsl(var(--muted))]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-pressed={showPassword}
                      aria-controls="login-password"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 end-2 my-auto grid h-8 w-8 place-items-center rounded-md text-ink-soft transition-colors hover:text-violet focus:outline-none focus:ring-2 focus:ring-violet/30"
                    >
                      {showPassword
                        ? <EyeSlashIcon className="h-4 w-4" aria-hidden="true" />
                        : <EyeIcon className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {requiresMFA && (
                  <div>
                    <label htmlFor="login-mfa" className="mb-1.5 block text-sm font-semibold text-ink">MFA Token</label>
                    <input
                      id="login-mfa"
                      type="text"
                      value={mfaToken}
                      onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="000000"
                      className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-center font-mono text-lg text-ink transition focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20"
                    />
                    <p className="mt-1.5 text-center text-xs text-ink-soft">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? t('auth.loggingIn') : (requiresMFA ? 'Verify MFA' : t('auth.login'))}
                </button>

                <div className="text-center">
                  <Link href="/forgotPassword" className="text-sm font-semibold text-violet hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
          <LoginStatusModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              message={modalMessage}
          />
      )}
    </div>
  );
}
