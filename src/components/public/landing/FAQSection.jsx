'use client'

import { useLang, translations } from '@/contexts/PublicLanguageContext'
import ScrollReveal from './ScrollReveal'
import FAQItem from './_FAQItem'

export default function FAQSection() {
  const { t } = useLang()
  const f = translations.faq

  return (
    <section className="bg-[hsl(var(--card))] py-20 md:py-28" id="faq">
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

        <ScrollReveal delay={0.1}>
          <div className="mx-auto max-w-2xl space-y-3">
            {f.items.map((faq, index) => (
              <FAQItem key={index} q={t(faq.q)} a={t(faq.a)} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
