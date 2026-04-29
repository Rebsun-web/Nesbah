import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import FinancingPageTemplate from '@/components/public/landing/FinancingPageTemplate'

export const metadata = {
  title: 'تمويل التوسع والنمو للشركات في السعودية',
  description: 'تخطط لفتح فرع جديد أو التوسع؟ قارن عروض تمويل التوسع من بنوك وشركات تمويل مرخصة عبر نسبة — مجاناً وبدون التزام.',
}

const data = {
  slug: 'expansion-financing',
  heroTitle: { ar: 'تمويل التوسع والنمو', en: 'Expansion Financing' },
  heroSub: { ar: 'موّل خطط التوسع لشركتك — قارن عروض متعددة من بنوك وشركات تمويل.', en: 'Finance your business expansion plans — compare multiple offers from banks and lenders.' },
  introTitle: { ar: 'ما هو تمويل التوسع؟', en: 'What Is Expansion Financing?' },
  introText: { ar: 'تمويل التوسع يساعد الشركات على تنفيذ خطط النمو مثل فتح فروع جديدة، دخول أسواق إضافية، أو زيادة الطاقة الإنتاجية. من خلال نسبة، يمكنك مقارنة عروض التمويل واختيار الأنسب لمرحلة نمو شركتك.', en: 'Expansion financing helps businesses execute growth plans such as opening new branches, entering new markets, or increasing production capacity. Through Nesbah, you can compare financing offers and choose the best fit for your company\'s growth stage.' },
  whoTitle: { ar: 'من يحتاج تمويل التوسع؟', en: 'Who Needs Expansion Financing?' },
  whoItems: [
    { ar: 'الشركات التي تخطط لفتح فروع جديدة', en: 'Companies planning to open new branches' },
    { ar: 'المنشآت الراغبة في دخول أسواق جديدة', en: 'Businesses wanting to enter new markets' },
    { ar: 'الشركات التي تحتاج زيادة طاقتها الإنتاجية', en: 'Companies needing to increase production capacity' },
    { ar: 'أصحاب الامتيازات التجارية', en: 'Franchise owners' },
  ],
  useCasesTitle: { ar: 'حالات استخدام شائعة', en: 'Common Use Cases' },
  useCases: [
    { ar: 'فتح فرع جديد في مدينة أخرى', en: 'Opening a new branch in another city' },
    { ar: 'توسيع خطوط الإنتاج', en: 'Expanding production lines' },
    { ar: 'توظيف فريق عمل إضافي', en: 'Hiring additional staff' },
    { ar: 'تطوير البنية التحتية الرقمية', en: 'Developing digital infrastructure' },
  ],
  whyNesbahTitle: { ar: 'لماذا تستخدم نسبة لتمويل التوسع؟', en: 'Why Use Nesbah for Expansion Financing?' },
  whyNesbahItems: [
    { title: { ar: 'خيارات متنوعة', en: 'Diverse options' }, desc: { ar: 'اطلع على عروض من جهات تمويل مختلفة.', en: 'View offers from different financing providers.' } },
    { title: { ar: 'توفير الوقت', en: 'Save time' }, desc: { ar: 'بدلاً من التواصل مع كل جهة منفردة.', en: 'Instead of contacting each provider individually.' } },
    { title: { ar: 'مقارنة شفافة', en: 'Transparent comparison' }, desc: { ar: 'قارن الشروط والأرباح بسهولة.', en: 'Compare terms and rates easily.' } },
  ],
  faqTitle: { ar: 'أسئلة شائعة عن تمويل التوسع', en: 'Expansion Financing FAQ' },
  faqs: [
    { q: { ar: 'ما المبلغ الذي يمكنني الحصول عليه لتمويل التوسع؟', en: 'How much can I get for expansion financing?' }, a: { ar: 'يعتمد المبلغ على حجم شركتك وتاريخها المالي. من خلال نسبة ستتلقى عروضاً مختلفة بمبالغ متنوعة.', en: 'The amount depends on your company size and financial history. Through Nesbah, you\'ll receive different offers with various amounts.' } },
    { q: { ar: 'هل أحتاج ضمانات للحصول على تمويل التوسع؟', en: 'Do I need collateral for expansion financing?' }, a: { ar: 'يختلف ذلك حسب جهة التمويل. بعض الجهات تقدم تمويلاً بدون ضمانات.', en: 'It varies by lender. Some offer financing without collateral.' } },
  ],
  relatedTitle: { ar: 'أنواع تمويل ذات صلة', en: 'Related Financing Types' },
  relatedSlugs: ['business-financing', 'equipment-financing', 'real-estate-project-financing'],
}

export default function ExpansionFinancingPage() {
  return (
    <PublicLanguageProvider>
      <FinancingPageTemplate data={data} />
    </PublicLanguageProvider>
  )
}
