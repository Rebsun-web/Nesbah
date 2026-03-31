'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang, translations } from '@/contexts/PublicLanguageContext'
import {
  GlobeAltIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

const WHATSAPP_NUMBER = '966552799610'

const financingLinks = [
  { href: '/business-financing', label: { ar: 'تمويل الشركات', en: 'Business Financing' } },
  { href: '/working-capital-financing', label: { ar: 'تمويل رأس المال العامل', en: 'Working Capital' } },
  { href: '/expansion-financing', label: { ar: 'تمويل التوسع', en: 'Expansion Financing' } },
  { href: '/equipment-financing', label: { ar: 'تمويل المعدات', en: 'Equipment Financing' } },
  { href: '/project-financing', label: { ar: 'تمويل المشاريع', en: 'Project Financing' } },
  { href: '/real-estate-project-financing', label: { ar: 'التمويل العقاري', en: 'Real Estate' } },
  { href: '/pos-financing', label: { ar: 'تمويل نقاط البيع', en: 'POS Financing' } },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const { t, toggleLang, lang } = useLang()
  const n = translations.nav

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-foreground">{t(n.brand)}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="/#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t(n.howItWorks)}
          </a>

          <div className="relative">
            <button
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              onBlur={() => setTimeout(() => setSolutionsOpen(false), 200)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(n.solutions)}
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {solutionsOpen && (
              <div className="absolute top-full start-0 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-lg">
                {financingLinks.map((fl) => (
                  <Link
                    key={fl.href}
                    href={fl.href}
                    onClick={() => setSolutionsOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {t(fl.label)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a href="/#why-nesbah" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t(n.whyNesbah)}
          </a>
          <Link href="/knowledge" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {lang === 'ar' ? 'مركز المعرفة' : 'Knowledge Center'}
          </Link>
          <a href="/#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t(n.faq)}
          </a>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <GlobeAltIcon className="h-4 w-4" />
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          {/* Login link for bank/registered business users */}
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            {t(n.login)}
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t(n.cta)}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground"
          >
            <GlobeAltIcon className="h-4 w-4" />
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen
              ? <XMarkIcon className="h-6 w-6 text-foreground" />
              : <Bars3Icon className="h-6 w-6 text-foreground" />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            <a href="/#how" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              {t(n.howItWorks)}
            </a>
            <button
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t(n.solutions)}
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {solutionsOpen && (
              <div className="ms-3 flex flex-col gap-1 border-s-2 border-border ps-3">
                {financingLinks.map((fl) => (
                  <Link
                    key={fl.href}
                    href={fl.href}
                    onClick={() => { setMobileOpen(false); setSolutionsOpen(false) }}
                    className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {t(fl.label)}
                  </Link>
                ))}
              </div>
            )}
            <a href="/#why-nesbah" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              {t(n.whyNesbah)}
            </a>
            <Link href="/knowledge" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              {lang === 'ar' ? 'مركز المعرفة' : 'Knowledge Center'}
            </Link>
            <a href="/#faq" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              {t(n.faq)}
            </a>
            <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              {t(n.login)}
            </Link>
            <Link
              href="/onboarding"
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {t(n.cta)}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
