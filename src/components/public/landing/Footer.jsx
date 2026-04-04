'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang, translations } from '@/contexts/PublicLanguageContext'

const financingLinks = [
  { href: '/business-financing', label: { ar: 'تمويل الشركات', en: 'Business Financing' } },
  { href: '/working-capital-financing', label: { ar: 'تمويل رأس المال العامل', en: 'Working Capital' } },
  { href: '/expansion-financing', label: { ar: 'تمويل التوسع', en: 'Expansion Financing' } },
  { href: '/equipment-financing', label: { ar: 'تمويل المعدات', en: 'Equipment Financing' } },
  { href: '/project-financing', label: { ar: 'تمويل المشاريع', en: 'Project Financing' } },
  { href: '/real-estate-project-financing', label: { ar: 'التمويل العقاري', en: 'Real Estate' } },
  { href: '/pos-financing', label: { ar: 'تمويل نقاط البيع', en: 'POS Financing' } },
]

function NewsletterForm() {
  const { lang } = useLang()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setStatus(data.success ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-[hsl(var(--primary))] font-medium">
        {lang === 'ar' ? 'تم الاشتراك! تحقق من بريدك الإلكتروني.' : 'Subscribed! Check your inbox.'}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={lang === 'ar' ? 'بريدك الإلكتروني' : 'Your email'}
        dir="ltr"
        required
        className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'loading'
          ? (lang === 'ar' ? '...' : '...')
          : (lang === 'ar' ? 'اشتراك' : 'Subscribe')}
      </button>
      {status === 'error' && (
        <p className="absolute mt-10 text-xs text-red-500">
          {lang === 'ar' ? 'حدث خطأ، حاول مجدداً.' : 'Something went wrong. Try again.'}
        </p>
      )}
    </form>
  )
}

export default function Footer() {
  const { t, lang } = useLang()
  const f = translations.footer
  const n = translations.nav

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] py-14">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block text-xl font-bold text-[hsl(var(--foreground))]">
              {t(n.brand)}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
              {t(f.desc)}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">{t(f.platform)}</h4>
            <ul className="space-y-2.5 text-sm text-[hsl(var(--muted-foreground))]">
              <li><a href="/#how" className="transition-lift hover:text-[hsl(var(--foreground))]">{t(n.howItWorks)}</a></li>
              <li><a href="/#why-nesbah" className="transition-lift hover:text-[hsl(var(--foreground))]">{t(n.whyNesbah)}</a></li>
              <li><a href="/#faq" className="transition-lift hover:text-[hsl(var(--foreground))]">{t(n.faq)}</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">{t(n.solutions)}</h4>
            <ul className="space-y-2.5 text-sm text-[hsl(var(--muted-foreground))]">
              {financingLinks.map((fl) => (
                <li key={fl.href}>
                  <Link href={fl.href} className="transition-lift hover:text-[hsl(var(--foreground))]">
                    {t(fl.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">{t(f.company)}</h4>
            <ul className="space-y-2.5 text-sm text-[hsl(var(--muted-foreground))]">
              <li><Link href="/about" className="transition-lift hover:text-[hsl(var(--foreground))]">{t(f.aboutLink)}</Link></li>
              <li><Link href="/contact" className="transition-lift hover:text-[hsl(var(--foreground))]">{t(f.contactLink)}</Link></li>
              <li>
                <Link href="/knowledge" className="transition-lift hover:text-[hsl(var(--foreground))]">
                  {lang === 'ar' ? 'مركز المعرفة' : 'Knowledge Center'}
                </Link>
              </li>
              <li><Link href="/terms" className="transition-lift hover:text-[hsl(var(--foreground))]">{t(f.termsLink)}</Link></li>
              <li><Link href="/privacy" className="transition-lift hover:text-[hsl(var(--foreground))]">{t(f.privacyLink)}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">{t(f.contact)}</h4>
            <ul className="space-y-2.5 text-sm text-[hsl(var(--muted-foreground))]">
              <li>{t(f.location)}</li>
              <li dir="ltr">info@nesbah.com.sa</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[hsl(var(--border))] pt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
              {lang === 'ar' ? 'اشترك في النشرة الإخبارية' : 'Subscribe to our newsletter'}
            </p>
            <div className="w-full md:max-w-xs">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-[hsl(var(--border))] pt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          <p>© {new Date().getFullYear()} {t(f.copyright)}</p>
        </div>
      </div>
    </footer>
  )
}
