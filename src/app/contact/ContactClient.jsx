'use client'

import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import Navbar from '@/components/public/landing/Navbar'
import Footer from '@/components/public/landing/Footer'
import { Mail, MapPin, Send } from 'lucide-react'

function ContactContent() {
  const handleSubmit = (e) => {
    e.preventDefault()
    alert('تم إرسال رسالتك بنجاح!')
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            تواصل معنا
          </h1>
          <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
            نسعد بتواصلك. أرسل لنا استفسارك وسنرد عليك في أقرب وقت.
          </p>

          <div className="mt-12 grid gap-10 md:grid-cols-5">
            <div className="md:col-span-3">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[hsl(var(--foreground))]">الاسم</label>
                    <input id="name" placeholder="اسمك الكامل" className="mt-1.5 block w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--foreground))]">البريد الإلكتروني</label>
                    <input id="email" type="email" placeholder="email@example.com" dir="ltr" className="mt-1.5 block w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]" />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[hsl(var(--foreground))]">الموضوع</label>
                  <input id="subject" placeholder="موضوع الرسالة" className="mt-1.5 block w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[hsl(var(--foreground))]">الرسالة</label>
                  <textarea id="message" placeholder="اكتب رسالتك هنا..." rows={5} className="mt-1.5 block w-full rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.15)]" />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                  إرسال الرسالة
                </button>
              </form>
            </div>

            <div className="space-y-6 md:col-span-2">
              <div className="rounded-2xl bg-[hsl(var(--card))] p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">البريد الإلكتروني</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]" dir="ltr">info@nesbah.com.sa</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-[hsl(var(--card))] p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">الموقع</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">الرياض، المملكة العربية السعودية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function ContactClient() {
  return (
    <PublicLanguageProvider>
      <ContactContent />
    </PublicLanguageProvider>
  )
}
