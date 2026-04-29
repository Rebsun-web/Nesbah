import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import FinancingPageTemplate from '@/components/public/landing/FinancingPageTemplate'

export const metadata = {
  title: 'تمويل الشركات في السعودية — قارن عروض من عدة جهات مجاناً | نسبة',
  description: 'احصل على عروض تمويل لشركتك من بنوك وشركات تمويل مرخصة بطلب واحد. نسبة تساعدك في مقارنة الخيارات واختيار الأنسب — مجاناً وبدون التزام.',
}

const data = {
  slug: 'business-financing',
  heroTitle: { ar: 'تمويل الشركات', en: 'Business Financing' },
  heroSub: { ar: 'احصل على عروض تمويل من عدة جهات لشركتك بطلب واحد — مجاناً.', en: 'Receive financing offers from multiple providers for your business with one request — free.' },
  introTitle: { ar: 'ما هو تمويل الشركات؟', en: 'What Is Business Financing?' },
  introText: { ar: 'تمويل الشركات يوفر لأصحاب الأعمال السيولة اللازمة لتنمية أنشطتهم التجارية، سواء لتغطية المصاريف التشغيلية أو التوسع أو شراء المعدات. من خلال نسبة، يمكنك الوصول لعروض متعددة من بنوك وشركات تمويل مرخصة ومقارنتها بسهولة.', en: 'Business financing provides entrepreneurs with the liquidity needed to grow their operations, whether for covering operational costs, expanding, or purchasing equipment. Through Nesbah, you can access and easily compare multiple offers from licensed banks and financing companies.' },
  whoTitle: { ar: 'من يستفيد من تمويل الشركات؟', en: 'Who Benefits from Business Financing?' },
  whoItems: [
    { ar: 'المنشآت الصغيرة والمتوسطة', en: 'Small and medium enterprises' },
    { ar: 'الشركات الناشئة في مرحلة النمو', en: 'Startups in growth stage' },
    { ar: 'أصحاب المشاريع التجارية', en: 'Commercial project owners' },
    { ar: 'التجار وأصحاب المتاجر', en: 'Merchants and retailers' },
  ],
  useCasesTitle: { ar: 'حالات استخدام شائعة', en: 'Common Use Cases' },
  useCases: [
    { ar: 'تمويل رأس المال العامل لتغطية المصاريف اليومية', en: 'Working capital to cover daily expenses' },
    { ar: 'شراء معدات وأجهزة جديدة', en: 'Purchasing new equipment' },
    { ar: 'فتح فروع جديدة أو التوسع', en: 'Opening new branches or expanding' },
    { ar: 'تمويل مشاريع كبيرة أو عقود', en: 'Financing large projects or contracts' },
  ],
  whyNesbahTitle: { ar: 'لماذا تستخدم نسبة لتمويل شركتك؟', en: 'Why Use Nesbah for Business Financing?' },
  whyNesbahItems: [
    { title: { ar: 'طلب واحد — عروض متعددة', en: 'One request — multiple offers' }, desc: { ar: 'قدّم طلباً واحداً واحصل على عروض من عدة جهات تمويل.', en: 'Submit one request and receive offers from multiple lenders.' } },
    { title: { ar: 'مجاني بالكامل', en: 'Completely free' }, desc: { ar: 'لا توجد رسوم على الشركات.', en: 'No fees for businesses.' } },
    { title: { ar: 'مقارنة سهلة', en: 'Easy comparison' }, desc: { ar: 'قارن العروض واختر الأنسب لشركتك.', en: 'Compare offers and choose what fits your business.' } },
  ],
  faqTitle: { ar: 'أسئلة شائعة عن تمويل الشركات', en: 'Business Financing FAQ' },
  faqs: [
    { q: { ar: 'ما هي أنواع التمويل المتاحة للشركات؟', en: 'What types of financing are available?' }, a: { ar: 'تشمل تمويل رأس المال العامل، تمويل التوسع، تمويل المعدات، تمويل المشاريع، التمويل العقاري التجاري، وتمويل نقاط البيع.', en: 'Includes working capital, expansion, equipment, project, commercial real estate, and POS financing.' } },
    { q: { ar: 'هل الخدمة مجانية؟', en: 'Is the service free?' }, a: { ar: 'نعم، الخدمة مجانية بالكامل للشركات.', en: 'Yes, the service is completely free for businesses.' } },
    { q: { ar: 'كم يستغرق الحصول على عروض؟', en: 'How long to receive offers?' }, a: { ar: 'تبدأ العروض بالوصول عادةً خلال فترة قصيرة من اكتمال طلبك.', en: 'Offers typically arrive shortly after completing your request.' } },
  ],
  relatedTitle: { ar: 'أنواع تمويل ذات صلة', en: 'Related Financing Types' },
  relatedSlugs: ['working-capital-financing', 'expansion-financing', 'equipment-financing', 'pos-financing'],
}

export default function BusinessFinancingPage() {
  return (
    <PublicLanguageProvider>
      <FinancingPageTemplate data={data} />
    </PublicLanguageProvider>
  )
}
