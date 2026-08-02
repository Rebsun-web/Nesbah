'use client'

// Ported verbatim from the nesbah.net reference implementation
// (src/routes/about.tsx + src/routes/en/about.tsx). Copy is client-approved —
// do not reword locally.

import { PublicLanguageProvider, useLang } from '@/contexts/PublicLanguageContext'
import LegalShell from '@/components/public/LegalShell'

const c = {
  title: { ar: 'عن نسبة', en: 'About Nesbah' },
  intro: {
    ar: 'نسبة منصة سعودية تسهّل على أصحاب المنشآت الوصول إلى جهات تمويل مرخصة. يقدّم العميل طلبًا واحدًا، ثم نشاركه — بعد موافقته — مع الجهات المشاركة للنظر فيه. وقد تتواصل إحدى الجهات أو تشارك خيارًا تمويليًا إذا قررت متابعة الطلب.',
    en: 'Nesbah is a Saudi platform that simplifies business financing by connecting business owners with licensed financing providers in the Kingdom of Saudi Arabia. You submit one clear application, we share it with participating banks and finance companies, and you may receive financing options if a provider chooses to proceed with the application — instead of navigating each provider separately.',
  },
  whatWeDo: { ar: 'ما نقدّمه', en: 'What we do' },
  whatWeDoItems: {
    ar: [
      'طلب موحّد بالعربية والإنجليزية.',
      'مشاركة مضبوطة لبياناتك مع جهات تمويل مرخصة، بعد موافقتك.',
      'دليل تثقيفي عن أنواع التمويل الشائعة لأصحاب الأعمال في السعودية.',
    ],
    en: [
      'A simple, bilingual application form.',
      'Controlled sharing of your data with licensed financing providers, after your consent.',
      'An educational guide about common financing types for Saudi businesses.',
    ],
  },
  whatWeDont: { ar: 'ما لا نقدّمه', en: "What we don't do" },
  whatWeDontBody: {
    ar: 'نسبة ليست بنكاً أو شركة تمويل. لا نصدر قرارات ائتمانية، ولا نحدّد المبالغ أو التسعير أو الشروط — هذه من صلاحيات كل جهة تمويل وفقاً لسياستها الائتمانية.',
    en: 'Nesbah is not a bank or finance company. We do not make credit decisions and do not set amounts, pricing, or terms — those are the responsibility of each financing provider in line with its credit policy.',
  },
  principles: { ar: 'مبادئنا', en: 'Our principles' },
  principlesItems: {
    ar: [
      'خدمة مجانية لأصحاب الأعمال.',
      'وضوح تام حول ما يحدث لبياناتك ومع مَن تُشارك.',
      'لا التزام: القرار النهائي لك في قبول أو رفض أي خيار تمويلي.',
    ],
    en: [
      'The service is free for business owners.',
      'Full clarity about what happens to your data and who it is shared with.',
      'No obligation — you decide whether to accept or decline any offer.',
    ],
  },
}

function AboutBody() {
  const { t, lang } = useLang()
  return (
    <LegalShell title={t(c.title)}>
      <p>{t(c.intro)}</p>

      <h2>{t(c.whatWeDo)}</h2>
      <ul>{(c.whatWeDoItems[lang] || c.whatWeDoItems.ar).map((i) => <li key={i}>{i}</li>)}</ul>

      <h2>{t(c.whatWeDont)}</h2>
      <p>{t(c.whatWeDontBody)}</p>

      <h2>{t(c.principles)}</h2>
      <ul>{(c.principlesItems[lang] || c.principlesItems.ar).map((i) => <li key={i}>{i}</li>)}</ul>
    </LegalShell>
  )
}

export default function AboutClient() {
  return (
    <PublicLanguageProvider>
      <AboutBody />
    </PublicLanguageProvider>
  )
}
