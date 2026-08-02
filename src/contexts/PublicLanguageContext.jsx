'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

// Inline translations — ported from Lovable lovable-reference/src/i18n/translations.ts
export const translations = {
  nav: {
    brand: { ar: 'نسبة', en: 'Nesbah' },
    howItWorks: { ar: 'كيف تعمل', en: 'How It Works' },
    solutions: { ar: 'حلول التمويل', en: 'Solutions' },
    whyNesbah: { ar: 'لماذا نسبة', en: 'Why Nesbah' },
    faq: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
    login: { ar: 'تسجيل الدخول', en: 'Sign In' },
    cta: { ar: 'قدّم طلبك', en: 'Get Started' },
    openMenu: { ar: 'فتح القائمة', en: 'Open menu' },
    closeMenu: { ar: 'إغلاق القائمة', en: 'Close menu' },
  },
  hero: {
    headline: { ar: 'قارن عروض تمويل لشركتك من عدة جهات – مجاناً', en: 'Compare financing offers for your business from multiple lenders — free' },
    sub: { ar: 'نسبة منصة تساعد الشركات في السعودية على الوصول إلى عروض تمويل من البنوك وشركات التمويل، ومقارنة الخيارات واختيار الأنسب لاحتياجاتها بسهولة ووضوح.', en: 'Nesbah is a platform that helps businesses in Saudi Arabia access financing offers from banks and financing companies, compare options, and choose the best fit — simply and clearly.' },
    cta: { ar: 'قدّم طلب تمويل لشركتك الآن', en: 'Submit a financing request now' },
    ctaSec: { ar: 'تحتاج استفسار قبل التقديم؟ تواصل معنا على واتساب', en: 'Need to ask before applying? Chat on WhatsApp' },
    trust1: { ar: 'الخدمة مجانية بالكامل للشركات', en: 'Completely free for businesses' },
    trust2: { ar: 'بدون الحاجة للتواصل مع كل جهة بشكل منفصل', en: 'No need to contact each lender separately' },
    trust3: { ar: 'قارن العروض واختر الأنسب بدون التزام', en: 'Compare offers and choose — no obligation' },
    visualLabel: { ar: 'عروض تمويل من جهات متعددة', en: 'Financing offers from multiple providers' },
  },
  how: {
    title: { ar: 'كيف تعمل نسبة؟', en: 'How Nesbah Works' },
    subtitle: { ar: 'خطوات بسيطة تساعدك في الوصول إلى عروض تمويل مناسبة لشركتك.', en: 'Simple steps to help you access financing offers that fit your business.' },
    step1Title: { ar: 'قدّم طلب التمويل', en: 'Submit your request' },
    step1Desc: { ar: 'أدخل معلومات شركتك واحتياجك التمويلي من خلال نموذج واضح ومختصر.', en: 'Enter your business info and financing needs through a clear, simple form.' },
    step2Title: { ar: 'نشارك طلبك مع الجهات المناسبة', en: 'We share with relevant lenders' },
    step2Desc: { ar: 'نعرض طلبك على البنوك وشركات التمويل المناسبة حسب نوع النشاط واحتياجك.', en: 'We forward your request to banks and financing companies that match your business type and needs.' },
    step3Title: { ar: 'تصلك عروض متعددة', en: 'Receive multiple offers' },
    step3Desc: { ar: 'تستقبل أكثر من عرض تمويل وتطّلع على الخيارات المتاحة بشكل أوضح.', en: 'Receive multiple financing offers and review your available options more clearly.' },
    step4Title: { ar: 'اختر العرض المناسب', en: 'Choose and proceed' },
    step4Desc: { ar: 'إذا ناسبك أحد العروض، تكمل إجراءاتك مباشرة مع الجهة الممولة.', en: 'If an offer fits, you proceed directly with the financing provider.' },
    cta: { ar: 'قدّم طلبك الآن', en: 'Submit your request' },
  },
  financing: {
    title: { ar: 'أنواع التمويل التي يمكن طلبها عبر نسبة', en: 'Financing types you can request through Nesbah' },
    subtitle: { ar: 'سواء كان احتياج شركتك تشغيليًا أو توسعيًا، تساعدك نسبة في الوصول إلى خيارات تمويل مناسبة.', en: 'Whether your business needs operational or growth financing, Nesbah helps you access suitable options.' },
    types: [
      { title: { ar: 'تمويل الشركات', en: 'Business Financing' }, desc: { ar: 'تمويل شامل للشركات والمنشآت بمختلف أحجامها واحتياجاتها التشغيلية.', en: 'Comprehensive financing for businesses of all sizes and their operational needs.' }, slug: 'business-financing' },
      { title: { ar: 'تمويل رأس المال العامل', en: 'Working Capital' }, desc: { ar: 'لتغطية المصاريف التشغيلية اليومية وتحسين التدفق النقدي.', en: 'Cover daily operational expenses and improve your cash flow.' }, slug: 'working-capital-financing' },
      { title: { ar: 'تمويل التوسع والنمو', en: 'Expansion Financing' }, desc: { ar: 'لفتح فروع جديدة أو دخول أسواق إضافية أو زيادة الطاقة الإنتاجية.', en: 'Open new branches, enter new markets, or increase production capacity.' }, slug: 'expansion-financing' },
      { title: { ar: 'تمويل المعدات والأجهزة', en: 'Equipment Financing' }, desc: { ar: 'لشراء المعدات والآلات اللازمة لتطوير نشاطك التجاري.', en: 'Purchase equipment and machinery for your business development.' }, slug: 'equipment-financing' },
      { title: { ar: 'تمويل المشاريع', en: 'Project Financing' }, desc: { ar: 'للمشاريع الكبيرة والعقود الحكومية والخاصة التي تحتاج تمويل مخصص.', en: 'For large projects and government or private contracts needing dedicated financing.' }, slug: 'project-financing' },
      { title: { ar: 'التمويل العقاري التجاري', en: 'Commercial Real Estate' }, desc: { ar: 'لشراء أو تطوير العقارات التجارية والمرافق لمنشأتك.', en: 'Buy or develop commercial real estate and facilities for your business.' }, slug: 'real-estate-project-financing' },
      { title: { ar: 'تمويل نقاط البيع', en: 'POS Financing' }, desc: { ar: 'سيولة سريعة بناءً على حجم مبيعات نقاط البيع الخاصة بشركتك.', en: 'Quick liquidity based on your POS sales volume.' }, slug: 'pos-financing' },
    ],
  },
  whyNesbah: {
    title: { ar: 'ليش تستخدم نسبة بدل التواصل المباشر مع جهات التمويل؟', en: 'Why use Nesbah instead of contacting lenders directly?' },
    subtitle: { ar: 'بدل ما تتواصل مع كل جهة تمويل بشكل منفصل، تساعدك نسبة في تبسيط العملية وجمع الخيارات في مكان واحد.', en: 'Instead of contacting each financing provider separately, Nesbah simplifies the process and brings your options together.' },
    items: [
      { title: { ar: 'تقديم أسهل', en: 'Easier application' }, desc: { ar: 'بدل تعبئة نموذج كل جهة على حدة، قدّم من خلال نموذج واحد.', en: "Instead of filling out each lender's form separately, apply through one simple form." } },
      { title: { ar: 'مقارنة أوضح', en: 'Clearer comparison' }, desc: { ar: 'قارن بين عدة عروض تمويل واختر الأنسب لاحتياج شركتك.', en: 'Compare multiple financing offers and choose the best fit for your business.' } },
      { title: { ar: 'وفّر وقتك وجهدك', en: 'Save time and effort' }, desc: { ar: 'بدل المتابعة مع أكثر من جهة، نوصّل طلبك للجهات المناسبة.', en: 'Instead of following up with multiple lenders, we connect your request with the right ones.' } },
      { title: { ar: 'مجاني بالكامل', en: 'Completely free' }, desc: { ar: 'الخدمة مجانية بالكامل للشركات. لا رسوم ولا تكاليف مخفية.', en: 'The service is completely free for businesses. No fees or hidden costs.' } },
      { title: { ar: 'بدون التزام', en: 'No obligation' }, desc: { ar: 'استقبل العروض واختر بحريتك — لا يوجد أي التزام بقبول أي عرض.', en: 'Receive offers and choose freely — no obligation to accept any offer.' } },
    ],
  },
  audience: {
    title: { ar: 'لمن تناسب منصة نسبة؟', en: 'Who is Nesbah for?' },
    subtitle: { ar: 'صُممت نسبة لخدمة الشركات والمنشآت التي تبحث عن خيارات تمويل أوضح وأسهل في السعودية.', en: 'Nesbah is designed for businesses in Saudi Arabia looking for clearer and easier financing options.' },
    items: [
      { title: { ar: 'المنشآت الصغيرة والمتوسطة', en: 'SMEs' }, desc: { ar: 'الباحثين عن تمويل للتوسع أو تحسين التدفق النقدي أو تغطية المصاريف التشغيلية.', en: 'Looking for financing to expand, improve cash flow, or cover operational expenses.' } },
      { title: { ar: 'الشركات في طور النمو', en: 'Growing companies' }, desc: { ar: 'شركات تحتاج تمويل لدعم خطط النمو والتوسع في أسواق جديدة.', en: 'Companies needing financing to support growth plans and expansion into new markets.' } },
      { title: { ar: 'الشركات التي تحتاج رأس مال عامل', en: 'Working capital seekers' }, desc: { ar: 'شركات تحتاج سيولة لتغطية رواتب أو مشتريات أو مصاريف موسمية.', en: 'Companies needing liquidity for payroll, purchases, or seasonal expenses.' } },
      { title: { ar: 'شركات المشاريع والعقار والمعدات', en: 'Project, real estate & equipment companies' }, desc: { ar: 'الباحثين عن تمويل مشاريع أو تمويل عقاري تجاري أو تمويل معدات.', en: 'Seeking project financing, commercial real estate financing, or equipment financing.' } },
    ],
  },
  faq: {
    title: { ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions' },
    subtitle: { ar: 'إجابات على أكثر الأسئلة شيوعاً عن نسبة', en: 'Answers to common questions about Nesbah' },
    items: [
      { q: { ar: 'هل نسبة جهة تمويل؟', en: 'Is Nesbah a financing provider?' }, a: { ar: 'لا، نسبة ليست جهة تمويل. نحن منصة تساعد الشركات في الوصول إلى عروض من البنوك وشركات التمويل.', en: 'No, Nesbah is not a financing provider. We are a platform that helps businesses access offers from banks and financing companies.' } },
      { q: { ar: 'هل الخدمة مجانية للشركات؟', en: 'Is the service free for businesses?' }, a: { ar: 'نعم، الخدمة مجانية بالكامل للشركات، ولا توجد رسوم على تقديم الطلب أو مقارنة العروض.', en: 'Yes, the service is completely free for businesses. No fees for submitting requests or comparing offers.' } },
      { q: { ar: 'هل ألتزم إذا قدّمت طلب تمويل؟', en: 'Am I obligated if I submit a request?' }, a: { ar: 'لا، تقديم الطلب لا يعني التزامك بقبول أي عرض. يمكنك مراجعة العروض واتخاذ القرار المناسب لك.', en: 'No, submitting a request does not obligate you to accept any offer. You can review offers and make the decision that is right for you.' } },
      { q: { ar: 'ما أنواع التمويل التي يمكن طلبها عبر نسبة؟', en: 'What financing types can I request through Nesbah?' }, a: { ar: 'يمكنك طلب أنواع مختلفة مثل تمويل الشركات، رأس المال العامل، التوسع، المعدات، المشاريع، المشاريع العقارية، ونقاط البيع.', en: 'You can request various types including business, working capital, expansion, equipment, project, commercial real estate, and POS financing.' } },
      { q: { ar: 'كيف أختار العرض المناسب؟', en: 'How do I choose the right offer?' }, a: { ar: 'بعد استلام العروض، يمكنك مقارنتها واختيار الأنسب حسب احتياج شركتك وظروفها.', en: 'After receiving offers, you can compare them and choose the best fit based on your business needs and circumstances.' } },
      { q: { ar: 'هل بيانات شركتي تُشارك مع جميع الجهات؟', en: 'Is my data shared with all providers?' }, a: { ar: 'تتم مشاركة الطلب مع الجهات المناسبة بهدف مساعدتك في الوصول إلى خيارات تمويل مناسبة.', en: 'Your request is shared with relevant providers to help you access suitable financing options.' } },
      { q: { ar: 'كم يستغرق تقديم الطلب؟', en: 'How long does it take to submit a request?' }, a: { ar: 'تقديم الطلب يستغرق وقتًا قصيرًا، وتم تصميمه ليكون واضحًا وسهلًا قدر الإمكان.', en: 'Submitting a request takes just a short time, and the form is designed to be as clear and simple as possible.' } },
    ],
  },
  cta: {
    title: { ar: 'احصل على عروض تمويل لشركتك', en: 'Get financing offers for your business' },
    sub: { ar: 'التقديم يستغرق وقتًا قصيرًا، والخدمة مجانية بالكامل للشركات.', en: 'Applying takes just a moment, and the service is completely free for businesses.' },
    cta: { ar: 'قدّم طلب تمويل لشركتك الآن', en: 'Submit a financing request now' },
    ctaSec: { ar: 'استفسر عبر واتساب', en: 'Ask via WhatsApp' },
    note: { ar: 'مجاني للشركات • بدون التزام', en: 'Free for businesses • No obligation' },
  },
  footer: {
    desc: { ar: 'منصة سعودية تربط الشركات بجهات التمويل لمقارنة العروض واختيار الأنسب.', en: 'A Saudi platform connecting businesses with financing providers to compare offers and choose the best fit.' },
    platform: { ar: 'المنصة', en: 'Platform' },
    company: { ar: 'الشركة', en: 'Company' },
    contact: { ar: 'التواصل', en: 'Contact' },
    aboutLink: { ar: 'عن نسبة', en: 'About Nesbah' },
    contactLink: { ar: 'تواصل معنا', en: 'Contact Us' },
    termsLink: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
    privacyLink: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
    location: { ar: 'الرياض، المملكة العربية السعودية', en: 'Riyadh, Saudi Arabia' },
    copyright: { ar: 'نسبة. جميع الحقوق محفوظة. نسبة ليست جهة تمويل.', en: 'Nesbah. All rights reserved. Nesbah is not a financing provider.' },
  },
  onboarding: {
    privacyNote: { ar: 'بياناتك محمية ولا تُشارك إلا بموافقتك', en: 'Your data is protected and shared only with your consent' },
    step1Label: { ar: 'بيانات الشركة', en: 'Business Info' },
    step2Label: { ar: 'تفاصيل التمويل', en: 'Financing Details' },
    step3Label: { ar: 'مراجعة وإرسال', en: 'Review & Submit' },
    step1Title: { ar: 'أخبرنا عن شركتك', en: 'Tell us about your business' },
    step1Sub: { ar: 'أدخل بيانات شركتك الأساسية حتى نتمكن من ربطك بجهات التمويل المناسبة.', en: 'Enter your basic business details so we can connect you with the right financing providers.' },
    step2Title: { ar: 'ما نوع التمويل الذي تحتاجه؟', en: 'What type of financing do you need?' },
    step2Sub: { ar: 'حدد نوع التمويل والمبلغ المطلوب حتى نوصلك بالجهات الأنسب.', en: 'Specify the financing type and amount so we can match you with the best providers.' },
    step3Title: { ar: 'راجع طلبك', en: 'Review Your Request' },
    step3Sub: { ar: 'تأكد من صحة البيانات قبل الإرسال. يمكنك التعديل بالرجوع للخطوات السابقة.', en: 'Verify your information before submitting. You can go back to edit any details.' },
    businessName: { ar: 'اسم الشركة', en: 'Business Name' },
    businessNamePh: { ar: 'مثال: شركة الرياض التجارية', en: 'e.g. Riyadh Trading Company' },
    crNumber: { ar: 'الرقم الوطني الموحد', en: 'Unified National Number' },
    crNumberPh: { ar: 'مثال: 700XXXXXXX', en: 'e.g. 700XXXXXXX' },
    city: { ar: 'المدينة', en: 'City' },
    cityPh: { ar: 'اختر المدينة', en: 'Select city' },
    sector: { ar: 'القطاع', en: 'Sector' },
    sectorPh: { ar: 'اختر القطاع', en: 'Select sector' },
    // Annual revenue + pre-revenue escape hatch (client spec Part A, A1 + A2).
    annualRevenue: { ar: 'الإيراد السنوي', en: 'Annual revenue' },
    annualRevenuePh: { ar: 'اختر الإيراد السنوي', en: 'Select annual revenue' },
    annualRevenueErr: { ar: 'اختر الإيراد السنوي', en: 'Select annual revenue' },
    preRevenue: {
      ar: 'لا توجد مبيعات / لم تبدأ المنشأة نشاطها بعد',
      en: 'No sales yet / business has not started operating',
    },
    contactInfo: { ar: 'بيانات التواصل', en: 'Contact Information' },
    contactName: { ar: 'اسم المسؤول', en: 'Contact Person' },
    contactNamePh: { ar: 'الاسم الكامل', en: 'Full name' },
    phone: { ar: 'رقم الجوال', en: 'Mobile Number' },
    phonePh: { ar: '05XXXXXXXX', en: '05XXXXXXXX' },
    email: { ar: 'البريد الإلكتروني', en: 'Email' },
    emailPh: { ar: 'email@company.com', en: 'email@company.com' },
    financingType: { ar: 'نوع التمويل', en: 'Financing Type' },
    financingTypePh: { ar: 'اختر نوع التمويل', en: 'Select financing type' },
    amount: { ar: 'المبلغ المطلوب', en: 'Requested amount' },
    amountPh: { ar: 'اختر المبلغ المطلوب', en: 'Select requested amount' },
    amountErr: { ar: 'اختر المبلغ المطلوب', en: 'Select the requested amount' },
    // Business age — an existing field on the reference implementation and an
    // input to the internal prioritization indicator.
    businessAge: { ar: 'منذ متى بدأت المنشأة نشاطها؟', en: 'How long has the business been operating?' },
    businessAgePh: { ar: 'اختر العمر التشغيلي', en: 'Select operating age' },
    businessAgeErr: { ar: 'اختر عمر المنشأة', en: 'Select the business age' },
    // POS sales question (client spec Part A, A3).
    hasPos: {
      ar: 'هل تتم مبيعاتك كلياً أو جزئياً عبر أجهزة نقاط البيع؟',
      en: 'Do your sales fully or partially go through POS devices?',
    },
    hasPosErr: { ar: 'الإجابة مطلوبة', en: 'This answer is required' },
    yes: { ar: 'نعم', en: 'Yes' },
    no: { ar: 'لا', en: 'No' },
    purpose: { ar: 'الغرض من التمويل', en: 'Purpose of Financing' },
    purposePh: { ar: 'مثال: تمويل توسعة النشاط، شراء معدات، دعم رأس المال العامل', en: 'e.g. Business expansion, equipment purchase, working capital support' },
    reviewBusiness: { ar: 'بيانات الشركة', en: 'Business Information' },
    reviewFinancing: { ar: 'تفاصيل التمويل', en: 'Financing Details' },
    // Explicit, recorded consent — matches the reference implementation. The
    // accepted version is stored alongside the timestamp on the application row.
    consent: {
      ar: 'أوافق على مشاركة بيانات الطلب مع جهات التمويل المشاركة لغرض دراسة الطلب والنظر في إمكانية تقديم خيار تمويلي. اطّلعت على',
      en: 'I agree to share my application data with participating financing providers so they can review it and consider offering a financing option. I have read the',
    },
    consentTerms: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
    consentAnd: { ar: 'و', en: 'and the' },
    consentPrivacy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
    consentErr: { ar: 'الموافقة على مشاركة البيانات مطلوبة', en: 'Consent to share your data is required' },
    prev: { ar: 'السابق', en: 'Previous' },
    next: { ar: 'التالي', en: 'Next' },
    submit: { ar: 'إرسال الطلب', en: 'Submit Request' },
    backHome: { ar: 'العودة للرئيسية', en: 'Back to Home' },
    successTitle: { ar: 'تم إرسال طلبك بنجاح!', en: 'Request Submitted Successfully!' },
    successMsg: { ar: 'سيتواصل معك فريقنا قريباً عبر واتساب أو البريد الإلكتروني.', en: 'Our team will follow up with you shortly via WhatsApp or email.' },
    successCta: { ar: 'العودة للصفحة الرئيسية', en: 'Back to Homepage' },
    // Option labels live in src/lib/apply-options.js — one source of truth for the
    // code↔label mapping, shared by the form, the API and the admin portal.
    reviewLabels: {
      businessName: { ar: 'اسم الشركة', en: 'Business Name' },
      crNumber: { ar: 'الرقم الوطني الموحد', en: 'Unified National Number' },
      city: { ar: 'المدينة', en: 'City' },
      sector: { ar: 'القطاع', en: 'Sector' },
      annualRevenue: { ar: 'الإيراد السنوي', en: 'Annual revenue' },
      contactName: { ar: 'المسؤول', en: 'Contact' },
      phone: { ar: 'الجوال', en: 'Mobile' },
      email: { ar: 'البريد الإلكتروني', en: 'Email' },
      financingType: { ar: 'نوع التمويل', en: 'Financing Type' },
      amount: { ar: 'المبلغ المطلوب', en: 'Amount' },
      businessAge: { ar: 'عمر المنشأة', en: 'Business age' },
      hasPos: { ar: 'مبيعات عبر نقاط البيع', en: 'Sales via POS devices' },
      purpose: { ar: 'الغرض', en: 'Purpose' },
    },
  },
}

// Context
const PublicLanguageContext = createContext(null)

export function PublicLanguageProvider({ children }) {
  const [lang, setLang] = useState('ar')

  useEffect(() => {
    const saved = localStorage.getItem('nesbah_lang')
    if (saved && saved !== 'ar') setLang(saved)
  }, [])

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar'
      localStorage.setItem('nesbah_lang', next)
      return next
    })
  }, [])

  const isRTL = lang === 'ar'

  // Write the direction onto <html>, not just a wrapper div. The reference
  // implementation does the same (its useEnLtr hook sets documentElement.lang/dir).
  // It matters for layout, not only text: with dir on an inner div the hero grid
  // resolved its column order the opposite way to nesbah.net, so the whole hero
  // rendered mirrored.
  useEffect(() => {
    const html = document.documentElement
    html.lang = lang
    html.dir = isRTL ? 'rtl' : 'ltr'
  }, [lang, isRTL])

  const t = useCallback(
    (obj) => (obj && typeof obj === 'object' ? obj[lang] || obj['ar'] || '' : ''),
    [lang]
  )

  return (
    <PublicLanguageContext.Provider value={{ lang, toggleLang, isRTL, t }}>
      <div className="surface-public min-h-screen">
        {children}
      </div>
    </PublicLanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(PublicLanguageContext)
  if (!ctx) throw new Error('useLang must be used inside PublicLanguageProvider')
  return ctx
}
