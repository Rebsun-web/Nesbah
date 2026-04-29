import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import FinancingPageTemplate from '@/components/public/landing/FinancingPageTemplate'

export const metadata = {
  title: 'تمويل المشاريع في السعودية — عروض من عدة جهات',
  description: 'تمويل مخصص للمشاريع الكبيرة والعقود. قارن عروض تمويل المشاريع من بنوك وشركات تمويل مرخصة عبر نسبة — مجاناً وبدون التزام.',
}

const data = {
  slug: 'project-financing',
  heroTitle: { ar: 'تمويل المشاريع', en: 'Project Financing' },
  heroSub: { ar: 'موّل مشاريعك الكبيرة والعقود — قارن عروض من بنوك وشركات تمويل متعددة.', en: 'Finance your large projects and contracts — compare offers from multiple banks and lenders.' },
  introTitle: { ar: 'ما هو تمويل المشاريع؟', en: 'What Is Project Financing?' },
  introText: { ar: 'تمويل المشاريع مخصص للمنشآت التي تعمل على مشاريع كبيرة مثل عقود البناء، المشاريع الحكومية، أو المشاريع التجارية الكبرى. يوفر هذا النوع من التمويل السيولة اللازمة لتنفيذ المشروع حتى اكتماله.', en: 'Project financing is designed for businesses working on large projects such as construction contracts, government projects, or major commercial ventures. This type of financing provides the liquidity needed to execute the project through completion.' },
  whoTitle: { ar: 'من يحتاج تمويل المشاريع؟', en: 'Who Needs Project Financing?' },
  whoItems: [
    { ar: 'شركات المقاولات والبناء', en: 'Construction and contracting companies' },
    { ar: 'الشركات المنفذة للعقود الحكومية', en: 'Companies executing government contracts' },
    { ar: 'شركات التطوير العقاري', en: 'Real estate development companies' },
    { ar: 'الشركات الصناعية', en: 'Industrial companies' },
  ],
  useCasesTitle: { ar: 'حالات استخدام شائعة', en: 'Common Use Cases' },
  useCases: [
    { ar: 'تمويل تنفيذ عقد حكومي', en: 'Financing government contract execution' },
    { ar: 'تمويل مشروع بناء تجاري', en: 'Financing commercial construction' },
    { ar: 'تغطية تكاليف المشروع حتى استلام الدفعات', en: 'Covering project costs until payments arrive' },
    { ar: 'تمويل مراحل تنفيذ مشروع كبير', en: 'Financing phases of a large project' },
  ],
  whyNesbahTitle: { ar: 'لماذا تستخدم نسبة لتمويل المشاريع؟', en: 'Why Use Nesbah for Project Financing?' },
  whyNesbahItems: [
    { title: { ar: 'جهات تمويل متخصصة', en: 'Specialized lenders' }, desc: { ar: 'نربطك بجهات تمويل متخصصة في تمويل المشاريع.', en: 'We connect you with lenders specialized in project financing.' } },
    { title: { ar: 'عروض تنافسية', en: 'Competitive offers' }, desc: { ar: 'قارن عدة عروض للحصول على أفضل الشروط.', en: 'Compare multiple offers to get the best terms.' } },
    { title: { ar: 'عملية سريعة', en: 'Fast process' }, desc: { ar: 'وفّر الوقت بتقديم طلب واحد بدلاً من عدة طلبات.', en: 'Save time by submitting one request instead of many.' } },
  ],
  faqTitle: { ar: 'أسئلة شائعة عن تمويل المشاريع', en: 'Project Financing FAQ' },
  faqs: [
    { q: { ar: 'ما الفرق بين تمويل المشاريع وتمويل الشركات؟', en: "What's the difference from business financing?" }, a: { ar: 'تمويل المشاريع مخصص لمشروع محدد، بينما تمويل الشركات يغطي الاحتياجات العامة للمنشأة.', en: 'Project financing is for a specific project, while business financing covers general business needs.' } },
    { q: { ar: 'هل يمكن تمويل مشاريع بأحجام مختلفة؟', en: 'Can projects of different sizes be financed?' }, a: { ar: 'نعم، جهات التمويل تقدم حلولاً لمشاريع بأحجام ومبالغ متنوعة.', en: 'Yes, lenders offer solutions for projects of various sizes and amounts.' } },
  ],
  relatedTitle: { ar: 'أنواع تمويل ذات صلة', en: 'Related Financing Types' },
  relatedSlugs: ['business-financing', 'real-estate-project-financing', 'equipment-financing'],
}

export default function ProjectFinancingPage() {
  return (
    <PublicLanguageProvider>
      <FinancingPageTemplate data={data} />
    </PublicLanguageProvider>
  )
}
