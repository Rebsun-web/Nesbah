'use client'

// Ported verbatim from the nesbah.net reference implementation
// (src/routes/contact.tsx + src/routes/en/contact.tsx). Copy is client-approved.
//
// Note: the reference contact page is channel-only — WhatsApp and email, no form.
// Our previous version had a contact form with no backend endpoint behind it, which
// this replaces.

import { PublicLanguageProvider, useLang } from '@/contexts/PublicLanguageContext'
import LegalShell from '@/components/public/LegalShell'
import { WHATSAPP } from '@/content/home'

const c = {
  title: { ar: 'تواصل معنا', en: 'Contact us' },
  intro: {
    ar: 'يسعدنا تواصلك. اختر القناة الأنسب لك:',
    en: "We'd love to hear from you. Pick the channel that fits best:",
  },
  whatsappLabel: { ar: 'واتساب:', en: 'WhatsApp:' },
  whatsappLink: { ar: 'تواصل معنا عبر واتساب', en: 'Message us on WhatsApp' },
  emailLabel: { ar: 'البريد الإلكتروني:', en: 'Email:' },
  applyHeading: { ar: 'لتقديم طلب تمويل', en: 'To submit a financing request' },
  applyBody: {
    ar: 'قدّم طلبك عبر المنصة لتتمكن من متابعته باستخدام الرقم المرجعي.',
    en: 'Use the in-platform application to get the best experience and follow up with a reference number.',
  },
}

function ContactBody() {
  const { t, lang } = useLang()
  return (
    <LegalShell title={t(c.title)}>
      <p>{t(c.intro)}</p>
      <ul>
        <li>
          {t(c.whatsappLabel)}{' '}
          <a href={WHATSAPP[lang] || WHATSAPP.ar} target="_blank" rel="noopener noreferrer" className="text-violet underline">
            {t(c.whatsappLink)}
          </a>
        </li>
        <li>
          {t(c.emailLabel)}{' '}
          <a href="mailto:info@nesbah.com.sa" className="text-violet underline">info@nesbah.com.sa</a>
        </li>
      </ul>
      <h2>{t(c.applyHeading)}</h2>
      <p>{t(c.applyBody)}</p>
    </LegalShell>
  )
}

export default function ContactClient() {
  return (
    <PublicLanguageProvider>
      <ContactBody />
    </PublicLanguageProvider>
  )
}
