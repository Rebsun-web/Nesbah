'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '@/contexts/PublicLanguageContext'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import ScrollReveal from './ScrollReveal'
import FAQItem from './_FAQItem'

// Page title map for related links
const pageTitles = {
  'business-financing': { ar: 'تمويل الشركات', en: 'Business Financing' },
  'working-capital-financing': { ar: 'تمويل رأس المال العامل', en: 'Working Capital' },
  'expansion-financing': { ar: 'تمويل التوسع', en: 'Expansion Financing' },
  'equipment-financing': { ar: 'تمويل المعدات', en: 'Equipment Financing' },
  'project-financing': { ar: 'تمويل المشاريع', en: 'Project Financing' },
  'real-estate-project-financing': { ar: 'التمويل العقاري', en: 'Real Estate' },
  'pos-financing': { ar: 'تمويل نقاط البيع', en: 'POS Financing' },
}

export default function FinancingPageTemplate({ data }) {
  const { t, isRTL, lang } = useLang()
  const Arrow = isRTL ? ArrowLeft : ArrowRight
  const Back = isRTL ? ChevronRight : ChevronLeft

  const whatsappMsg = lang === 'ar'
    ? 'مرحبا، أرغب في معرفة خيارات التمويل المتاحة لشركتي عبر منصة نسبة.'
    : 'Hello, I would like to learn about financing options for my business through Nesbah.'
  const whatsappUrl = `https://wa.me/966552799610?text=${encodeURIComponent(whatsappMsg)}`

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 start-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
            >
              <Back className="h-4 w-4" />
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.15 }}
            >
              {t(data.heroTitle)}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-5 max-w-xl text-base text-white/60 md:text-lg"
            >
              {t(data.heroSub)}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[hsl(var(--primary))] shadow-elevated transition-all hover:opacity-90"
              >
                {lang === 'ar' ? 'قدّم طلبك مجاناً' : 'Submit Your Request — Free'}
                <Arrow className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-2xl font-bold text-[hsl(var(--foreground))] md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
                {t(data.introTitle)}
              </h2>
              <p className="text-base leading-relaxed text-[hsl(var(--muted-foreground))] md:text-lg">
                {t(data.introText)}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Who + Use Cases */}
      <section className="bg-[hsl(var(--card))] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <ScrollReveal>
              <h3 className="mb-6 text-xl font-bold text-[hsl(var(--foreground))] md:text-2xl">{t(data.whoTitle)}</h3>
              <ul className="space-y-3">
                {data.whoItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[hsl(var(--muted-foreground))]">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    {t(item)}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h3 className="mb-6 text-xl font-bold text-[hsl(var(--foreground))] md:text-2xl">{t(data.useCasesTitle)}</h3>
              <ul className="space-y-3">
                {data.useCases.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[hsl(var(--muted-foreground))]">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                    {t(item)}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Why Nesbah */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h2 className="mb-12 text-center text-2xl font-bold text-[hsl(var(--foreground))] md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              {t(data.whyNesbahTitle)}
            </h2>
          </ScrollReveal>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {data.whyNesbahItems.map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.06}>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition-all duration-300 hover:border-[hsl(var(--primary)/0.2)] hover:shadow-card-hover">
                  <h4 className="mb-2 text-lg font-bold text-[hsl(var(--foreground))]">{t(item.title)}</h4>
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{t(item.desc)}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[hsl(var(--card))] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold text-[hsl(var(--foreground))] md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              {t(data.faqTitle)}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mx-auto max-w-2xl space-y-3">
              {data.faqs.map((faq, i) => (
                <FAQItem key={i} q={t(faq.q)} a={t(faq.a)} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h3 className="mb-8 text-center text-xl font-bold text-[hsl(var(--foreground))] md:text-2xl">{t(data.relatedTitle)}</h3>
            <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
              {data.relatedSlugs.map((slug) => {
                const label = pageTitles[slug]
                return (
                  <Link
                    key={slug}
                    href={`/${slug}`}
                    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-3 text-sm font-medium text-[hsl(var(--foreground))] transition-all hover:border-[hsl(var(--primary)/0.2)] hover:shadow-card-hover"
                  >
                    {label ? t(label) : slug}
                  </Link>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 start-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="text-balance text-2xl font-bold text-white md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
              {lang === 'ar' ? 'احصل على عروض تمويل لشركتك' : 'Get financing offers for your business'}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/60">
              {lang === 'ar' ? 'طلبك يستغرق أقل من دقيقتين، والخدمة مجانية بالكامل للشركات.' : 'Your request takes less than 2 minutes, and the service is completely free for businesses.'}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[hsl(var(--primary))] shadow-elevated transition-all hover:opacity-90"
              >
                {lang === 'ar' ? 'قدّم طلب تمويل لشركتك الآن' : 'Submit a financing request now'}
                <Arrow className="h-5 w-5" />
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                {lang === 'ar' ? 'استفسر عبر واتساب' : 'Ask via WhatsApp'}
              </a>
            </div>
            <p className="mt-4 text-sm text-white/40">
              {lang === 'ar' ? 'مجاني للشركات • بدون التزام' : 'Free for businesses • No obligation'}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}
