'use client'

// Shared wrapper for the standalone content pages (about, contact, terms, privacy),
// ported from the nesbah.net reference implementation (src/components/legal-shell.tsx).
//
// It deliberately carries its own minimal header/footer rather than the marketing
// Navbar/Footer — same as the reference. `useLang()` replaces the reference's `lang`
// prop, since this codebase renders one component per page for both languages.

import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/contexts/PublicLanguageContext'

const copy = {
    home: { ar: 'الرئيسية', en: 'Home' },
    apply: { ar: 'قدّم طلبك', en: 'Apply' },
    brand: { ar: 'نسبة', en: 'Nesbah' },
    workingVersion: {
        ar: 'هذه الوثيقة نسخة عملية بانتظار المراجعة القانونية النهائية. للاستفسارات القانونية راسلنا على info@nesbah.com.sa.',
        en: 'This document is a working version pending final legal review. For legal inquiries, contact info@nesbah.com.sa.',
    },
    notALender: {
        ar: 'نسبة ليست جهة تمويل ولا تتخذ قرارات ائتمانية.',
        en: 'Nesbah is not a financing provider and does not make credit decisions.',
    },
}

export default function LegalShell({ title, updated = '', children }) {
    const { t } = useLang()

    return (
        <div className="min-h-screen bg-cream">
            <header className="sticky top-0 z-30 border-b border-hairline bg-white/85 backdrop-blur">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="inline-flex">
                        <Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={26} width={86} className="h-8 w-auto object-contain md:h-9" />
                    </Link>
                    <nav className="flex items-center gap-4 text-sm">
                        <Link href="/" className="text-ink-soft hover:text-ink">{t(copy.home)}</Link>
                        <Link href="/onboarding" className="rounded-xl bg-ink px-4 py-2 font-semibold text-white hover:bg-ink/90">
                            {t(copy.apply)}
                        </Link>
                    </nav>
                </div>
            </header>

            <section className="pct-motif border-b border-hairline bg-white">
                <div className="container relative max-w-3xl py-12 md:py-16">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet">{t(copy.brand)}</p>
                    <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink md:text-4xl">{title}</h1>
                    {updated && <p className="mt-2 text-sm text-ink/55">{updated}</p>}
                    <div className="mt-6 h-px w-16 bg-violet" aria-hidden="true" />
                </div>
            </section>

            <main id="main-content" tabIndex={-1} className="container max-w-3xl py-10 md:py-14">
                <article className="prose prose-slate max-w-none text-ink [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_li]:my-1 [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:pr-6">
                    {children}
                </article>

                <div className="mt-12 rounded-2xl border border-hairline bg-white p-5 text-xs leading-relaxed text-ink-soft">
                    {t(copy.workingVersion)}
                </div>
            </main>

            <footer className="mt-8 border-t border-hairline py-8">
                <div className="container flex flex-col items-center justify-between gap-3 text-xs text-ink-soft md:flex-row">
                    <p>© {new Date().getFullYear()} Nesbah</p>
                    <p>{t(copy.notALender)}</p>
                </div>
            </footer>
        </div>
    )
}
