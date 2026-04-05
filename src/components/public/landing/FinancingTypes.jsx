'use client'

import Link from 'next/link'
import { Briefcase, Banknote, TrendingUp, Truck, Building2, Building, CreditCard } from 'lucide-react'
import { useLang, translations } from '@/contexts/PublicLanguageContext'
import ScrollReveal from './ScrollReveal'

const icons = [Briefcase, Banknote, TrendingUp, Truck, Building2, Building, CreditCard]

export default function FinancingTypes() {
  const { t } = useLang()
  const f = translations.financing

  return (
    <section className="bg-gray-50 py-20 md:py-28" id="financing">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2
              className="text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              {t(f.title)}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-[hsl(var(--muted-foreground))]">
              {t(f.subtitle)}
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {f.types.map((type, index) => {
            const Icon = icons[index]
            return (
              <ScrollReveal key={index} delay={index * 0.06}>
                <Link
                  href={`/${type.slug}`}
                  className="group block rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 transition-all duration-300 hover:border-[hsl(var(--primary)/0.2)] hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--accent))] transition-colors duration-300 group-hover:bg-[hsl(var(--primary))]">
                    <Icon className="h-6 w-6 text-[hsl(var(--accent-foreground))] transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[hsl(var(--foreground))]">{t(type.title)}</h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{t(type.desc)}</p>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
