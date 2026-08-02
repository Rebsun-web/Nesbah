// Homepage content, ported verbatim from the nesbah.net reference implementation
// (src/routes/index.tsx for Arabic, src/routes/en/index.tsx for English).
//
// The reference keeps two separate route files per language. This codebase renders one
// component set driven by `useLang()`, so the copy is paired here instead. Strings are
// the reference's exactly — do not reword them locally; they are client-approved copy.
//
// Financing type codes match src/lib/apply-options.js. The `slug` on each entry is OUR
// product-page URL, deliberately different from the reference's `/product/<code>`:
// ours are already indexed in Google Search Console and must not change.

import {
    Building2, Banknote, TrendingUp, Cog, FolderKanban, Building, CreditCard,
    Sparkles, FileText, DollarSign, Shield, Lock, Zap, CheckCircle2,
    Store, Rocket, HardHat, ShoppingBag,
} from 'lucide-react'

export const WHATSAPP = {
    ar: 'https://wa.me/966552799610?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D9%85%D8%B9%D8%B1%D9%81%D8%A9%20%D8%AE%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AA%D9%85%D9%88%D9%8A%D9%84',
    en: "https://wa.me/966552799610?text=Hi%2C%20I'd%20like%20to%20learn%20more%20about%20financing%20options%20via%20Nesbah.",
}

export const nav = [
    { href: '#financing', ar: 'أنواع التمويل', en: 'Financing Types' },
    { href: '#how', ar: 'كيف يعمل', en: 'How It Works' },
    { href: '#why', ar: 'لماذا نسبة', en: 'Why Nesbah' },
    { href: '#faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
]

// Header: same labels as the reference, pointing at OUR routes.
//   Financing Guide / Deposits → the reverse-proxied surface (see next.config.mjs)
//   Customer Sign in → our /login, not their /customer/login
//   Apply Now → our /onboarding, not their /apply
export const headerLinks = {
    guide: { ar: 'دليل التمويل', en: 'Financing Guide', href: '/financing-guide' },
    deposits: { ar: 'الودائع', en: 'Deposits', href: '/deposits' },
    signIn: { ar: 'دخول العميل', en: 'Customer Sign in', href: '/login' },
    apply: { ar: 'قدّم طلبك', en: 'Apply Now', href: '/onboarding' },
    // The toggle shows the language you'd switch TO.
    switchTo: { ar: 'EN', en: 'عربي' },
    openMenu: { ar: 'فتح القائمة', en: 'Open menu' },
    closeMenu: { ar: 'إغلاق القائمة', en: 'Close menu' },
    primaryNav: { ar: 'التنقّل الرئيسي', en: 'Primary navigation' },
}

export const hero = {
    eyebrow: { ar: 'منصة تمويل الشركات في السعودية', en: 'Business financing platform in Saudi Arabia' },
    titleLine1: { ar: 'طلب واحد.', en: 'One application.' },
    titleLine2: { ar: 'طريق أوضح للتمويل.', en: 'Clearer financing options.' },
    sub: {
        ar: 'قدّم بيانات منشأتك مرة واحدة، ونشارك طلبك مع جهات تمويل مرخصة، ثم تابع حالته من مكان واحد.',
        en: 'Share your business information once, route it to the right financing providers, then track everything from a single dashboard.',
    },
    ctaPrimary: { ar: 'ابدأ طلب التمويل', en: 'Start your application' },
    ctaSecondary: { ar: 'استكشف دليل التمويل', en: 'Explore the guide' },
    disclaimer: {
        ar: 'نسبة ليست جهة تمويل ولا تتخذ قرارات ائتمانية.',
        en: 'Nesbah is not a lender and does not make credit decisions.',
    },
    // Hero visual: illustrative comparison card + two floating satellites.
    cardTitle: { ar: 'مقارنة خيارات التمويل', en: 'Financing options compared' },
    cardRef: '#NSB-2041',
    cardRows: {
        ar: [
            { n: 'جهة تمويل ١', a: '٥٠٠٬٠٠٠ ر.س', t: '٢٤ شهر' },
            { n: 'جهة تمويل ٢', a: '٤٥٠٬٠٠٠ ر.س', t: '٣٦ شهر' },
            { n: 'جهة تمويل ٣', a: '٦٠٠٬٠٠٠ ر.س', t: '١٨ شهر' },
        ],
        en: [
            { n: 'Provider 1', a: 'SAR 500,000', t: '24 months' },
            { n: 'Provider 2', a: 'SAR 450,000', t: '36 months' },
            { n: 'Provider 3', a: 'SAR 600,000', t: '18 months' },
        ],
    },
    satelliteA: {
        label: { ar: 'حالة الطلب', en: 'Request status' },
        value: { ar: 'قيد المراجعة', en: 'Under review' },
        note: { ar: 'لدى جهات التمويل', en: 'with financing providers' },
    },
    satelliteB: {
        label: { ar: 'متابعة موحّدة', en: 'Unified tracking' },
        value: { ar: 'لوحة واحدة', en: 'One dashboard' },
        note: { ar: 'كل التحديثات في مكان واحد', en: 'every update in one place' },
    },
}

export const depositsPromo = {
    badge: { ar: 'جديد', en: 'New' },
    title: {
        ar: 'قارن الودائع الاستثمارية لأجل في السعودية في مكان واحد.',
        en: 'Compare fixed-term investment deposits in Saudi Arabia in one place.',
    },
    previewTitle: { ar: 'مقارنة ودائع', en: 'Deposit comparison' },
    previewMeta: { ar: 'SAR • 360 يوم', en: 'SAR • 360 days' },
    // Illustrative placeholders against anonymised banks. NEVER put a real rate here —
    // this page is not part of the rate-maintenance workflow, so it would go stale.
    rows: {
        ar: [{ n: 'بنك أ', r: '5.35%', hi: true }, { n: 'بنك ب', r: '5.10%' }, { n: 'بنك ج', r: '4.85%' }],
        en: [{ n: 'Bank A', r: '5.35%', hi: true }, { n: 'Bank B', r: '5.10%' }, { n: 'Bank C', r: '4.85%' }],
    },
    previewFoot: {
        ar: 'مثال توضيحي — الأرقام الفعلية في صفحة المقارنة.',
        en: 'Illustrative example — live figures are on the comparison page.',
    },
    cta: { ar: 'قارن الودائع الآن', en: 'Compare deposits now' },
}

export const marketSize = {
    figure: '70+',
    title: {
        ar: 'بنكاً وشركة تمويل مرخصة في المملكة',
        en: 'licensed banks and finance companies in Saudi Arabia',
    },
    note: { ar: 'حجم السوق، وليس عدد شركاء نسبة', en: 'Market size, not the number of Nesbah partners' },
    source: { ar: 'المصدر: البنك المركزي السعودي', en: 'Source: Saudi Central Bank (SAMA)' },
    links: [
        { ar: 'البنوك المرخصة', en: 'Licensed banks', href: 'https://www.sama.gov.sa/en-us/licenseentities/pages/licensedbanks.aspx' },
        { ar: 'شركات التمويل', en: 'Finance companies', href: 'https://www.sama.gov.sa/en-US/LicenseEntities/Pages/FinanceLicencedEntities.aspx' },
    ],
}

export const howItWorks = {
    eyebrow: { ar: 'كيف يعمل', en: 'How it works' },
    title: { ar: 'من احتياج منشأتك إلى طلب جاهز', en: 'From your need to a ready application' },
    sub: {
        ar: 'بدلًا من التقديم لكل جهة على حدة، ابدأ بطلب واحد عبر نسبة.',
        en: 'Instead of walking each bank yourself, let us do the work for you.',
    },
    steps: [
        {
            n: { ar: '٠١', en: '01' }, icon: Building2,
            title: { ar: 'عرّفنا على منشأتك', en: 'Tell us about your business' },
            desc: { ar: 'أخبرنا عن نشاط منشأتك واحتياجاتها — نموذج مختصر وواضح.', en: 'Tell us about your activity and needs — a short, clear form.' },
        },
        {
            n: { ar: '٠٢', en: '02' }, icon: FileText,
            title: { ar: 'حدّد احتياجك التمويلي', en: 'Define your financing need' },
            desc: { ar: 'اختر نوع التمويل والمبلغ والمدة المناسبة، ثم أرسل طلبك.', en: 'Choose the type, amount and term, then submit your request.' },
        },
        {
            n: { ar: '٠٣', en: '03' }, icon: CheckCircle2,
            title: { ar: 'تابع من حسابك', en: 'Track from your account' },
            desc: { ar: 'تابع حالة طلبك وتواصل مع جهات التمويل من لوحة واحدة.', en: 'Follow your request and talk to providers from one dashboard.' },
        },
    ],
}

export const whyNesbah = {
    eyebrow: { ar: 'لماذا نسبة', en: 'Why Nesbah' },
    title: {
        ar: 'وضوح أكبر. خطوات أقل. وقرارك بيدك.',
        en: 'Designed to give you clarity, not comparison fatigue.',
    },
    cta: { ar: 'ابدأ الآن', en: 'Get started' },
    items: [
        { icon: FileText, title: { ar: 'طلب واحد، عدة جهات', en: 'One request, multiple providers' }, desc: { ar: 'بدلًا من التقديم لكل جهة على حدة، قدّم طلبًا واحدًا ونعرضه على عدة جهات مرخصة.', en: 'Skip applying at every bank — apply once and we share your request with multiple providers.' } },
        { icon: DollarSign, title: { ar: 'مجانًا بالكامل', en: 'Completely free' }, desc: { ar: 'خدمة نسبة مجانية لأصحاب المنشآت. لا رسوم ولا التزامات.', en: 'Nesbah is entirely free. No hidden fees, no obligations.' } },
        { icon: Shield, title: { ar: 'جهات مرخصة فقط', en: 'Licensed lenders only' }, desc: { ar: 'نتعامل حصرًا مع بنوك وشركات تمويل مرخصة في المملكة.', en: 'We work exclusively with licensed banks and finance companies in the Kingdom.' } },
        { icon: Lock, title: { ar: 'سرية تامة', en: 'Full confidentiality' }, desc: { ar: 'بياناتك محمية ولا تُشارك إلا بموافقتك.', en: 'Your data is protected and shared only with your consent.' } },
        { icon: Zap, title: { ar: 'متابعة نشطة', en: 'Active follow-up' }, desc: { ar: 'نتابع طلبك مع الجهات المشاركة.', en: 'Our team follows up on your request with participating providers.' } },
        { icon: CheckCircle2, title: { ar: 'القرار بيدك', en: 'No obligation' }, desc: { ar: 'راجع أي خيار قد تشاركه إحدى الجهات وقرّر ما يناسب منشأتك.', en: 'Review any option a provider may share and choose what suits you.' } },
    ],
}

export const financingTypesSection = {
    eyebrow: { ar: 'أنواع التمويل', en: 'Financing types' },
    title: {
        ar: 'حلول تمويل تناسب احتياجات منشأتك',
        en: 'Diverse solutions for every stage of your growth',
    },
    sub: {
        ar: 'من رأس المال العامل إلى تمويل المعدات والعقار التجاري، استكشف الحل الأنسب لاحتياج منشأتك.',
        en: 'From working capital to commercial real estate — we cover the essentials.',
    },
    learnMore: { ar: 'تعرّف أكثر', en: 'Learn more' },
    contactUs: { ar: 'تواصل معنا', en: 'Talk to us' },
    // slug = OUR indexed product URL, not the reference's /product/<code>.
    types: [
        { icon: Building2, code: 'corporate', slug: '/business-financing', title: { ar: 'تمويل الشركات', en: 'Corporate Financing' }, desc: { ar: 'حلول تمويلية شاملة لدعم نمو منشأتك', en: 'Comprehensive solutions to grow your business.' } },
        { icon: Banknote, code: 'working_capital', slug: '/working-capital-financing', title: { ar: 'رأس المال العامل', en: 'Working Capital' }, desc: { ar: 'سيولة تدعم التشغيل اليومي', en: 'Liquidity for day-to-day operations.' } },
        { icon: TrendingUp, code: 'expansion', slug: '/expansion-financing', title: { ar: 'تمويل التوسع والنمو', en: 'Growth & Expansion' }, desc: { ar: 'لدعم مراحل التوسع وزيادة الطاقة', en: 'For scaling and maturing companies.' } },
        { icon: Cog, code: 'equipment', slug: '/equipment-financing', title: { ar: 'تمويل المعدات', en: 'Equipment Financing' }, desc: { ar: 'لاقتناء أصول تشغيلية جديدة', en: 'New operational assets.' } },
        { icon: FolderKanban, code: 'project', slug: '/project-financing', title: { ar: 'تمويل المشاريع', en: 'Project Financing' }, desc: { ar: 'لتنفيذ العقود والمشاريع', en: 'Execute contracts and projects.' } },
        { icon: Building, code: 'commercial_real_estate', slug: '/real-estate-project-financing', title: { ar: 'التمويل العقاري التجاري', en: 'Commercial Real Estate' }, desc: { ar: 'لتمويل المقرات والمنشآت التجارية', en: 'Offices and commercial premises.' } },
        { icon: CreditCard, code: 'pos', slug: '/pos-financing', title: { ar: 'تمويل نقاط البيع', en: 'POS Financing' }, desc: { ar: 'بناءً على مبيعاتك اليومية', en: 'Based on your daily sales.' } },
        { icon: Sparkles, code: null, slug: '/contact', title: { ar: 'احتياج آخر؟', en: 'Something else?' }, desc: { ar: 'تواصل معنا لمناقشة الحل الأنسب', en: 'Talk to us for a tailored solution.' } },
    ],
}

export const audienceSection = {
    eyebrow: { ar: 'من يستفيد', en: 'Who benefits' },
    title: {
        ar: 'حلول تمويلية لمختلف مراحل نمو الأعمال في السعودية.',
        en: 'Built for everyone building in Saudi Arabia.',
    },
    items: [
        { icon: Store, title: { ar: 'الشركات الصغيرة والمتوسطة', en: 'SMEs' }, desc: { ar: 'لتنمية الأعمال أو تغطية الاحتياجات التشغيلية.', en: 'For business growth or operational needs.' } },
        { icon: Rocket, title: { ar: 'الشركات الناشئة', en: 'Startups' }, desc: { ar: 'لبدء المشروع أو التوسع في مراحله الأولى.', en: 'Launch or expand in early stages.' } },
        { icon: HardHat, title: { ar: 'المقاولون وأصحاب المشاريع', en: 'Contractors' }, desc: { ar: 'لتنفيذ عقود ومشاريع جديدة.', en: 'Execute new contracts and projects.' } },
        { icon: ShoppingBag, title: { ar: 'قطاع التجزئة والخدمات', en: 'Retail & Services' }, desc: { ar: 'للسيولة السريعة وتمويل نقاط البيع.', en: 'Quick liquidity and POS financing.' } },
    ],
}

export const faqSection = {
    eyebrow: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
    title: {
        ar: 'كل ما تحتاج معرفته قبل تقديم طلبك',
        en: 'Everything you need to know before applying',
    },
    items: [
        { q: { ar: 'هل خدمة نسبة مجانية؟', en: 'Is Nesbah really free?' }, a: { ar: 'نعم، خدمة نسبة مجانية بالكامل. لا نفرض أي رسوم على تقديم الطلب أو مراجعة أي خيارات تمويل قد تشاركها إحدى الجهات.', en: 'Yes, Nesbah is completely free. There are no fees to submit your request or review any financing options that a provider may share.' } },
        { q: { ar: 'هل نسبة جهة تمويل؟', en: 'Is Nesbah a lender?' }, a: { ar: 'لا. نسبة ليست بنكاً ولا شركة تمويل، ولا تتخذ أي قرار ائتماني. دورنا هو تسهيل وصول طلبك إلى الجهات المرخصة.', en: 'No. Nesbah is not a bank or finance company and does not make any credit decisions. Our role is to route your request to licensed financing providers.' } },
        { q: { ar: 'كيف تحمون بياناتي؟', en: 'How do you protect my data?' }, a: { ar: 'بياناتك محمية ولا تُشارك إلا مع جهات التمويل المشاركة وبموافقتك الصريحة، وفقاً لسياسة الخصوصية.', en: 'Your data is protected and only shared with participating lenders after your explicit consent, per the Privacy Policy.' } },
        { q: { ar: 'متى يتم التواصل معي؟', en: 'When will I be contacted?' }, a: { ar: 'نتابع طلبك مع الجهات المشاركة بأسرع وقت ممكن. تختلف مدة الرد من جهة لأخرى بحسب سياساتها.', en: "We follow up on your request with participating providers as quickly as possible. Response time varies by each provider's policies." } },
        { q: { ar: 'هل يمكنني رفض أي خيار يُشارَك معي؟', en: 'Can I decline an option a provider shares?' }, a: { ar: 'بالتأكيد. لا يوجد أي التزام. إذا قررت إحدى الجهات مشاركة خيار تمويلي، يمكنك مراجعته واختيار ما يناسبك أو رفضه.', en: "If a provider shares an option, there's no obligation. You can review it and choose what suits you or decline it." } },
        { q: { ar: 'ما أنواع التمويل المتاحة؟', en: 'What types of financing are available?' }, a: { ar: 'تمويل الشركات، رأس المال العامل، التوسع، المعدات، المشاريع، العقاري التجاري، ونقاط البيع.', en: 'Corporate, working capital, expansion, equipment, projects, commercial real estate, and POS financing.' } },
        { q: { ar: 'هل تتعاملون مع جهات مرخصة فقط؟', en: 'Do you only work with licensed lenders?' }, a: { ar: 'نعم. نتعامل حصرًا مع بنوك وشركات تمويل مرخصة في المملكة العربية السعودية.', en: 'Yes, exclusively with banks and finance companies licensed in the Kingdom of Saudi Arabia.' } },
    ],
}

export const finalCta = {
    titlePrefix: { ar: 'قدّم طلبك لعرضه على ', en: 'Submit your request to reach ' },
    titleAccent: { ar: 'جهات تمويل مرخصة', en: 'licensed financing providers' },
    sub: {
        ar: 'قرار التمويل يعود لكل جهة. الخدمة مجانية وبدون التزام.',
        en: 'Each provider makes its own decision. The service is free with no obligation.',
    },
    ctaPrimary: { ar: 'قدّم طلبك الآن', en: 'Apply now' },
    ctaSecondary: { ar: 'تواصل معنا', en: 'Contact us' },
}

export const footer = {
    blurb: {
        ar: 'نسبة — منصة سعودية تسهّل وصول طلب منشأتك إلى جهات تمويل مرخصة.',
        en: 'Nesbah — a Saudi platform that routes your business financing request to licensed providers.',
    },
    disclaimer: {
        ar: 'نسبة ليست جهة تمويل ولا تتخذ قرارات ائتمانية. جميع قرارات التمويل تصدر عن الجهات المرخصة المشاركة.',
        en: 'Nesbah is not a lender and does not make credit decisions. All financing decisions are made by the participating licensed providers.',
    },
    whatsapp: { ar: 'تواصل عبر واتساب', en: 'Chat on WhatsApp' },
    email: 'info@nesbah.com.sa',
    companyHeading: { ar: 'الشركة', en: 'Company' },
    financingHeading: { ar: 'التمويل', en: 'Financing' },
    legalHeading: { ar: 'قانوني', en: 'Legal' },
    companyLinks: [
        { ar: 'عن نسبة', en: 'About Nesbah', to: '/about' },
        { ar: 'تواصل معنا', en: 'Contact us', to: '/contact' },
        { ar: 'دليل التمويل', en: 'Financing guide', to: '/financing-guide' },
        { ar: 'الأسئلة الشائعة', en: 'FAQ', to: '/#faq' },
    ],
    legalLinks: [
        { ar: 'الشروط والأحكام', en: 'Terms & Conditions', to: '/terms' },
        { ar: 'سياسة الخصوصية', en: 'Privacy Policy', to: '/privacy' },
    ],
    rights: { ar: 'نسبة. جميع الحقوق محفوظة.', en: 'Nesbah. All rights reserved.' },
    madeIn: { ar: 'صُنع في المملكة العربية السعودية 🇸🇦', en: 'Made in Saudi Arabia 🇸🇦' },
}
