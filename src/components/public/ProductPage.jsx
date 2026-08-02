'use client'

// Product page template, ported from the nesbah.net reference implementation
// (src/components/product-page.tsx). Editorial layout — numbered chapter sections,
// a navy "how it works" band, cream/white alternation, and native <details> FAQs.
//
// Differences from the reference, both deliberate:
//  • Our product URLs are the indexed ones (/pos-financing etc.), not /product/<code>.
//    The `slug` comes from src/content/home.js so both stay in one place.
//  • One component serves both languages via useLang(), instead of two route files.

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, FileText, HelpCircle, Info } from 'lucide-react'
import { PublicLanguageProvider, useLang } from '@/contexts/PublicLanguageContext'
import { PRODUCT_CODES, PRODUCT_DETAILS } from '@/content/product-details'
import { WHATSAPP, financingTypesSection } from '@/content/home'

const ui = {
    apply: { ar: 'قدّم طلبك', en: 'Apply' },
    products: { ar: 'أنواع التمويل', en: 'Financing products' },
    guide: { ar: 'دليل التمويل', en: 'Financing Guide' },
    home: { ar: 'الرئيسية', en: 'Home' },
    aboutProduct: { ar: 'لمحة عن هذا المنتج', en: 'About this product' },
    criteriaNote: {
        ar: 'المعايير العامة التي تراجعها الجهات — تختلف تفاصيلها من جهة لأخرى.',
        en: 'General criteria providers review — specifics differ by provider.',
    },
    docsNote: {
        ar: 'قائمة إرشادية — قد تطلب الجهات مستندات إضافية.',
        en: 'Indicative list — providers may request more.',
    },
    readyTitle: { ar: 'جاهز للتقديم؟', en: 'Ready to apply?' },
    readyBody: {
        ar: 'طلب واحد يُعرض على جهات تمويل مرخصة. قد تتلقى خيارات إذا قررت جهة المضي في الدراسة. مجاناً وبدون التزام.',
        en: 'One request shared with licensed providers. You may receive options if a provider chooses to proceed. Free, no obligation.',
    },
    whatsapp: { ar: 'تواصل واتساب', en: 'WhatsApp' },
    breadcrumb: { ar: 'المسار', en: 'Breadcrumb' },
    nav: { ar: 'التنقل الرئيسي', en: 'Primary navigation' },
}

// Chapter numbers are Arabic-Indic in AR, Latin in EN, as in the reference.
const chapter = (n, isRTL) => (isRTL ? ['٠١', '٠٢', '٠٣', '٠٤', '٠٥', '٠٦'][n - 1] : String(n).padStart(2, '0'))

function ProductBody({ code }) {
    const { t, lang, isRTL, toggleLang } = useLang()
    const reduce = useReducedMotion()
    const copy = PRODUCT_DETAILS[code][lang] || PRODUCT_DETAILS[code].ar

    const Arrow = isRTL ? ArrowLeft : ArrowRight
    const ArrowBack = isRTL ? ArrowRight : ArrowLeft
    const productIndex = Math.max(0, PRODUCT_CODES.indexOf(code)) + 1
    // Preselects the financing type on our onboarding form.
    const applyHref = `/onboarding?product=${code}`

    const anim = reduce
        ? { initial: false, animate: false }
        : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b border-hairline bg-white/85 backdrop-blur-xl">
                <div className="container flex items-center justify-between py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={26} width={86} className="h-8 w-auto object-contain" />
                    </Link>
                    <nav className="hidden items-center gap-6 md:flex" aria-label={t(ui.nav)}>
                        <Link href="/financing-guide" className="text-sm font-semibold text-ink/80 transition-colors hover:text-violet">
                            {t(ui.guide)}
                        </Link>
                        <a href="/#financing" className="text-sm font-semibold text-ink/80 transition-colors hover:text-violet">
                            {t(ui.products)}
                        </a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleLang}
                            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-violet"
                            aria-label={isRTL ? 'English' : 'العربية'}
                        >
                            {isRTL ? 'EN' : 'AR'}
                        </button>
                        <Link href={applyHref} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet">
                            {t(ui.apply)}
                        </Link>
                    </div>
                </div>
            </header>

            <main id="main-content" tabIndex={-1}>
                <nav aria-label={t(ui.breadcrumb)} className="container pt-8 text-xs text-ink/60">
                    <ol className="flex flex-wrap items-center gap-1.5">
                        <li><Link href="/" className="hover:text-violet">{copy.breadcrumbHome}</Link></li>
                        <li aria-hidden="true">/</li>
                        <li><a href="/#financing" className="hover:text-violet">{copy.breadcrumbProducts}</a></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page" className="font-semibold text-ink">{copy.title}</li>
                    </ol>
                </nav>

                {/* Chapter opener */}
                <section className="pct-motif border-b border-hairline bg-white">
                    <div className="container relative pb-14 pt-8 md:pb-20 md:pt-12">
                        <motion.div {...anim} transition={{ duration: 0.45 }}>
                            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">
                                <span className="font-mono text-ink/40">
                                    {String(productIndex).padStart(2, '0')} / {String(PRODUCT_CODES.length).padStart(2, '0')}
                                </span>
                                <span aria-hidden="true" className="h-px w-8 bg-violet/40" />
                                <span>{copy.breadcrumbProducts}</span>
                            </div>
                            <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink md:text-6xl">
                                {copy.title}
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">{copy.tag}</p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href={applyHref} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-violet">
                                    {copy.ctaApply} <Arrow size={16} aria-hidden="true" />
                                </Link>
                                <Link href="/financing-guide" className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-6 py-3 font-semibold text-ink transition-colors hover:border-violet">
                                    {copy.ctaGuide}
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Intro band */}
                <section className="border-b border-hairline bg-cream/60">
                    <div className="container grid gap-8 py-12 md:grid-cols-[1fr_2fr] md:gap-14 md:py-16">
                        <h2 className="font-display text-xl font-bold leading-snug text-ink md:text-2xl">{t(ui.aboutProduct)}</h2>
                        <div>
                            <p className="text-base leading-relaxed text-ink/75 md:text-lg">{copy.intro}</p>
                            <p className="mt-5 inline-flex items-start gap-2 rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink/70">
                                <Info size={16} className="mt-0.5 shrink-0 text-violet" aria-hidden="true" />
                                <span>{copy.notLenderNote}</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* 01 — Use cases */}
                <section id="use-cases" className="border-b border-hairline bg-white">
                    <div className="container grid gap-8 py-14 md:grid-cols-[1fr_2fr] md:gap-14 md:py-20">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">{chapter(1, isRTL)}</p>
                            <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{copy.sectionUseCases}</h2>
                        </div>
                        <ol className="divide-y divide-hairline">
                            {copy.useCases.map((u, i) => (
                                <li key={u.title} className="grid grid-cols-[auto_1fr] gap-5 py-5 first:pt-0 last:pb-0">
                                    <span className="pt-1 font-mono text-xs text-ink/35">{String(i + 1).padStart(2, '0')}</span>
                                    <div>
                                        <h3 className="font-display text-lg font-bold text-ink">{u.title}</h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{u.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* 02 — How it works (navy band) */}
                <section id="how-it-works" className="bg-ink text-white">
                    <div className="container py-14 md:py-20">
                        <div className="max-w-2xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-soft">{chapter(2, isRTL)}</p>
                            <h2 className="mt-3 font-display text-2xl font-bold leading-tight md:text-3xl">{copy.sectionHow}</h2>
                        </div>
                        <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
                            {copy.howItWorks.map((s, i) => (
                                <li key={s.title} className="bg-ink p-6 md:p-8">
                                    <span className="font-display text-4xl font-bold text-white/15">{String(i + 1).padStart(2, '0')}</span>
                                    <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-white/65">{s.desc}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* 03 — What providers review */}
                <section id="review" className="border-b border-hairline bg-white">
                    <div className="container grid gap-8 py-14 md:grid-cols-[1fr_2fr] md:gap-14 md:py-20">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">{chapter(3, isRTL)}</p>
                            <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{copy.sectionLenders}</h2>
                            <p className="mt-3 text-sm leading-relaxed text-ink/60">{t(ui.criteriaNote)}</p>
                        </div>
                        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                            {copy.whatLendersLookAt.map((it) => (
                                <li key={it} className="flex items-start gap-3 border-b border-hairline pb-3 text-sm leading-relaxed text-ink/80">
                                    <span aria-hidden="true" className="mt-1.5 h-1 w-4 shrink-0 bg-violet" />
                                    <span>{it}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* 04 — Documents */}
                <section id="documents" className="border-b border-hairline bg-cream/60">
                    <div className="container grid gap-8 py-14 md:grid-cols-[1fr_2fr] md:gap-14 md:py-20">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">{chapter(4, isRTL)}</p>
                            <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{copy.sectionDocs}</h2>
                            <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink/60">
                                <FileText size={14} className="text-violet" aria-hidden="true" />
                                {t(ui.docsNote)}
                            </p>
                        </div>
                        <ol className="space-y-3">
                            {copy.documents.map((d, i) => (
                                <li key={d} className="grid grid-cols-[auto_1fr] items-baseline gap-4 border-b border-hairline pb-3">
                                    <span className="font-mono text-xs font-semibold text-violet">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="text-sm leading-relaxed text-ink/80">{d}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* 05 — Tips */}
                {copy.tips.length > 0 && (
                    <section id="tips" className="border-b border-hairline bg-white">
                        <div className="container py-14 md:py-20">
                            <div className="max-w-2xl">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">{chapter(5, isRTL)}</p>
                                <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{copy.sectionTips}</h2>
                            </div>
                            <div className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
                                {copy.tips.map((tip, i) => (
                                    <blockquote key={tip} className="border-s-2 border-violet ps-5">
                                        <span className="font-mono text-xs text-ink/40">{String(i + 1).padStart(2, '0')}</span>
                                        <p className="mt-2 font-display text-lg leading-snug text-ink">{tip}</p>
                                    </blockquote>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 06 — FAQ */}
                <section id="faq" className="border-b border-hairline bg-cream/60">
                    <div className="container max-w-3xl py-14 md:py-20">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">{chapter(6, isRTL)}</p>
                        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{copy.sectionFaq}</h2>
                        <div className="mt-8 divide-y divide-hairline border-y border-hairline">
                            {copy.faqs.map((f, i) => (
                                <details key={f.q} className="group py-5" open={i === 0}>
                                    <summary className="flex cursor-pointer list-none items-start gap-3">
                                        <HelpCircle size={18} className="mt-0.5 shrink-0 text-violet" aria-hidden="true" />
                                        <span className="flex-1 font-display font-bold text-ink">{f.q}</span>
                                        <span aria-hidden="true" className="text-ink/40 transition-transform group-open:rotate-45">+</span>
                                    </summary>
                                    <p className="mt-3 ps-7 text-sm leading-relaxed text-ink/70">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 md:py-20">
                    <div className="container">
                        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-white md:flex-row md:items-center md:p-12">
                            <div>
                                <h2 className="font-display text-2xl font-bold md:text-3xl">{t(ui.readyTitle)}</h2>
                                <p className="mt-2 max-w-xl text-white/70">{t(ui.readyBody)}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href={applyHref} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-ink transition-colors hover:bg-mint">
                                    {copy.ctaApply}
                                </Link>
                                <a href={WHATSAPP[lang] || WHATSAPP.ar} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition-colors hover:border-white">
                                    {t(ui.whatsapp)}
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-hairline bg-white">
                <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-ink/60 md:flex-row">
                    <Link href="/" className="inline-flex items-center gap-2 hover:text-violet">
                        <ArrowBack size={14} aria-hidden="true" /> {t(ui.home)}
                    </Link>
                    <p className="text-xs">© {new Date().getFullYear()} {isRTL ? 'نسبة' : 'Nesbah'}</p>
                </div>
            </footer>
        </div>
    )
}

export default function ProductPage({ code }) {
    return (
        <PublicLanguageProvider>
            <ProductBody code={code} />
        </PublicLanguageProvider>
    )
}

// Convenience for the page files: our indexed slug → financing code.
export const SLUG_TO_CODE = Object.fromEntries(
    financingTypesSection.types.filter((t) => t.code).map((t) => [t.slug, t.code])
)
