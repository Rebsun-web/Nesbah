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

export default function Home() {
  return (
    <PublicLanguageProvider>
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
