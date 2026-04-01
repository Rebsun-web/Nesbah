'use client'

import { Check } from 'lucide-react'
import { useLang, translations } from '@/contexts/PublicLanguageContext'
import ScrollReveal from './ScrollReveal'

export default function WhyNesbahSection() {
  const { t } = useLang()
  const w = translations.whyNesbah

  return (
    <section className="bg-[hsl(var(--card))] py-20 md:py-28" id="why-nesbah">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <h2
              className="mx-auto max-w-3xl text-2xl font-bold text-[hsl(var(--foreground))] md:text-3xl lg:text-4xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              {t(w.title)}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
              {t(w.subtitle)}
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {w.items.map((item, index) => (
            <ScrollReveal key={index} delay={index * 0.06}>
              <div className="group flex gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 transition-all duration-300 hover:border-[hsl(var(--primary)/0.2)] hover:shadow-card-hover hover:-translate-y-0.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent))] transition-colors duration-300 group-hover:bg-[hsl(var(--primary))]">
                  <Check className="h-5 w-5 text-[hsl(var(--accent-foreground))] transition-colors duration-300 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-[hsl(var(--foreground))]">{t(item.title)}</h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{t(item.desc)}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
