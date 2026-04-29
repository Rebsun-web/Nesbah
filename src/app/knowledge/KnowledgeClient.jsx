'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Search } from 'lucide-react'
import { PublicLanguageProvider, useLang } from '@/contexts/PublicLanguageContext'
import Navbar from '@/components/public/landing/Navbar'
import Footer from '@/components/public/landing/Footer'
import WhatsAppButton from '@/components/public/landing/WhatsAppButton'
import ScrollReveal from '@/components/public/landing/ScrollReveal'

const categories = [
  { slug: 'business-financing', title: { ar: 'تمويل الشركات', en: 'Business Financing' }, desc: { ar: 'كل ما تحتاج معرفته عن تمويل الشركات في السعودية', en: 'Everything you need to know about business financing in Saudi Arabia' } },
  { slug: 'working-capital-financing', title: { ar: 'تمويل رأس المال العامل', en: 'Working Capital' }, desc: { ar: 'أفضل الطرق لتمويل عمليات شركتك اليومية', en: 'Best ways to finance your daily business operations' } },
  { slug: 'project-financing', title: { ar: 'تمويل المشاريع', en: 'Project Financing' }, desc: { ar: 'دليل تمويل المشاريع الكبيرة والعقود', en: 'Guide to financing large projects and contracts' } },
  { slug: 'real-estate-project-financing', title: { ar: 'تمويل المشاريع العقارية', en: 'Real Estate Financing' }, desc: { ar: 'خيارات التمويل العقاري التجاري للشركات', en: 'Commercial real estate financing options for businesses' } },
  { slug: 'pos-financing', title: { ar: 'تمويل نقاط البيع', en: 'POS Financing' }, desc: { ar: 'كيف تحصل على سيولة سريعة من مبيعاتك', en: 'How to get quick liquidity from your sales' } },
  { slug: 'expansion-financing', title: { ar: 'تمويل التوسع', en: 'Expansion Financing' }, desc: { ar: 'تمويل خطط النمو والتوسع لشركتك', en: 'Financing your business growth and expansion plans' } },
]

const sampleArticles = [
  { title: { ar: 'دليل تمويل الشركات الصغيرة والمتوسطة في السعودية', en: 'SME Financing Guide in Saudi Arabia' }, category: { ar: 'تمويل الشركات', en: 'Business Financing' } },
  { title: { ar: 'كيف تختار نوع التمويل المناسب لشركتك؟', en: 'How to Choose the Right Financing for Your Business' }, category: { ar: 'تمويل الشركات', en: 'Business Financing' } },
  { title: { ar: '5 نصائح لتحسين فرصك في الحصول على تمويل', en: '5 Tips to Improve Your Financing Approval Chances' }, category: { ar: 'تمويل رأس المال العامل', en: 'Working Capital' } },
  { title: { ar: 'مقارنة بين أنواع التمويل العقاري التجاري', en: 'Comparing Commercial Real Estate Financing Types' }, category: { ar: 'تمويل المشاريع العقارية', en: 'Real Estate Financing' } },
  { title: { ar: 'تمويل نقاط البيع: كيف يعمل ومن يستفيد منه؟', en: 'POS Financing: How It Works and Who Benefits' }, category: { ar: 'تمويل نقاط البيع', en: 'POS Financing' } },
  { title: { ar: 'خطوات تقديم طلب تمويل ناجح', en: 'Steps to Submit a Successful Financing Request' }, category: { ar: 'تمويل الشركات', en: 'Business Financing' } },
]

function KnowledgeContent() {
  const { t, isRTL, lang } = useLang()
  const Arrow = isRTL ? ArrowLeft : ArrowRight

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
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.15 }}
            >
              {lang === 'ar' ? 'مركز المعرفة' : 'Knowledge Center'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-5 max-w-xl text-base text-white/60 md:text-lg"
            >
              {lang === 'ar'
                ? 'دليل شامل لتمويل الشركات في السعودية — مقالات ونصائح تساعدك في اتخاذ قرارات التمويل الصحيحة.'
                : 'A comprehensive guide to business financing in Saudi Arabia — articles and tips to help you make the right financing decisions.'}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Search placeholder */}
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] py-6">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
            <Search className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {lang === 'ar' ? 'ابحث في المقالات...' : 'Search articles...'}
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold text-[hsl(var(--foreground))] md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              {lang === 'ar' ? 'تصفح حسب الموضوع' : 'Browse by Topic'}
            </h2>
          </ScrollReveal>
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <ScrollReveal key={cat.slug} delay={i * 0.05}>
                <Link
                  href={`/${cat.slug}`}
                  className="group block rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition-all duration-300 hover:border-[hsl(var(--primary)/0.2)] hover:shadow-card-hover hover:-translate-y-0.5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))] transition-colors group-hover:bg-[hsl(var(--primary))]">
                    <BookOpen className="h-5 w-5 text-[hsl(var(--accent-foreground))] transition-colors group-hover:text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[hsl(var(--foreground))]">{t(cat.title)}</h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{t(cat.desc)}</p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="bg-[hsl(var(--card))] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold text-[hsl(var(--foreground))] md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              {lang === 'ar' ? 'أحدث المقالات' : 'Latest Articles'}
            </h2>
          </ScrollReveal>
          <div className="mx-auto max-w-3xl space-y-4">
            {sampleArticles.map((article, i) => (
              <ScrollReveal key={i} delay={i * 0.04}>
                <div className="group flex items-start justify-between gap-4 rounded-xl bg-[hsl(var(--background))] p-5 shadow-card transition-all hover:shadow-card-hover">
                  <div>
                    <span className="mb-2 inline-block rounded-md bg-[hsl(var(--accent))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--accent-foreground))]">
                      {t(article.category)}
                    </span>
                    <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">{t(article.title)}</h3>
                  </div>
                  <Arrow className="mt-1 h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))] transition-colors group-hover:text-[hsl(var(--primary))]" />
                </div>
              </ScrollReveal>
            ))}
          </div>
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
              {lang === 'ar' ? 'مستعد لبدء طلب التمويل؟' : 'Ready to start your financing request?'}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/60">
              {lang === 'ar' ? 'قدّم طلبك مجاناً واحصل على عروض من جهات تمويل متعددة' : 'Submit your request for free and receive offers from multiple lenders'}
            </p>
            <div className="mt-8">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[hsl(var(--primary))] shadow-elevated transition-all hover:opacity-90"
              >
                {lang === 'ar' ? 'قدّم طلبك مجاناً' : 'Submit Your Request — Free'}
                <Arrow className="h-5 w-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default function KnowledgeClient() {
  return (
    <PublicLanguageProvider>
      <KnowledgeContent />
    </PublicLanguageProvider>
  )
}
