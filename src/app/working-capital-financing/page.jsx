import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import FinancingPageTemplate from '@/components/public/landing/FinancingPageTemplate'

export const metadata = {
  title: 'تمويل رأس المال العامل للشركات في السعودية',
  description: 'قارن عروض تمويل رأس المال العامل من عدة جهات تمويل مرخصة. غطِّ مصاريفك التشغيلية وحسّن التدفق النقدي لمنشأتك — الخدمة مجانية بالكامل.',
}

const data = {
  slug: 'working-capital-financing',
  heroTitle: { ar: 'تمويل رأس المال العامل', en: 'Working Capital Financing' },
  heroSub: { ar: 'احصل على السيولة اللازمة لتشغيل أعمالك اليومية — قارن عروض متعددة بطلب واحد.', en: 'Get the liquidity you need for daily operations — compare multiple offers with one request.' },
  introTitle: { ar: 'ما هو تمويل رأس المال العامل؟', en: 'What Is Working Capital Financing?' },
  introText: { ar: 'تمويل رأس المال العامل يوفر لشركتك السيولة اللازمة لتغطية المصاريف التشغيلية اليومية مثل الرواتب والمشتريات والإيجارات. يساعدك هذا النوع من التمويل على الحفاظ على استمرارية أعمالك وتحسين التدفق النقدي.', en: 'Working capital financing provides your business with the liquidity needed to cover daily operational expenses such as salaries, purchases, and rent. This type of financing helps maintain business continuity and improve cash flow.' },
  whoTitle: { ar: 'من يحتاج تمويل رأس المال العامل؟', en: 'Who Needs Working Capital Financing?' },
  whoItems: [
    { ar: 'الشركات التي تواجه تحديات في التدفق النقدي', en: 'Companies facing cash flow challenges' },
    { ar: 'المنشآت ذات المبيعات الموسمية', en: 'Businesses with seasonal sales' },
    { ar: 'الشركات في مرحلة النمو السريع', en: 'Companies in rapid growth phase' },
    { ar: 'التجار الذين يحتاجون تغطية مشتريات جديدة', en: 'Merchants needing to cover new purchases' },
  ],
  useCasesTitle: { ar: 'حالات استخدام شائعة', en: 'Common Use Cases' },
  useCases: [
    { ar: 'تغطية الرواتب والمصاريف الشهرية', en: 'Covering salaries and monthly expenses' },
    { ar: 'شراء مخزون إضافي قبل الموسم', en: 'Purchasing extra inventory before peak season' },
    { ar: 'تغطية فجوات التدفق النقدي المؤقتة', en: 'Bridging temporary cash flow gaps' },
    { ar: 'تسديد مدفوعات الموردين', en: 'Paying supplier invoices' },
  ],
  whyNesbahTitle: { ar: 'لماذا تستخدم نسبة لتمويل رأس المال العامل؟', en: 'Why Use Nesbah for Working Capital?' },
  whyNesbahItems: [
    { title: { ar: 'عروض تنافسية', en: 'Competitive offers' }, desc: { ar: 'قارن عروض من عدة جهات واحصل على أفضل الشروط.', en: 'Compare offers from multiple lenders and get the best terms.' } },
    { title: { ar: 'سرعة في الاستجابة', en: 'Fast response' }, desc: { ar: 'استقبل العروض بسرعة بعد تقديم طلبك.', en: 'Receive offers quickly after submitting your request.' } },
    { title: { ar: 'بدون رسوم', en: 'No fees' }, desc: { ar: 'الخدمة مجانية بالكامل للشركات.', en: 'The service is completely free for businesses.' } },
  ],
  faqTitle: { ar: 'أسئلة شائعة عن تمويل رأس المال العامل', en: 'Working Capital Financing FAQ' },
  faqs: [
    { q: { ar: 'ما الفرق بين تمويل رأس المال العامل وأنواع التمويل الأخرى؟', en: "What's the difference from other financing types?" }, a: { ar: 'تمويل رأس المال العامل مخصص لتغطية المصاريف التشغيلية اليومية، بينما الأنواع الأخرى قد تكون لمشاريع محددة أو شراء أصول.', en: 'Working capital financing covers daily operations, while other types may be for specific projects or asset purchases.' } },
    { q: { ar: 'هل يمكن للشركات الصغيرة الحصول على تمويل رأس مال عامل؟', en: 'Can small businesses get working capital financing?' }, a: { ar: 'نعم، العديد من جهات التمويل تقدم حلولاً مخصصة للمنشآت الصغيرة.', en: 'Yes, many lenders offer solutions tailored for small businesses.' } },
  ],
  relatedTitle: { ar: 'أنواع تمويل ذات صلة', en: 'Related Financing Types' },
  relatedSlugs: ['business-financing', 'pos-financing', 'expansion-financing'],
}

export default function WorkingCapitalPage() {
  return (
    <PublicLanguageProvider>
      <FinancingPageTemplate data={data} />
    </PublicLanguageProvider>
  )
}
