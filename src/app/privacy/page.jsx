import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import Navbar from '@/components/public/landing/Navbar'
import Footer from '@/components/public/landing/Footer'

export const metadata = {
  title: 'سياسة الخصوصية | نسبة',
  description: 'سياسة الخصوصية وحماية البيانات في منصة نسبة. بياناتك لا تُشارك إلا بموافقتك مع جهات التمويل المرخصة.',
}

function PrivacyContent() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            سياسة الخصوصية
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">آخر تحديث: مارس ٢٠٢٦</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">١. البيانات التي نجمعها</h2>
              <p>نجمع البيانات اللازمة لتقديم خدمة المقارنة، وتشمل: بيانات المنشأة (الاسم، السجل التجاري، القطاع)، بيانات التواصل (الاسم، رقم الجوال، البريد الإلكتروني)، وتفاصيل طلب التمويل.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٢. كيف نستخدم بياناتك</h2>
              <p>نستخدم بياناتك لغرض واحد: مطابقتك مع جهات التمويل المناسبة وعرض طلبك عليها. لا نبيع بياناتك ولا نشاركها مع أي طرف غير مصرح به.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٣. مشاركة البيانات مع جهات التمويل</h2>
              <p>لا تتم مشاركة بيانات منشأتك مع أي جهة تمويل إلا بموافقتك الصريحة المسبقة. يمكنك سحب موافقتك في أي وقت.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٤. التحقق عبر واثق</h2>
              <p>نستخدم خدمة واثق من وزارة التجارة للتحقق التلقائي من صحة بيانات السجل التجاري. هذا يضمن دقة البيانات ويسرّع معالجة طلبك.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٥. حماية البيانات</h2>
              <p>نلتزم بأعلى معايير حماية البيانات وأمن المعلومات المعتمدة في المملكة العربية السعودية، بما في ذلك نظام حماية البيانات الشخصية.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٦. حقوقك</h2>
              <p>يحق لك طلب الاطلاع على بياناتك، تصحيحها، أو حذفها في أي وقت عبر التواصل معنا على info@nesbah.com.sa.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <PublicLanguageProvider>
      <PrivacyContent />
    </PublicLanguageProvider>
  )
}
