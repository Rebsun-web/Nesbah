import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import Navbar from '@/components/public/landing/Navbar'
import {
  Hero, DepositsPromo, MarketSize, HowItWorks, WhyNesbah,
  FinancingTypes, Audience, FAQ, FinalCTA,
} from '@/components/public/landing/HomeSections'
import Footer from '@/components/public/landing/Footer'
import WhatsAppButton from '@/components/public/landing/WhatsAppButton'

export const metadata = {
  title: 'تمويل الشركات في السعودية — قارن عروض التمويل مجاناً | نسبة',
  description:
    'قدّم طلب تمويل واحد واحصل على عروض من بنوك وشركات تمويل مرخصة في السعودية. نسبة منصة مجانية تساعد الشركات في مقارنة عروض التمويل واختيار الأنسب.',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'هل نسبة جهة تمويل؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'لا، نسبة ليست جهة تمويل. نحن منصة تساعد الشركات على الوصول إلى عروض من البنوك وشركات التمويل المرخصة.',
      },
    },
    {
      '@type': 'Question',
      name: 'هل الخدمة مجانية للشركات؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'نعم، الخدمة مجانية بالكامل للشركات. لا توجد رسوم لتقديم الطلبات أو مقارنة العروض.',
      },
    },
    {
      '@type': 'Question',
      name: 'هل أنا ملزم بقبول أي عرض بعد التقديم؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'لا، تقديم الطلب لا يلزمك بقبول أي عرض. يمكنك مراجعة العروض واتخاذ القرار المناسب لك.',
      },
    },
    {
      '@type': 'Question',
      name: 'ما أنواع التمويل التي يمكن طلبها عبر نسبة؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'يمكنك طلب أنواع متعددة تشمل: تمويل الشركات، رأس المال العامل، التوسع، المعدات، المشاريع، العقارات التجارية، وتمويل نقاط البيع.',
      },
    },
    {
      '@type': 'Question',
      name: 'كيف أختار العرض المناسب؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'بعد استلام العروض، يمكنك مقارنتها واختيار الأنسب بناءً على احتياجات منشأتك وظروفها.',
      },
    },
    {
      '@type': 'Question',
      name: 'هل بياناتي تُشارك مع جميع الجهات؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'يتم مشاركة طلبك مع الجهات ذات الصلة لمساعدتك على الوصول إلى خيارات التمويل المناسبة.',
      },
    },
    {
      '@type': 'Question',
      name: 'كم من الوقت يستغرق تقديم الطلب؟',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'تقديم الطلب يستغرق وقتاً قصيراً، والنموذج مصمم ليكون واضحاً وسهل الاستخدام قدر الإمكان.',
      },
    },
  ],
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: 'نسبة',
  alternateName: 'Nesbah',
  url: 'https://nesbah.com.sa',
  description: 'منصة سعودية تربط الشركات بجهات التمويل لمقارنة العروض واختيار الأنسب',
  areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
  serviceType: 'Financial Aggregation',
  priceRange: 'Free',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Riyadh',
    addressCountry: 'SA',
  },
  email: 'info@nesbah.com.sa',
  sameAs: ['https://www.linkedin.com/company/nesbah'],
}

export default function Home() {
  return (
    <PublicLanguageProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <DepositsPromo />
        <MarketSize />
        <HowItWorks />
        <WhyNesbah />
        <FinancingTypes />
        <Audience />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </PublicLanguageProvider>
  )
}
