'use client'

// Application form, rebuilt to the nesbah.net reference implementation's composition
// (src/routes/apply.tsx + src/routes/en/apply.tsx):
//
//   sticky header → two-column layout (sticky aside + floating form card)
//   3 steps: Company info → Financing details → Contact info
//   consent on the final step; NO review step (the reference has none)
//
// Field set, codes and validation come from the earlier data-model work — see
// src/lib/apply-options.js and src/lib/validators.js. Copy lives in
// src/content/apply.js and is the reference's verbatim.

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, ArrowRight, Check, Sparkles, ShieldCheck, Send, MessageCircle, Globe,
    Building2, Banknote, TrendingUp, Cog, FolderKanban, Building, CreditCard,
} from 'lucide-react'
import { PublicLanguageProvider, useLang } from '@/contexts/PublicLanguageContext'
import { CR_NATIONAL_NUMBER_RE, SAUDI_MOBILE_RE, EMAIL_RE } from '@/lib/validators'
import {
    FINANCING_TYPES, FINANCING_ORDER, AMOUNT_RANGES, AMOUNT_ORDER,
    AGE_RANGES, AGE_ORDER, REVENUE_RANGES, REVENUE_ORDER,
    SECTORS, CITIES, digitsOnly,
} from '@/lib/apply-options'
import { WHATSAPP } from '@/content/home'
import {
    steps as STEPS, aside, header as headerCopy, stepHeadings, fields as f,
    consent as consentCopy, errors as errorCopy, nav as navCopy, success as successCopy,
    submitErrors,
} from '@/content/apply'

const FINANCING_ICONS = {
    corporate: Building2, working_capital: Banknote, expansion: TrendingUp,
    equipment: Cog, project: FolderKanban, commercial_real_estate: Building, creditCard: CreditCard,
    pos: CreditCard,
}
const ASIDE_ICONS = { shield: ShieldCheck, check: Check, send: Send }

const inputCls = (hasError) => [
    'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted-foreground outline-none transition-all',
    hasError
        ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
        : 'border-hairline focus:border-violet focus:ring-2 focus:ring-violet/15',
].join(' ')

function FieldLabel({ htmlFor, required, children }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
            {children}
            {required && <span className="text-destructive mr-1" aria-hidden="true">*</span>}
        </label>
    )
}

function Field({ id, label, required, error, children }) {
    return (
        <div className="block">
            <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
            {children}
            {error && <p role="alert" className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
    )
}

// Label + error for a group of controls (button grids) rather than a single input.
function FieldGroup({ label, required, error, children }) {
    return (
        <div className="block">
            <FieldLabel required={required}>{label}</FieldLabel>
            {children}
            {error && <p role="alert" className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
    )
}

// The user sees a label; the form stores a stable code.
function CodeSelect({ id, value, onChange, placeholder, options, error, disabled }) {
    return (
        <select
            id={id}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls(!!error)} appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
        </select>
    )
}

function SectionHeader({ title, subtitle }) {
    return (
        <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-ink md:text-2xl">{title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        </div>
    )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function ApplyForm() {
    const { t, lang, isRTL, toggleLang } = useLang()
    const Arrow = isRTL ? ArrowLeft : ArrowRight
    const ArrowBack = isRTL ? ArrowRight : ArrowLeft

    const [step, setStep] = useState(1)
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const [reference, setReference] = useState(null)

    const [form, setForm] = useState({
        companyName: '', cr: '', sector: '', city: '',
        revenueCode: '', isPreRevenue: false,
        financingCode: '', amountCode: '', ageCode: '', hasPos: '',
        contactName: '', mobile: '', email: '', notes: '', consent: false,
    })

    const setField = (k, v) => {
        setForm((prev) => ({ ...prev, [k]: v }))
        setErrors((e) => ({ ...e, [k]: undefined }))
    }

    const opts = (ranges, order) => order.map((code) => ({ code, label: ranges[code][lang] }))

    const validateStep = (s) => {
        const e = {}
        if (s === 1) {
            if (!form.companyName.trim()) e.companyName = t(errorCopy.companyName)
            if (!CR_NATIONAL_NUMBER_RE.test(digitsOnly(form.cr))) e.cr = t(errorCopy.cr)
            if (!form.sector) e.sector = t(errorCopy.sector)
            if (!form.city) e.city = t(errorCopy.city)
            if (!form.revenueCode && !form.isPreRevenue) e.revenueCode = t(errorCopy.revenue)
        }
        if (s === 2) {
            if (!form.financingCode) e.financingCode = t(errorCopy.financingType)
            if (!form.amountCode) e.amountCode = t(errorCopy.amount)
            if (!form.ageCode) e.ageCode = t(errorCopy.age)
            if (!form.hasPos) e.hasPos = t(errorCopy.hasPos)
        }
        if (s === 3) {
            if (!form.contactName.trim()) e.contactName = t(errorCopy.contactName)
            if (!SAUDI_MOBILE_RE.test(digitsOnly(form.mobile))) e.mobile = t(errorCopy.mobile)
            if (form.email && !EMAIL_RE.test(form.email.trim())) e.email = t(errorCopy.email)
            if (!form.consent) e.consent = t(errorCopy.consent)
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const next = () => { if (validateStep(step)) setStep((s) => Math.min(3, s + 1)) }
    const back = () => setStep((s) => Math.max(1, s - 1))
    const progress = ((step - 1) / (STEPS.length - 1)) * 100

    const submit = async () => {
        if (!validateStep(3)) return
        setSubmitting(true)
        setSubmitError(null)
        try {
            const res = await fetch('/api/applications/public-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_name: form.companyName,
                    cr_national_number: digitsOnly(form.cr),
                    city_code: form.city,
                    sector_code: form.sector,
                    annual_revenue_code: form.isPreRevenue ? null : form.revenueCode,
                    is_pre_revenue: form.isPreRevenue,
                    contact_person: form.contactName,
                    contact_person_number: digitsOnly(form.mobile),
                    email: form.email,
                    financing_type: form.financingCode,
                    amount_range_code: form.amountCode,
                    business_age_range_code: form.ageCode,
                    has_pos: form.hasPos === 'yes',
                    notes: form.notes,
                    consent: form.consent,
                }),
            })
            let data
            try { data = await res.json() } catch { throw new Error(t(submitErrors.generic)) }
            if (!res.ok) {
                const mapped = data.errorCode && submitErrors[data.errorCode]
                throw new Error(mapped ? t(mapped) : (data.error || t(submitErrors.generic)))
            }
            setReference(data.reference_number)
        } catch (err) {
            setSubmitError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-hairline bg-cream/80 backdrop-blur-md">
                <div className="container flex h-16 items-center justify-between md:h-20">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={26} width={86} className="h-8 w-auto object-contain md:h-9" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={toggleLang} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-violet" aria-label={isRTL ? 'Switch to English' : 'التحويل إلى العربية'}>
                            <Globe size={14} /> {isRTL ? 'EN' : 'AR'}
                        </button>
                        <a href={WHATSAPP[lang] || WHATSAPP.ar} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-violet sm:inline-flex">
                            <MessageCircle size={16} className="text-mint" /> {t(headerCopy.whatsapp)}
                        </a>
                        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet">
                            {t(headerCopy.home)}
                        </Link>
                    </div>
                </div>
            </header>

            <main id="main-content" tabIndex={-1} className="pct-motif relative">
                <section className="container py-10 md:py-16">
                    <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
                        {/* Aside */}
                        <aside className="lg:sticky lg:top-28">
                            <div className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink">
                                <Sparkles size={14} className="text-violet" /> {t(aside.badge)}
                            </div>
                            <h1 className="mt-5 font-display text-3xl font-bold leading-[1.15] text-ink md:text-5xl">
                                {t(aside.titleLine1)} <br className="hidden md:block" />
                                <span className="text-gradient-violet">{t(aside.titleAccent)}</span>.
                            </h1>
                            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">{t(aside.sub)}</p>

                            <ul className="mt-8 space-y-3">
                                {aside.points.map((it) => {
                                    const Icon = ASIDE_ICONS[it.icon]
                                    return (
                                        <li key={t(it.t)} className="flex items-start gap-3">
                                            <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-hairline bg-white text-violet shadow-sm">
                                                <Icon size={16} />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-ink">{t(it.t)}</p>
                                                <p className="mt-0.5 text-xs text-ink-soft">{t(it.d)}</p>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>

                            <a href={WHATSAPP[lang] || WHATSAPP.ar} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-violet">
                                <MessageCircle size={16} className="text-mint" /> {t(aside.whatsapp)}
                            </a>
                        </aside>

                        {/* Form card */}
                        <div className="relative">
                            <div className="relative rounded-3xl border border-hairline bg-white/90 p-6 shadow-[0_30px_80px_-40px_rgba(30,24,81,0.35)] backdrop-blur md:p-10">
                                {/* Stepper */}
                                <div className="mb-8">
                                    <ol className="flex list-none items-center justify-between p-0" aria-label={`${isRTL ? 'خطوات الطلب' : 'Application steps'}: ${step} / ${STEPS.length}`}>
                                        {STEPS.map((s, i) => {
                                            const state = step > s.id ? 'done' : step === s.id ? 'active' : 'todo'
                                            return (
                                                <li key={s.id} className="flex flex-1 items-center" aria-current={state === 'active' ? 'step' : undefined}>
                                                    <div className="flex min-w-max flex-col items-center gap-2">
                                                        <div
                                                            className={[
                                                                'grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-all',
                                                                state === 'done' ? 'bg-mint text-ink'
                                                                    : state === 'active' ? 'bg-violet text-white shadow-glow'
                                                                        : 'bg-secondary text-muted-foreground',
                                                            ].join(' ')}
                                                            aria-hidden="true"
                                                        >
                                                            {state === 'done' ? <Check size={18} /> : s.id}
                                                        </div>
                                                        <span className={['text-xs font-medium md:text-sm', state === 'todo' ? 'text-muted-foreground' : 'text-ink'].join(' ')}>
                                                            {t(s)}
                                                        </span>
                                                    </div>
                                                    {i < STEPS.length - 1 && (
                                                        <div className="mx-3 h-[2px] flex-1 overflow-hidden rounded-full bg-hairline md:mx-4" aria-hidden="true">
                                                            <div className="h-full bg-violet transition-all duration-500" style={{ width: step > s.id ? '100%' : '0%' }} />
                                                        </div>
                                                    )}
                                                </li>
                                            )
                                        })}
                                    </ol>
                                    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary md:hidden">
                                        <div className="h-full bg-violet transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {reference ? (
                                        <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="py-8 text-center" role="status" aria-live="polite">
                                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-ink" aria-hidden="true">
                                                <Check size={30} />
                                            </div>
                                            <h2 tabIndex={-1} className="mt-5 font-display text-2xl font-bold text-ink outline-none md:text-3xl">
                                                {t(successCopy.title)}
                                            </h2>
                                            <p className="mx-auto mt-3 max-w-md text-ink-soft">{t(successCopy.sub)}</p>
                                            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-hairline bg-secondary/60 px-4 py-2.5 font-mono text-ink">
                                                <span className="text-xs text-ink-soft">{t(successCopy.refLabel)}</span>
                                                <span className="text-base font-bold tracking-wide">{reference}</span>
                                            </div>
                                            <p className="mx-auto mt-5 max-w-md text-sm text-ink-soft">{t(successCopy.followUp)}</p>
                                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                                <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-violet">
                                                    {t(successCopy.home)}
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                                            <SectionHeader title={t(stepHeadings[step].title)} subtitle={t(stepHeadings[step].sub)} />

                                            {/* Step 1 — Company */}
                                            {step === 1 && (
                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <Field id="companyName" label={t(f.companyName.label)} required error={errors.companyName}>
                                                        <input id="companyName" className={inputCls(!!errors.companyName)} value={form.companyName} onChange={(e) => setField('companyName', e.target.value)} placeholder={t(f.companyName.ph)} />
                                                    </Field>
                                                    <Field id="cr" label={t(f.cr.label)} required error={errors.cr}>
                                                        <input id="cr" inputMode="numeric" maxLength={12} dir="ltr" className={inputCls(!!errors.cr)} value={form.cr} onChange={(e) => setField('cr', digitsOnly(e.target.value))} placeholder={t(f.cr.ph)} />
                                                    </Field>
                                                    <Field id="sector" label={t(f.sector.label)} required error={errors.sector}>
                                                        <CodeSelect id="sector" value={form.sector} onChange={(v) => setField('sector', v)} placeholder={t(f.sector.ph)} error={errors.sector}
                                                            options={SECTORS.map((s) => ({ code: s.code, label: s[lang] }))} />
                                                    </Field>
                                                    <Field id="city" label={t(f.city.label)} required error={errors.city}>
                                                        <CodeSelect id="city" value={form.city} onChange={(v) => setField('city', v)} placeholder={t(f.city.ph)} error={errors.city}
                                                            options={CITIES.map((c) => ({ code: c.code, label: c[lang] }))} />
                                                    </Field>
                                                    <Field id="revenueCode" label={t(f.revenue.label)} required={!form.isPreRevenue} error={errors.revenueCode}>
                                                        <CodeSelect id="revenueCode" value={form.revenueCode} onChange={(v) => setField('revenueCode', v)} placeholder={t(f.revenue.ph)}
                                                            error={errors.revenueCode} disabled={form.isPreRevenue} options={opts(REVENUE_RANGES, REVENUE_ORDER)} />
                                                    </Field>
                                                    <div className="md:col-span-2">
                                                        <label className="inline-flex cursor-pointer select-none items-center gap-3 rounded-2xl border border-hairline bg-secondary/60 px-4 py-3 transition-colors hover:border-violet">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 accent-violet"
                                                                checked={form.isPreRevenue}
                                                                onChange={(e) => {
                                                                    setField('isPreRevenue', e.target.checked)
                                                                    if (e.target.checked) setField('revenueCode', '')
                                                                }}
                                                            />
                                                            <span className="text-sm text-ink">{t(f.preRevenue.label)}</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 2 — Financing */}
                                            {step === 2 && (
                                                <div className="space-y-6">
                                                    <FieldGroup label={t(f.financingType.label)} required error={errors.financingCode}>
                                                        <div role="group" aria-label={t(f.financingType.label)} className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                                                            {FINANCING_ORDER.map((code) => {
                                                                const Icon = FINANCING_ICONS[code]
                                                                const active = form.financingCode === code
                                                                return (
                                                                    <button
                                                                        key={code}
                                                                        type="button"
                                                                        aria-pressed={active}
                                                                        onClick={() => setField('financingCode', code)}
                                                                        className={[
                                                                            'flex items-start gap-3 rounded-2xl border p-3.5 text-start transition-all',
                                                                            active ? 'border-violet bg-violet/5 shadow-sm' : 'border-hairline bg-white hover:border-violet/60',
                                                                        ].join(' ')}
                                                                    >
                                                                        <span aria-hidden="true" className={['grid h-9 w-9 shrink-0 place-items-center rounded-xl', active ? 'bg-violet text-white' : 'bg-secondary text-ink'].join(' ')}>
                                                                            <Icon size={16} />
                                                                        </span>
                                                                        <span className="text-sm font-semibold leading-tight text-ink">{FINANCING_TYPES[code][lang]}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </FieldGroup>

                                                    <div className="grid gap-5 md:grid-cols-2">
                                                        <Field id="amountCode" label={t(f.amount.label)} required error={errors.amountCode}>
                                                            <CodeSelect id="amountCode" value={form.amountCode} onChange={(v) => setField('amountCode', v)} placeholder={t(f.amount.ph)} error={errors.amountCode} options={opts(AMOUNT_RANGES, AMOUNT_ORDER)} />
                                                        </Field>
                                                        <Field id="ageCode" label={t(f.age.label)} required error={errors.ageCode}>
                                                            <CodeSelect id="ageCode" value={form.ageCode} onChange={(v) => setField('ageCode', v)} placeholder={t(f.age.ph)} error={errors.ageCode} options={opts(AGE_RANGES, AGE_ORDER)} />
                                                        </Field>
                                                    </div>

                                                    <FieldGroup label={t(f.hasPos.label)} required error={errors.hasPos}>
                                                        <div role="group" aria-label={t(f.hasPos.label)} className="flex gap-3">
                                                            {[{ v: 'yes', l: t(f.yes) }, { v: 'no', l: t(f.no) }].map((o) => {
                                                                const active = form.hasPos === o.v
                                                                return (
                                                                    <button
                                                                        key={o.v}
                                                                        type="button"
                                                                        aria-pressed={active}
                                                                        onClick={() => setField('hasPos', o.v)}
                                                                        className={[
                                                                            'flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all',
                                                                            active ? 'border-violet bg-violet text-white' : 'border-hairline bg-white text-ink hover:border-violet/60',
                                                                        ].join(' ')}
                                                                    >
                                                                        {o.l}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </FieldGroup>
                                                </div>
                                            )}

                                            {/* Step 3 — Contact */}
                                            {step === 3 && (
                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <Field id="contactName" label={t(f.contactName.label)} required error={errors.contactName}>
                                                        <input id="contactName" className={inputCls(!!errors.contactName)} value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder={t(f.contactName.ph)} />
                                                    </Field>
                                                    <Field id="mobile" label={t(f.mobile.label)} required error={errors.mobile}>
                                                        <input id="mobile" inputMode="numeric" maxLength={12} dir="ltr" className={inputCls(!!errors.mobile)} value={form.mobile} onChange={(e) => setField('mobile', digitsOnly(e.target.value))} placeholder={t(f.mobile.ph)} />
                                                    </Field>
                                                    <div className="md:col-span-2">
                                                        <Field id="email" label={t(f.email.label)} error={errors.email}>
                                                            <input id="email" type="email" dir="ltr" className={inputCls(!!errors.email)} value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder={t(f.email.ph)} />
                                                        </Field>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Field id="notes" label={t(f.notes.label)}>
                                                            <textarea id="notes" rows={4} className={`${inputCls(false)} resize-none`} value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder={t(f.notes.ph)} />
                                                        </Field>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className={[
                                                            'flex cursor-pointer select-none items-start gap-3 rounded-2xl border p-4 transition-colors',
                                                            errors.consent ? 'border-destructive bg-destructive/5' : 'border-hairline bg-secondary/50 hover:border-violet',
                                                        ].join(' ')}>
                                                            <input
                                                                type="checkbox"
                                                                className="mt-1 h-4 w-4 accent-violet"
                                                                checked={form.consent}
                                                                onChange={(e) => setField('consent', e.target.checked)}
                                                                aria-required="true"
                                                                aria-invalid={errors.consent ? true : undefined}
                                                            />
                                                            <span className="text-xs leading-relaxed text-ink md:text-sm">
                                                                {t(consentCopy.text)}{' '}
                                                                <Link href="/terms" className="text-violet underline">{t(consentCopy.terms)}</Link>{' '}
                                                                {t(consentCopy.and)}{' '}
                                                                <Link href="/privacy" className="text-violet underline">{t(consentCopy.privacy)}</Link>.
                                                            </span>
                                                        </label>
                                                        {errors.consent && <p role="alert" className="mt-1.5 text-xs text-destructive">{errors.consent}</p>}
                                                    </div>
                                                </div>
                                            )}

                                            {submitError && step === 3 && (
                                                <p role="alert" className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                                    {submitError}
                                                </p>
                                            )}

                                            {/* Navigation */}
                                            <div className="mt-8 flex items-center justify-between gap-3 border-t border-hairline pt-4">
                                                {step > 1 ? (
                                                    <button type="button" onClick={back} className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-violet">
                                                        <ArrowBack size={16} /> {t(navCopy.back)}
                                                    </button>
                                                ) : <span />}

                                                {step < 3 ? (
                                                    <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-full bg-violet px-6 py-3 text-sm font-bold text-white shadow-glow transition-colors hover:bg-ink">
                                                        {t(navCopy.next)} <Arrow size={16} />
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-violet px-6 py-3 text-sm font-bold text-white shadow-glow transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none">
                                                        {submitting ? t(navCopy.submitting) : t(navCopy.submit)}
                                                        {!submitting && <Send size={16} />}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default function OnboardingClient() {
    return (
        <PublicLanguageProvider>
            <ApplyForm />
        </PublicLanguageProvider>
    )
}
