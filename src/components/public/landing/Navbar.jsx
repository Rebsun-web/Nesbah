'use client'

// Site header, ported from the nesbah.net reference implementation's Header()
// (src/routes/index.tsx). Same labels and layout; the links point at OUR routes —
// see `headerLinks` in src/content/home.js for the mapping (Customer Sign in →
// /login rather than their /customer/login, Apply Now → /onboarding rather than
// /apply). Financing Guide and Deposits are the reverse-proxied surface.
//
// Their two per-language route files collapse into one component via useLang(), so
// the language switch toggles in place instead of navigating to an /en/* twin.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Globe, Menu, X } from 'lucide-react'
import { useLang } from '@/contexts/PublicLanguageContext'
import { nav, headerLinks as h } from '@/content/home'

export default function Navbar() {
  const { t, isRTL, toggleLang } = useLang()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const Arrow = isRTL ? ArrowLeft : ArrowRight

  // Escape closes the panel and returns focus to the trigger; focus moves into the
  // panel on open. Both behaviours come from the reference.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector('a, button, [tabindex]:not([tabindex="-1"])')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const closeAndReturn = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-hairline/60 bg-cream/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={30} width={100} className="h-8 w-auto object-contain md:h-9" priority />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label={t(h.primaryNav)}>
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-ink/70 transition-colors hover:text-violet">
              {t(n)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href={h.guide.href} className="text-sm font-semibold text-ink/80 transition-colors hover:text-violet">
            {t(h.guide)}
          </Link>
          <Link href={h.deposits.href} className="text-sm font-semibold text-ink/80 transition-colors hover:text-violet">
            {t(h.deposits)}
          </Link>
          <Link href={h.signIn.href} className="text-sm font-semibold text-ink/80 transition-colors hover:text-violet">
            {t(h.signIn)}
          </Link>
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-violet"
            aria-label={isRTL ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe size={14} aria-hidden="true" /> {t(h.switchTo)}
          </button>
          <Link href={h.apply.href} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet">
            {t(h.apply)}
            <Arrow size={16} aria-hidden="true" />
          </Link>
        </div>

        <button
          ref={triggerRef}
          className="rounded-md p-2 text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t(h.closeMenu) : t(h.openMenu)}
          aria-expanded={open}
          aria-controls="site-nav-mobile"
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="site-nav-mobile" ref={panelRef} className="border-t border-hairline bg-card lg:hidden">
          <div className="container flex flex-col gap-3 py-4">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={closeAndReturn} className="py-2 font-medium text-ink/80">
                {t(n)}
              </a>
            ))}
            <Link href={h.guide.href} onClick={closeAndReturn} className="py-2 font-medium text-ink/80">{t(h.guide)}</Link>
            <Link href={h.deposits.href} onClick={closeAndReturn} className="py-2 font-medium text-ink/80">{t(h.deposits)}</Link>
            <Link href={h.signIn.href} onClick={closeAndReturn} className="py-2 font-medium text-ink/80">{t(h.signIn)}</Link>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { toggleLang(); closeAndReturn() }}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-4 py-3 text-sm font-semibold text-ink"
                aria-label={isRTL ? 'Switch to English' : 'التحويل إلى العربية'}
              >
                <Globe size={14} aria-hidden="true" /> {t(h.switchTo)}
              </button>
              <Link href={h.apply.href} onClick={closeAndReturn} className="inline-flex flex-1 justify-center rounded-full bg-ink px-5 py-3 font-semibold text-white">
                {t(h.apply)}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
