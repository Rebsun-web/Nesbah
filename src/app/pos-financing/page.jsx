import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import FinancingPageTemplate from '@/components/public/landing/FinancingPageTemplate'

export const metadata = {
  title: 'تمويل نقاط البيع للشركات في السعودية',
  description: 'احصل على سيولة سريعة بناءً على مبيعات نقاط البيع. قارن عروض تمويل POS من عدة جهات تمويل مرخصة عبر نسبة — مجاناً.',
}

const data = {
  slug: 'pos-financing',
  heroTitle: { ar: 'تمويل نقاط البيع', en: 'POS Financing' },
  heroSub: { ar: 'احصل على سيولة سريعة بناءً على مبيعات نقاط البيع — قارن العروض بسهولة.', en: 'Get quick liquidity based on your POS sales — compare offers easily.' },
  introTitle: { ar: 'ما هو تمويل نقاط البيع؟', en: 'What Is POS Financing?' },
  introText: { ar: 'تمويل نقاط البيع يوفر سيولة سريعة للتجار بناءً على حجم مبيعاتهم عبر أجهزة نقاط البيع. يتميز هذا النوع من التمويل بسرعة الحصول عليه ومرونة السداد المرتبطة بحجم المبيعات.', en: 'POS financing provides quick liquidity for merchants based on their sales volume through point-of-sale devices. This type of financing is characterized by quick access and flexible repayment tied to sales volume.' },
  whoTitle: { ar: 'من يحتاج تمويل نقاط البيع؟', en: 'Who Needs POS Financing?' },
  whoItems: [
    { ar: 'التجار وأصحاب المتاجر', en: 'Merchants and store owners' },
    { ar: 'المطاعم والمقاهي', en: 'Restaurants and cafes' },
    { ar: 'محلات التجزئة', en: 'Retail stores' },
    { ar: 'أي نشاط تجاري يستقبل مدفوعات عبر نقاط البيع', en: 'Any business accepting POS payments' },
  ],
  useCasesTitle: { ar: 'حالات استخدام شائعة', en: 'Common Use Cases' },
  useCases: [
    { ar: 'الحصول على سيولة سريعة لتغطية مصاريف طارئة', en: 'Getting quick cash for emergency expenses' },
    { ar: 'شراء مخزون إضافي قبل المواسم', en: 'Purchasing extra inventory before seasons' },
    { ar: 'تمويل تجديد أو توسيع المتجر', en: 'Financing store renovation or expansion' },
    { ar: 'تغطية فجوات التدفق النقدي', en: 'Covering cash flow gaps' },
  ],
  whyNesbahTitle: { ar: 'لماذا تستخدم نسبة لتمويل نقاط البيع؟', en: 'Why Use Nesbah for POS Financing?' },
  whyNesbahItems: [
    { title: { ar: 'سرعة في الحصول على السيولة', en: 'Quick access to funds' }, desc: { ar: 'تمويل سريع بناءً على مبيعاتك.', en: 'Fast financing based on your sales.' } },
    { title: { ar: 'مقارنة عروض متعددة', en: 'Compare multiple offers' }, desc: { ar: 'احصل على أفضل شروط التمويل.', en: 'Get the best financing terms.' } },
    { title: { ar: 'بدون ضمانات إضافية', en: 'No additional collateral' }, desc: { ar: 'مبيعاتك هي الضمان.', en: 'Your sales are the guarantee.' } },
  ],
  faqTitle: { ar: 'أسئلة شائعة عن تمويل نقاط البيع', en: 'POS Financing FAQ' },
  faqs: [
    { q: { ar: 'كم يمكنني الحصول عليه من تمويل نقاط البيع؟', en: 'How much can I get from POS financing?' }, a: { ar: 'يعتمد المبلغ على حجم مبيعاتك الشهرية عبر نقاط البيع.', en: 'The amount depends on your monthly POS sales volume.' } },
    { q: { ar: 'هل أحتاج حجم مبيعات معين؟', en: 'Do I need a minimum sales volume?' }, a: { ar: 'تختلف المتطلبات حسب جهة التمويل. من خلال نسبة، ستتمكن من مقارنة الشروط المختلفة.', en: 'Requirements vary by lender. Through Nesbah, you can compare different terms.' } },
  ],
  relatedTitle: { ar: 'أنواع تمويل ذات صلة', en: 'Related Financing Types' },
  relatedSlugs: ['working-capital-financing', 'business-financing', 'equipment-financing'],
}

export default function POSFinancingPage() {
  return (
    <PublicLanguageProvider>
      <FinancingPageTemplate data={data} />
    </PublicLanguageProvider>
  )
}
