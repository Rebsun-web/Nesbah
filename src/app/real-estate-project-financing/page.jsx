import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import FinancingPageTemplate from '@/components/public/landing/FinancingPageTemplate'

export const metadata = {
  title: 'التمويل العقاري التجاري للشركات في السعودية | نسبة',
  description: 'قارن عروض التمويل العقاري التجاري لشراء أو تطوير العقارات لمنشأتك. عروض من عدة جهات تمويل مرخصة — مجاناً وبدون التزام.',
}

const data = {
  slug: 'real-estate-project-financing',
  heroTitle: { ar: 'تمويل المشاريع العقارية', en: 'Real Estate Project Financing' },
  heroSub: { ar: 'موّل مشاريعك العقارية التجارية — قارن عروض من جهات تمويل متعددة.', en: 'Finance your commercial real estate projects — compare offers from multiple lenders.' },
  introTitle: { ar: 'ما هو تمويل المشاريع العقارية؟', en: 'What Is Real Estate Project Financing?' },
  introText: { ar: 'يوفر التمويل العقاري التجاري السيولة اللازمة لشراء أو تأجير أو تطوير العقارات التجارية مثل المكاتب، المستودعات، المعارض، والمرافق التجارية. من خلال نسبة، يمكنك مقارنة عروض التمويل العقاري من عدة جهات.', en: 'Commercial real estate financing provides the liquidity needed to purchase, lease, or develop commercial properties such as offices, warehouses, showrooms, and commercial facilities. Through Nesbah, you can compare real estate financing offers from multiple providers.' },
  whoTitle: { ar: 'من يحتاج تمويل المشاريع العقارية؟', en: 'Who Needs Real Estate Financing?' },
  whoItems: [
    { ar: 'شركات التطوير العقاري', en: 'Real estate development companies' },
    { ar: 'الشركات التي تحتاج مقرات جديدة', en: 'Companies needing new premises' },
    { ar: 'المستثمرون العقاريون التجاريون', en: 'Commercial real estate investors' },
    { ar: 'أصحاب المشاريع التجارية الكبرى', en: 'Large commercial project owners' },
  ],
  useCasesTitle: { ar: 'حالات استخدام شائعة', en: 'Common Use Cases' },
  useCases: [
    { ar: 'شراء مقر تجاري جديد', en: 'Purchasing a new commercial property' },
    { ar: 'تطوير مشروع عقاري تجاري', en: 'Developing a commercial real estate project' },
    { ar: 'تمويل بناء مستودع أو مصنع', en: 'Financing warehouse or factory construction' },
    { ar: 'شراء أرض تجارية', en: 'Purchasing commercial land' },
  ],
  whyNesbahTitle: { ar: 'لماذا تستخدم نسبة للتمويل العقاري؟', en: 'Why Use Nesbah for Real Estate Financing?' },
  whyNesbahItems: [
    { title: { ar: 'جهات متخصصة', en: 'Specialized providers' }, desc: { ar: 'نربطك بجهات تمويل عقاري تجاري.', en: 'We connect you with commercial real estate lenders.' } },
    { title: { ar: 'مبالغ تمويل كبيرة', en: 'Large financing amounts' }, desc: { ar: 'احصل على عروض تغطي احتياجاتك العقارية.', en: 'Get offers that cover your real estate needs.' } },
    { title: { ar: 'مقارنة سهلة', en: 'Easy comparison' }, desc: { ar: 'قارن شروط التمويل العقاري بسهولة.', en: 'Compare real estate financing terms easily.' } },
  ],
  faqTitle: { ar: 'أسئلة شائعة عن التمويل العقاري', en: 'Real Estate Financing FAQ' },
  faqs: [
    { q: { ar: 'ما هي أنواع العقارات التي يمكن تمويلها؟', en: 'What types of properties can be financed?' }, a: { ar: 'تشمل المكاتب، المستودعات، المصانع، المعارض، والأراضي التجارية.', en: 'Includes offices, warehouses, factories, showrooms, and commercial land.' } },
    { q: { ar: 'هل يتطلب التمويل العقاري ضمانات؟', en: 'Does real estate financing require collateral?' }, a: { ar: 'عادةً ما يكون العقار نفسه ضماناً. تختلف الشروط حسب جهة التمويل.', en: 'Usually the property itself serves as collateral. Terms vary by lender.' } },
  ],
  relatedTitle: { ar: 'أنواع تمويل ذات صلة', en: 'Related Financing Types' },
  relatedSlugs: ['project-financing', 'business-financing', 'expansion-financing'],
}

export default function RealEstateFinancingPage() {
  return (
    <PublicLanguageProvider>
      <FinancingPageTemplate data={data} />
    </PublicLanguageProvider>
  )
}
