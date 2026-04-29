import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import Navbar from '@/components/public/landing/Navbar'
import Footer from '@/components/public/landing/Footer'
import { Shield, Users, Target, Eye } from 'lucide-react'

export const metadata = {
  title: 'عن نسبة — منصة تجميع وتسهيل التمويل للشركات في السعودية',
  description: 'نسبة منصة سعودية تربط الشركات بالبنوك وشركات التمويل المرخصة لمقارنة العروض واختيار الأنسب. نسبة ليست جهة تمويل.',
}

function AboutContent() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            عن نسبة
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            نسبة منصة سعودية تأسست لتسهيل وصول المنشآت والشركات إلى خيارات التمويل المتاحة من البنوك وشركات التمويل المرخصة في المملكة العربية السعودية.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-[hsl(var(--card))] p-6 shadow-card">
              <Target className="mb-4 h-8 w-8 text-[hsl(var(--primary))]" />
              <h3 className="mb-2 text-lg font-bold text-[hsl(var(--foreground))]">مهمتنا</h3>
              <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                تبسيط عملية الحصول على التمويل للمنشآت السعودية من خلال منصة واحدة تجمع العروض من عدة جهات مرخصة، مع ضمان الشفافية والسرعة.
              </p>
            </div>
            <div className="rounded-2xl bg-[hsl(var(--card))] p-6 shadow-card">
              <Eye className="mb-4 h-8 w-8 text-[hsl(var(--primary))]" />
              <h3 className="mb-2 text-lg font-bold text-[hsl(var(--foreground))]">رؤيتنا</h3>
              <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                أن تصبح نسبة المنصة الأولى في المملكة لتجميع وتسهيل خدمات التمويل، بما يخدم نمو الاقتصاد الوطني ويدعم رؤية ٢٠٣٠.
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <Shield className="mt-1 h-6 w-6 shrink-0 text-[hsl(var(--primary))]" />
              <div>
                <h3 className="font-bold text-[hsl(var(--foreground))]">موقفنا التنظيمي</h3>
                <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  حصلت نسبة على خطاب عدم ممانعة من البنك المركزي السعودي (ساما) للعمل كمنصة تجميع وتسهيل في قطاع الخدمات المالية B2B. نسبة ليست جهة تمويل ولا تحتفظ بأموال العملاء.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Users className="mt-1 h-6 w-6 shrink-0 text-[hsl(var(--primary))]" />
              <div>
                <h3 className="font-bold text-[hsl(var(--foreground))]">لمن نعمل</h3>
                <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  نخدم المنشآت الصغيرة والمتوسطة والشركات في المملكة التي تبحث عن حلول تمويلية، ونتعامل حصرياً مع بنوك وشركات تمويل مرخصة من الجهات المختصة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function AboutPage() {
  return (
    <PublicLanguageProvider>
      <AboutContent />
    </PublicLanguageProvider>
  )
}
