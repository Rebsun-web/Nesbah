'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, CheckCircle2,
  Shield, Building2, FileText, Send, PartyPopper,
} from 'lucide-react'
import { PublicLanguageProvider, useLang, translations } from '@/contexts/PublicLanguageContext'

// API code for each financing type — same index order as translations.onboarding.financingTypes
const FINANCING_TYPE_CODES = [
  'business',       // تمويل الشركات / Business Financing
  'working_capital',// تمويل رأس المال العامل / Working Capital
  'expansion',      // تمويل التوسع / Expansion Financing
  'equipment',      // تمويل المعدات / Equipment Financing
  'project',        // تمويل المشاريع / Project Financing
  'real_estate',    // تمويل المشاريع العقارية / Real Estate
  'pos',            // تمويل نقاط البيع / POS Financing
  'general',        // أخرى / Other
]

// ─── Field components ───────────────────────────────────────────────────────

function Input({ id, value, onChange, onBlur, placeholder, type = 'text', dir }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      dir={dir}
      className="mt-1.5 block w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]"
    />
  )
}

function Select({ id, value, onChange, placeholder, options }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 block w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-[hsl(var(--foreground))]">
      {children}
    </label>
  )
}

// ─── Confirmation screen ─────────────────────────────────────────────────────

function SuccessScreen({ referenceNumber }) {
  const { t } = useLang()
  const o = translations.onboarding

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <nav className="border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/"><Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={26} width={86} className="object-contain" /></Link>
        </div>
      </nav>
      <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <PartyPopper className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-[hsl(var(--foreground))] md:text-3xl">
            {t(o.successTitle)}
          </h1>
          {referenceNumber && (
            <p className="mb-3 text-base font-semibold text-[hsl(var(--primary))]">
              رقم الطلب: {referenceNumber}
            </p>
          )}
          <p className="mb-8 text-lg text-[hsl(var(--muted-foreground))]">{t(o.successMsg)}</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t(o.successCta)}
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Main form ───────────────────────────────────────────────────────────────

function OnboardingForm() {
  const { t, isRTL, lang } = useLang()
  const o = translations.onboarding

  // Build { label, code } pairs — label is what the user sees, code is what the API expects
  const FINANCING_OPTIONS = o.financingTypes.map((ft, i) => ({
    label: t(ft),
    code: FINANCING_TYPE_CODES[i],
  }))

  const [currentStep, setCurrentStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [crTouched, setCrTouched] = useState(false)

  const [formData, setFormData] = useState({
    businessName: '',
    crNumber: '',
    city: '',
    sector: '',
    contactName: '',
    phone: '',
    email: '',
    financingType: '',
    amount: '',
    purpose: '',
  })

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

  const crValid = /^7\d{9}$/.test(formData.crNumber)

  const canProceed = () => {
    if (currentStep === 0) return formData.businessName && crValid && formData.contactName && formData.phone
    if (currentStep === 1) return formData.financingType && formData.amount
    return true
  }

  const steps = [
    { icon: Building2, label: t(o.step1Label) },
    { icon: FileText, label: t(o.step2Label) },
    { icon: Send, label: t(o.step3Label) },
  ]

  const BackArrow = isRTL ? ArrowRight : ArrowLeft
  const NextArrow = isRTL ? ArrowLeft : ArrowRight

  const stepVariants = {
    enter: { opacity: 0, x: isRTL ? -20 : 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isRTL ? 20 : -20 },
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/applications/public-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: formData.businessName,
          cr_national_number: formData.crNumber,
          city_of_operation: formData.city,
          sector: formData.sector,
          contact_person: formData.contactName,
          contact_person_number: formData.phone,
          email: formData.email,
          financing_type: formData.financingType,
          approximate_financing_amount: formData.amount,
          notes: formData.purpose,
        }),
      })
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مجدداً. / Server error, please try again.')
      }
      if (!res.ok) {
        const errorMessages = {
          CR_NOT_FOUND: {
            ar: 'رقم السجل التجاري غير موجود أو غير صحيح. يرجى التحقق من الرقم والمحاولة مجدداً.',
            en: 'The CR number does not exist or is invalid. Please check and try again.',
          },
          DUPLICATE_CR: {
            ar: 'تم تقديم طلب بهذا الرقم الوطني مسبقاً.',
            en: 'A request with this CR number has already been submitted.',
          },
        }
        const msg = data.errorCode && errorMessages[data.errorCode]
          ? errorMessages[data.errorCode][lang]
          : (data.error || (lang === 'ar' ? 'حدث خطأ. يرجى المحاولة مجدداً.' : 'Submission failed, please try again.'))
        throw new Error(msg)
      }
      setReferenceNumber(data.reference_number)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return <SuccessScreen referenceNumber={referenceNumber} />

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <nav className="border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/"><Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={26} width={86} className="object-contain" /></Link>
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Shield className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="hidden sm:inline">{t(o.privacyNote)}</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Progress */}
          <div className="mb-10">
            <div className="mb-6 h-1.5 w-full rounded-full bg-[hsl(var(--muted))]">
              <motion.div
                className="h-full rounded-full bg-[hsl(var(--primary))]"
                initial={false}
                animate={{ width: `${((currentStep + 1) / 3) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-[hsl(var(--primary))] text-white'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      index === currentStep ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Step 1 — Business Info */}
              {currentStep === 0 && (
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-[hsl(var(--foreground))]">{t(o.step1Title)}</h2>
                  <p className="mb-8 text-[hsl(var(--muted-foreground))]">{t(o.step1Sub)}</p>
                  <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="businessName">{t(o.businessName)} *</Label>
                        <Input id="businessName" placeholder={t(o.businessNamePh)} value={formData.businessName} onChange={(e) => updateField('businessName', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="crNumber">{t(o.crNumber)} *</Label>
                        <Input id="crNumber" placeholder={t(o.crNumberPh)} value={formData.crNumber} onChange={(e) => updateField('crNumber', e.target.value)} onBlur={() => setCrTouched(true)} dir="ltr" />
                        {crTouched && !crValid && (
                          <p className="mt-1.5 text-xs text-red-500">
                            {lang === 'ar' ? 'الرقم الوطني يجب أن يتكون من 10 أرقام ويبدأ بالرقم 7' : 'National number must be exactly 10 digits and start with 7'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="city">{t(o.city)}</Label>
                        <Input id="city" placeholder={t(o.cityPh)} value={formData.city} onChange={(e) => updateField('city', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="sector">{t(o.sector)}</Label>
                        <Input id="sector" placeholder={t(o.sectorPh)} value={formData.sector} onChange={(e) => updateField('sector', e.target.value)} />
                      </div>
                    </div>
                    <div className="border-t border-[hsl(var(--border))] pt-5">
                      <p className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">{t(o.contactInfo)}</p>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="contactName">{t(o.contactName)} *</Label>
                          <Input id="contactName" placeholder={t(o.contactNamePh)} value={formData.contactName} onChange={(e) => updateField('contactName', e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="phone">{t(o.phone)} *</Label>
                          <Input id="phone" type="tel" placeholder={t(o.phonePh)} value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} dir="ltr" />
                        </div>
                      </div>
                      <div className="mt-5">
                        <Label htmlFor="email">{t(o.email)}</Label>
                        <Input id="email" type="email" placeholder={t(o.emailPh)} value={formData.email} onChange={(e) => updateField('email', e.target.value)} dir="ltr" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Financing Details */}
              {currentStep === 1 && (
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-[hsl(var(--foreground))]">{t(o.step2Title)}</h2>
                  <p className="mb-8 text-[hsl(var(--muted-foreground))]">{t(o.step2Sub)}</p>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="financingType">{t(o.financingType)} *</Label>
                      <Select
                        id="financingType"
                        value={FINANCING_OPTIONS.find((opt) => opt.code === formData.financingType)?.label ?? ''}
                        onChange={(label) => {
                          const opt = FINANCING_OPTIONS.find((o) => o.label === label)
                          updateField('financingType', opt?.code ?? '')
                        }}
                        placeholder={t(o.financingTypePh)}
                        options={FINANCING_OPTIONS.map((opt) => opt.label)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">{t(o.amount)} *</Label>
                      <Select
                        id="amount"
                        value={formData.amount}
                        onChange={(v) => updateField('amount', v)}
                        placeholder={t(o.amountPh)}
                        options={o.amountOptions.map((opt) => t(opt))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="purpose">{t(o.purpose)}</Label>
                      <textarea
                        id="purpose"
                        placeholder={t(o.purposePh)}
                        value={formData.purpose}
                        onChange={(e) => updateField('purpose', e.target.value)}
                        rows={4}
                        className="mt-1.5 block w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Review */}
              {currentStep === 2 && (
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-[hsl(var(--foreground))]">{t(o.step3Title)}</h2>
                  <p className="mb-8 text-[hsl(var(--muted-foreground))]">{t(o.step3Sub)}</p>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-6">
                      <h3 className="mb-4 text-sm font-semibold text-[hsl(var(--muted-foreground))]">{t(o.reviewBusiness)}</h3>
                      <dl className="space-y-3 text-sm">
                        {[
                          ['businessName', formData.businessName],
                          ['crNumber', formData.crNumber],
                          ['city', formData.city],
                          ['contactName', formData.contactName],
                          ['phone', formData.phone],
                        ].map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <dt className="text-[hsl(var(--muted-foreground))]">{t(o.reviewLabels[key])}</dt>
                            <dd className="font-medium text-[hsl(var(--foreground))]">{val || '—'}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-6">
                      <h3 className="mb-4 text-sm font-semibold text-[hsl(var(--muted-foreground))]">{t(o.reviewFinancing)}</h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-[hsl(var(--muted-foreground))]">{t(o.reviewLabels.financingType)}</dt>
                          <dd className="font-medium text-[hsl(var(--foreground))]">{FINANCING_OPTIONS.find((opt) => opt.code === formData.financingType)?.label || '—'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[hsl(var(--muted-foreground))]">{t(o.reviewLabels.amount)}</dt>
                          <dd className="font-medium text-[hsl(var(--foreground))]">{formData.amount || '—'}</dd>
                        </div>
                        {formData.purpose && (
                          <div>
                            <dt className="text-[hsl(var(--muted-foreground))]">{t(o.reviewLabels.purpose)}</dt>
                            <dd className="mt-1 font-medium text-[hsl(var(--foreground))]">{formData.purpose}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.3)] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                      <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />
                        <p>
                          {t(o.consent)}{' '}
                          <Link href="/terms" className="text-[hsl(var(--primary))] hover:underline">
                            {lang === 'ar' ? 'الشروط' : 'Terms'}
                          </Link>
                          {' • '}
                          <Link href="/privacy" className="text-[hsl(var(--primary))] hover:underline">
                            {lang === 'ar' ? 'الخصوصية' : 'Privacy'}
                          </Link>
                        </p>
                      </div>
                    </div>

                    {error && (
                      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between gap-3">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-white px-5 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
              >
                <BackArrow className="h-4 w-4" />
                {t(o.prev)}
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]"
              >
                {t(o.backHome)}
              </Link>
            )}

            {currentStep < 2 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceed()}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t(o.next)}
                <NextArrow className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t(o.submit)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <PublicLanguageProvider>
      <OnboardingForm />
    </PublicLanguageProvider>
  )
}
