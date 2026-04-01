'use client'

import { Building2, Banknote, HardHat, ShoppingBag } from 'lucide-react'
import { useLang, translations } from '@/contexts/PublicLanguageContext'
import ScrollReveal from './ScrollReveal'

const icons = [Building2, Banknote, HardHat, ShoppingBag]

export default function AudienceSection() {
  const { t } = useLang()
  const a = translations.audience

  return (
    <section className="py-20 md:py-28" id="audience">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2
              className="text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              {t(a.title)}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-[hsl(var(--muted-foreground))]">
              {t(a.subtitle)}
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {a.items.map((item, index) => {
            const Icon = icons[index]
            return (
              <ScrollReveal key={index} delay={index * 0.08}>
                <div className="group flex gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition-all duration-300 hover:border-[hsl(var(--primary)/0.2)] hover:shadow-card-hover hover:-translate-y-0.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent))] transition-colors duration-300 group-hover:bg-[hsl(var(--primary))]">
                    <Icon className="h-6 w-6 text-[hsl(var(--accent-foreground))] transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-base font-bold text-[hsl(var(--foreground))]">{t(item.title)}</h3>
                    <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{t(item.desc)}</p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
