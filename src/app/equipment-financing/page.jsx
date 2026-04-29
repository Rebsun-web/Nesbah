import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import FinancingPageTemplate from '@/components/public/landing/FinancingPageTemplate'

export const metadata = {
  title: 'تمويل المعدات والأجهزة للشركات في السعودية',
  description: 'احصل على عروض تمويل لشراء المعدات والآلات والأجهزة التي تحتاجها منشأتك. قارن العروض من عدة جهات تمويل مرخصة — مجاناً.',
}

const data = {
  slug: 'equipment-financing',
  heroTitle: { ar: 'تمويل المعدات والأجهزة', en: 'Equipment Financing' },
  heroSub: { ar: 'موّل شراء المعدات والأجهزة اللازمة لنشاطك — قارن العروض بسهولة.', en: 'Finance the equipment your business needs — compare offers easily.' },
  introTitle: { ar: 'ما هو تمويل المعدات؟', en: 'What Is Equipment Financing?' },
  introText: { ar: 'تمويل المعدات يساعد الشركات على شراء أو تأجير المعدات والأجهزة اللازمة لتطوير أعمالها دون الحاجة لدفع المبلغ كاملاً مقدماً. يشمل ذلك معدات التصنيع، الأجهزة التقنية، المركبات التجارية، وغيرها.', en: 'Equipment financing helps businesses purchase or lease the equipment needed for development without paying the full amount upfront. This includes manufacturing equipment, technology, commercial vehicles, and more.' },
  whoTitle: { ar: 'من يحتاج تمويل المعدات؟', en: 'Who Needs Equipment Financing?' },
  whoItems: [
    { ar: 'المصانع ومنشآت التصنيع', en: 'Factories and manufacturing facilities' },
    { ar: 'شركات النقل والخدمات اللوجستية', en: 'Transport and logistics companies' },
    { ar: 'المطاعم والمقاهي', en: 'Restaurants and cafes' },
    { ar: 'العيادات والمراكز الطبية', en: 'Clinics and medical centers' },
  ],
  useCasesTitle: { ar: 'حالات استخدام شائعة', en: 'Common Use Cases' },
  useCases: [
    { ar: 'شراء معدات تصنيع جديدة', en: 'Purchasing new manufacturing equipment' },
    { ar: 'تحديث أجهزة تقنية قديمة', en: 'Upgrading outdated technology' },
    { ar: 'شراء مركبات تجارية', en: 'Purchasing commercial vehicles' },
    { ar: 'تجهيز مطبخ أو مرفق جديد', en: 'Setting up a new kitchen or facility' },
  ],
  whyNesbahTitle: { ar: 'لماذا تستخدم نسبة لتمويل المعدات؟', en: 'Why Use Nesbah for Equipment Financing?' },
  whyNesbahItems: [
    { title: { ar: 'عروض مخصصة', en: 'Tailored offers' }, desc: { ar: 'عروض مصممة حسب نوع المعدات المطلوبة.', en: 'Offers designed for your specific equipment needs.' } },
    { title: { ar: 'مرونة في السداد', en: 'Flexible repayment' }, desc: { ar: 'قارن خطط السداد المختلفة.', en: 'Compare different repayment plans.' } },
    { title: { ar: 'خدمة مجانية', en: 'Free service' }, desc: { ar: 'لا رسوم على الشركات.', en: 'No fees for businesses.' } },
  ],
  faqTitle: { ar: 'أسئلة شائعة عن تمويل المعدات', en: 'Equipment Financing FAQ' },
  faqs: [
    { q: { ar: 'هل يمكن تمويل معدات مستعملة؟', en: 'Can used equipment be financed?' }, a: { ar: 'بعض جهات التمويل تقدم تمويلاً للمعدات الجديدة والمستعملة. ستتمكن من مقارنة الخيارات عبر نسبة.', en: 'Some lenders finance both new and used equipment. You can compare options through Nesbah.' } },
    { q: { ar: 'ما هي فترات السداد المتاحة؟', en: 'What repayment periods are available?' }, a: { ar: 'تختلف فترات السداد حسب جهة التمويل ونوع المعدات. عادةً ما تتراوح بين سنة وخمس سنوات.', en: 'Repayment periods vary by lender and equipment type, typically ranging from one to five years.' } },
  ],
  relatedTitle: { ar: 'أنواع تمويل ذات صلة', en: 'Related Financing Types' },
  relatedSlugs: ['business-financing', 'project-financing', 'working-capital-financing'],
}

export default function EquipmentFinancingPage() {
  return (
    <PublicLanguageProvider>
      <FinancingPageTemplate data={data} />
    </PublicLanguageProvider>
  )
}
