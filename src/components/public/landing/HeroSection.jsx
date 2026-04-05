'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useLang, translations } from '@/contexts/PublicLanguageContext'

const WHATSAPP_NUMBER = '966552799610'

export default function HeroSection() {
  const { t, isRTL, lang } = useLang()
  const h = translations.hero
  const Arrow = isRTL ? ArrowLeft : ArrowRight

  const trustPoints = [h.trust1, h.trust2, h.trust3]

  const whatsappMessage =
    lang === 'ar'
      ? 'مرحباً، أرغب في معرفة خيارات التمويل المتاحة لشركتي عبر منصة نسبة.'
      : 'Hello, I would like to learn about financing options for my business through Nesbah.'
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <section className="gradient-hero relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 start-1/4 h-[500px] w-[500px] rounded-full bg-white/10 blur-[120px]" />
        <div className="absolute -bottom-20 end-1/4 h-[400px] w-[400px] rounded-full bg-white/5 blur-[100px]" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container relative mx-auto px-4 py-24 md:py-36 lg:py-44">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl lg:text-[3.5rem]"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.15 }}
          >
            {t(h.headline)}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 md:text-lg"
          >
            {t(h.sub)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-semibold text-white shadow-elevated transition-all hover:opacity-90"
            >
              {t(h.cta)}
              <Arrow className="h-5 w-5" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t(h.ctaSec)}
            </a>
          </motion.div>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6"
          >
            {trustPoints.map((point, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm text-white/50">
                <Check className="h-4 w-4 text-green-400" />
                {t(point)}
              </span>
            ))}
          </motion.div>

          {/* Offer cards visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto mt-16 max-w-2xl"
          >
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { rate: '7.5%', label: { ar: 'بنك أ', en: 'Bank A' } },
                  { rate: '8.2%', label: { ar: 'شركة تمويل ب', en: 'Lender B' } },
                  { rate: '6.9%', label: { ar: 'بنك ج', en: 'Bank C' } },
                ].map((offer, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 text-start transition-all ${
                      i === 2
                        ? 'border-white/30 bg-white/15'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="mb-1 text-xs text-white/40">{t(offer.label)}</div>
                    <div className="mb-2 text-lg font-bold text-white/80">{offer.rate}</div>
                    <div className="h-5 w-14 rounded-md bg-white/20" />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-white/30">{t(h.visualLabel)}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
