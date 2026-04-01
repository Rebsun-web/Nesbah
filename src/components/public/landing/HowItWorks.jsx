'use client'

import Link from 'next/link'
import { FileText, Send, Inbox, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { useLang, translations } from '@/contexts/PublicLanguageContext'
import ScrollReveal from './ScrollReveal'

export default function HowItWorks() {
  const { t, isRTL } = useLang()
  const h = translations.how
  const Arrow = isRTL ? ArrowLeft : ArrowRight

  const steps = [
    { num: '١', numEn: '1', icon: FileText, title: t(h.step1Title), desc: t(h.step1Desc) },
    { num: '٢', numEn: '2', icon: Send, title: t(h.step2Title), desc: t(h.step2Desc) },
    { num: '٣', numEn: '3', icon: Inbox, title: t(h.step3Title), desc: t(h.step3Desc) },
    { num: '٤', numEn: '4', icon: CheckCircle, title: t(h.step4Title), desc: t(h.step4Desc) },
  ]

  return (
    <section className="bg-[hsl(var(--card))] py-20 md:py-28" id="how">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2
              className="text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl lg:text-[2.75rem]"
              style={{ letterSpacing: '-0.03em' }}
            >
              {t(h.title)}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-[hsl(var(--muted-foreground))]">
              {t(h.subtitle)}
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <div className="group relative rounded-2xl bg-[hsl(var(--background))] p-7 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 text-center">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-lg font-bold text-white transition-all group-hover:scale-110">
                  {isRTL ? step.num : step.numEn}
                </div>
                <h3 className="mb-2 text-base font-bold text-[hsl(var(--foreground))]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="mt-14 text-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t(h.cta)}
              <Arrow className="h-5 w-5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
