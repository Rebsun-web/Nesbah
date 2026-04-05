'use client'

import Link from 'next/link'
import Image from 'next/image'
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

export default function Footer() {
  const { t, lang } = useLang()
  const f = translations.footer
  const n = translations.nav

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] py-14">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block">
              <Image src="/logo/NewNesbahLogo.png" alt="Nesbah" height={36} width={120} className="object-contain" />
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

        <div className="mt-12 border-t border-[hsl(var(--border))] pt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          <p>© {new Date().getFullYear()} {t(f.copyright)}</p>
        </div>
      </div>
    </footer>
  )
}
