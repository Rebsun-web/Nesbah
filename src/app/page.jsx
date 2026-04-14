import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import Navbar from '@/components/public/landing/Navbar'
import HeroSection from '@/components/public/landing/HeroSection'
import HowItWorks from '@/components/public/landing/HowItWorks'
import FinancingTypes from '@/components/public/landing/FinancingTypes'
import WhyNesbahSection from '@/components/public/landing/WhyNesbahSection'
import AudienceSection from '@/components/public/landing/AudienceSection'
import FAQSection from '@/components/public/landing/FAQSection'
import CTASection from '@/components/public/landing/CTASection'
import Footer from '@/components/public/landing/Footer'
import WhatsAppButton from '@/components/public/landing/WhatsAppButton'

export const metadata = {
  title: 'Nesbah — POS & Business Financing Marketplace in Saudi Arabia',
  description:
    'Compare POS financing, business loans, and working capital offers from top Saudi banks. Free to use. Submit one request, receive multiple offers.',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Nesbah a financing provider?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, Nesbah is not a financing provider. We are a platform that helps businesses access offers from banks and financing companies.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the service free for businesses?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the service is completely free for businesses. No fees for submitting requests or comparing offers.',
      },
    },
    {
      '@type': 'Question',
      name: 'Am I obligated if I submit a request?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, submitting a request does not obligate you to accept any offer. You can review offers and make the decision that is right for you.',
      },
    },
    {
      '@type': 'Question',
      name: 'What financing types can I request through Nesbah?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can request various types including business, working capital, expansion, equipment, project, commercial real estate, and POS financing.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I choose the right offer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'After receiving offers, you can compare them and choose the best fit based on your business needs and circumstances.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data shared with all providers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your request is shared with relevant providers to help you access suitable financing options.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to submit a request?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Submitting a request takes just a short time, and the form is designed to be as clear and simple as possible.',
      },
    },
  ],
}

export default function Home() {
  return (
    <PublicLanguageProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <FinancingTypes />
        <WhyNesbahSection />
        <AudienceSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppButton />
    </PublicLanguageProvider>
  )
}
