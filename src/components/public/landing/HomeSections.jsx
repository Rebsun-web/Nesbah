'use client'

// Homepage sections, ported from the nesbah.net reference implementation
// (src/routes/index.tsx + src/routes/en/index.tsx) to this codebase's conventions:
// TanStack `<Link to>` → next/link `<Link href>`, TypeScript stripped, and the two
// per-language route files collapsed into one component set driven by `useLang()`.
//
// Copy lives in src/content/home.js and is the reference's verbatim — it is
// client-approved, so do not reword it here.
//
// Section order matches the reference exactly:
//   Hero → DepositsPromo → MarketSize → HowItWorks → WhyNesbah
//        → FinancingTypes → Audience → FAQ → FinalCTA

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles, Building2, FileText, CheckCircle2, ChevronDown } from 'lucide-react'
import { useLang } from '@/contexts/PublicLanguageContext'
import {
    WHATSAPP, hero, depositsPromo, marketSize, howItWorks, whyNesbah,
    financingTypesSection, audienceSection, faqSection, finalCta,
} from '@/content/home'

// The reference uses ArrowLeft in Arabic (pointing along the RTL reading direction)
// and ArrowRight in English. One component, direction-aware.
function Arrow({ size = 18, className = '' }) {
    const { isRTL } = useLang()
    const Icon = isRTL ? ArrowLeft : ArrowRight
    return <Icon size={size} aria-hidden="true" className={className} />
}

function SectionHeading({ eyebrow, title, sub }) {
    return (
        <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet/5 px-3 py-1 text-xs font-medium text-violet">
                {eyebrow}
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">{title}</h2>
            {sub && <p className="mt-4 text-base text-ink/60 md:text-lg">{sub}</p>}
        </div>
    )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export function Hero() {
    const { t, lang, isRTL } = useLang()
    const guideHref = lang === 'en' ? '/en/financing-guide' : '/financing-guide'
    const rows = hero.cardRows[lang] || hero.cardRows.ar

    return (
        <section className="pct-motif pct-motif-light relative overflow-hidden bg-hero-gradient text-white">
            <div className="container relative pb-20 pt-16 md:pb-28 md:pt-24">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
                    <div className="relative z-10 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-soft">
                            {t(hero.eyebrow)}
                        </p>
                        <h1 className={`mt-5 font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl ${isRTL ? 'leading-[1.3]' : 'leading-[1.05] xl:text-6xl 2xl:text-7xl'}`}>
                            {t(hero.titleLine1)}
                            <br />
                            <span className="text-gradient-violet">{t(hero.titleLine2)}</span>
                        </h1>
                        <p className="mt-6 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
                            {t(hero.sub)}
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-full bg-violet px-7 py-3.5 font-bold text-white transition-colors hover:bg-violet-soft">
                                {t(hero.ctaPrimary)}
                                <Arrow />
                            </Link>
                            <Link href={guideHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/5">
                                {t(hero.ctaSecondary)}
                            </Link>
                        </div>
                        <p className="mt-6 max-w-md text-xs leading-relaxed text-white/55">
                            {t(hero.disclaimer)}
                        </p>
                    </div>

                    <div className="relative z-10 min-w-0">
                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-end xl:gap-2">
                            {/* Satellite A */}
                            <div
                                className="glass animate-float hidden w-[140px] flex-col justify-center rounded-2xl p-4 text-white shadow-elevated xl:flex"
                                style={{ animationDelay: '0s', transform: 'translateY(-14px)' }}
                                aria-hidden="true"
                            >
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">
                                    <FileText size={12} aria-hidden="true" /> {t(hero.satelliteA.label)}
                                </div>
                                <div className="mt-2 font-display text-base font-bold leading-tight">{t(hero.satelliteA.value)}</div>
                                <div className="mt-1 text-[11px] leading-snug text-white/70">{t(hero.satelliteA.note)}</div>
                            </div>

                            {/* Central illustrative comparison card */}
                            <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/10 bg-white text-ink shadow-elevated lg:mr-auto xl:mx-0 xl:w-[350px] xl:max-w-[350px]">
                                <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink/60">
                                        <Sparkles size={14} aria-hidden="true" className="text-violet" /> {t(hero.cardTitle)}
                                    </span>
                                    <span className="font-mono text-xs text-ink/50">{hero.cardRef}</span>
                                </div>
                                <ul className="divide-y divide-hairline">
                                    {rows.map((r) => (
                                        <li key={r.n} className="flex items-center justify-between px-6 py-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet/10">
                                                    <Building2 size={16} className="text-violet" aria-hidden="true" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-ink">{r.n}</div>
                                                    <div className="text-[11px] text-ink/50">{r.t}</div>
                                                </div>
                                            </div>
                                            <div className="font-display text-sm font-bold text-ink">{r.a}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Satellite B */}
                            <div
                                className="glass animate-float hidden w-[145px] flex-col justify-center rounded-2xl p-4 text-white shadow-elevated xl:flex"
                                style={{ animationDelay: '1.6s', transform: 'translateY(18px)' }}
                                aria-hidden="true"
                            >
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/70">
                                    <CheckCircle2 size={12} aria-hidden="true" /> {t(hero.satelliteB.label)}
                                </div>
                                <div className="mt-2 font-display text-base font-bold leading-tight">{t(hero.satelliteB.value)}</div>
                                <div className="mt-1 text-[11px] leading-snug text-white/70">{t(hero.satelliteB.note)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── Deposits promo ──────────────────────────────────────────────────────────
// Links to /deposits, which is reverse-proxied to nesbah.net (see next.config.mjs
// and src/lib/deposits-proxy.js). Same-domain, so no UTM parameters.

export function DepositsPromo() {
    const { t, lang } = useLang()
    const depositsHref = lang === 'en' ? '/en/deposits' : '/deposits'
    const rows = depositsPromo.rows[lang] || depositsPromo.rows.ar

    return (
        <section aria-labelledby="deposits-promo" className="bg-white">
            <div className="container py-8 md:py-10">
                <div className="ms-0 w-full max-w-[480px]">
                    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-violet/10 via-white to-violet-soft/10 p-5 shadow-elevated md:p-6">
                        <div className="absolute -top-12 -end-12 h-40 w-40 rounded-full bg-violet/10 blur-2xl" aria-hidden="true" />
                        <div className="relative">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-violet">
                                {t(depositsPromo.badge)}
                            </span>
                            <h2 id="deposits-promo" className="mt-2.5 font-display text-xl font-bold leading-snug text-ink md:text-2xl">
                                {t(depositsPromo.title)}
                            </h2>

                            <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-white" aria-hidden="true">
                                <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink/60">
                                        <Sparkles size={11} className="text-violet" /> {t(depositsPromo.previewTitle)}
                                    </span>
                                    <span className="font-mono text-[10px] text-ink/50">{t(depositsPromo.previewMeta)}</span>
                                </div>
                                <ul className="divide-y divide-hairline">
                                    {rows.map((r) => (
                                        <li key={r.n} className={`flex items-center justify-between px-3 py-2 ${r.hi ? 'bg-violet/5' : ''}`}>
                                            <div className="flex min-w-0 items-center gap-2">
                                                <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${r.hi ? 'bg-violet/15 text-violet' : 'bg-secondary text-ink/50'}`}>
                                                    <Building2 size={11} />
                                                </div>
                                                <div className="truncate text-xs font-semibold text-ink">{r.n}</div>
                                            </div>
                                            <div className={`font-display font-bold ${r.hi ? 'text-sm text-violet' : 'text-xs text-ink/80'}`}>{r.r}</div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="border-t border-hairline px-3 py-1.5 text-[9px] text-ink/50">
                                    {t(depositsPromo.previewFoot)}
                                </div>
                            </div>

                            <Link href={depositsHref} className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-soft">
                                {t(depositsPromo.cta)}
                                <Arrow size={15} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── Market size ─────────────────────────────────────────────────────────────

export function MarketSize() {
    const { t } = useLang()
    return (
        <section aria-labelledby="market-size" className="border-y border-hairline bg-white">
            <div className="container py-12 md:py-14">
                <div className="grid items-center gap-8 md:grid-cols-[auto_1fr_auto] md:gap-12">
                    <div className="font-display text-6xl font-bold leading-none text-ink md:text-7xl">
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }} className="inline-block">{marketSize.figure}</span>
                    </div>
                    <div className="border-s border-hairline ps-6 md:ps-10">
                        <h2 id="market-size" className="font-display text-lg font-bold leading-snug text-ink md:text-xl">
                            {t(marketSize.title)}
                        </h2>
                        <p className="mt-1 text-sm text-ink/60">{t(marketSize.note)}</p>
                    </div>
                    <div className="text-xs leading-relaxed text-ink/55 md:text-end md:text-sm">
                        {t(marketSize.source)}
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 md:justify-end">
                            {marketSize.links.map((l) => (
                                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="text-violet hover:underline">
                                    {t(l)}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── How it works ────────────────────────────────────────────────────────────

export function HowItWorks() {
    const { t } = useLang()
    return (
        <section id="how" className="bg-white py-20 md:py-24">
            <div className="container">
                <SectionHeading eyebrow={t(howItWorks.eyebrow)} title={t(howItWorks.title)} sub={t(howItWorks.sub)} />
                <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-3">
                    {howItWorks.steps.map((s) => {
                        const Icon = s.icon
                        return (
                            <li key={t(s.title)} className="bg-card p-8">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-violet/10 text-violet">
                                        <Icon size={20} aria-hidden="true" />
                                    </div>
                                    <span className="font-display text-3xl font-bold text-ink/15">{t(s.n)}</span>
                                </div>
                                <h3 className="mt-6 font-display text-lg font-bold text-ink">{t(s.title)}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink/60">{t(s.desc)}</p>
                            </li>
                        )
                    })}
                </ol>
            </div>
        </section>
    )
}

// ─── Why Nesbah ──────────────────────────────────────────────────────────────

export function WhyNesbah() {
    const { t } = useLang()
    return (
        <section id="why" className="py-20 md:py-24">
            <div className="container">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <SectionHeading eyebrow={t(whyNesbah.eyebrow)} title={t(whyNesbah.title)} />
                    <Link href="/onboarding" className="hidden items-center gap-2 font-semibold text-violet transition-all hover:gap-3 md:inline-flex">
                        {t(whyNesbah.cta)} <Arrow />
                    </Link>
                </div>
                <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">
                    {whyNesbah.items.map((item) => {
                        const Icon = item.icon
                        return (
                            <div key={t(item.title)} className="bg-card p-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/10 text-violet">
                                    <Icon size={18} aria-hidden="true" />
                                </div>
                                <h3 className="mt-5 font-display text-base font-bold text-ink">{t(item.title)}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink/60">{t(item.desc)}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ─── Financing types ─────────────────────────────────────────────────────────

export function FinancingTypes() {
    const { t } = useLang()
    return (
        <section id="financing" className="bg-white py-20 md:py-24">
            <div className="container">
                <SectionHeading
                    eyebrow={t(financingTypesSection.eyebrow)}
                    title={t(financingTypesSection.title)}
                    sub={t(financingTypesSection.sub)}
                />
                <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
                    {financingTypesSection.types.map((type) => {
                        const Icon = type.icon
                        return (
                            <Link
                                key={t(type.title)}
                                href={type.slug}
                                className="group bg-card p-6 transition-colors hover:bg-cream focus-visible:bg-cream"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white transition-colors group-hover:bg-violet">
                                    <Icon size={20} aria-hidden="true" />
                                </div>
                                <h3 className="mt-6 font-display text-base font-bold text-ink">{t(type.title)}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{t(type.desc)}</p>
                                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet">
                                    {type.code ? t(financingTypesSection.learnMore) : t(financingTypesSection.contactUs)}
                                    <Arrow size={14} className="transition-transform group-hover:-translate-x-1" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ─── Audience ────────────────────────────────────────────────────────────────

export function Audience() {
    const { t } = useLang()
    return (
        <section className="py-20 md:py-24">
            <div className="container">
                <SectionHeading eyebrow={t(audienceSection.eyebrow)} title={t(audienceSection.title)} />
                <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-4">
                    {audienceSection.items.map((a) => {
                        const Icon = a.icon
                        return (
                            <div key={t(a.title)} className="bg-card p-6">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-hairline bg-cream text-violet">
                                    <Icon size={20} aria-hidden="true" />
                                </div>
                                <h3 className="mt-5 font-display text-base font-bold text-ink">{t(a.title)}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink/60">{t(a.desc)}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
// Native <details>/<summary>, as in the reference — no JS, works without hydration.

export function FAQ() {
    const { t } = useLang()
    return (
        <section id="faq" className="bg-white py-20 md:py-24">
            <div className="container">
                <SectionHeading eyebrow={t(faqSection.eyebrow)} title={t(faqSection.title)} />
                <div className="mt-12 max-w-3xl divide-y divide-hairline border-y border-hairline">
                    {faqSection.items.map((f, i) => (
                        <details key={i} className="group py-1">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-base font-bold text-ink md:text-lg">
                                <span>{t(f.q)}</span>
                                <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-violet transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="pb-5 leading-relaxed text-ink/65">{t(f.a)}</div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

export function FinalCTA() {
    const { t } = useLang()
    return (
        <section id="apply" className="pct-motif pct-motif-light bg-hero-gradient py-20 text-white md:py-24">
            <div className="container relative z-10">
                <div className="max-w-2xl">
                    <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">
                        {t(finalCta.titlePrefix)}
                        <span className="text-gradient-violet">{t(finalCta.titleAccent)}</span>
                    </h2>
                    <p className="mt-4 max-w-xl text-base text-white/75 md:text-lg">{t(finalCta.sub)}</p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-full bg-violet px-7 py-3.5 font-bold text-white transition-colors hover:bg-violet-soft">
                            {t(finalCta.ctaPrimary)} <Arrow />
                        </Link>
                        <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/5">
                            {t(finalCta.ctaSecondary)}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export { WHATSAPP }
