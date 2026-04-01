import { PublicLanguageProvider } from '@/contexts/PublicLanguageContext'
import Navbar from '@/components/public/landing/Navbar'
import Footer from '@/components/public/landing/Footer'

function TermsContent() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            الشروط والأحكام
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">آخر تحديث: مارس ٢٠٢٦</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">١. طبيعة المنصة</h2>
              <p>نسبة هي منصة تجميع وتسهيل إلكترونية تربط المنشآت بجهات التمويل المرخصة. نسبة ليست بنكاً ولا شركة تمويل ولا تقدم أي خدمات تمويلية مباشرة. لا تحتفظ نسبة بأموال العملاء بأي شكل.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٢. استخدام المنصة</h2>
              <p>باستخدامك لمنصة نسبة، فإنك توافق على تقديم بيانات صحيحة ودقيقة. يحق لنسبة رفض أو تعليق أي حساب يقدم بيانات غير صحيحة.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٣. مشاركة البيانات</h2>
              <p>لا تتم مشاركة بيانات المنشأة مع أي جهة تمويل إلا بموافقة صريحة من صاحب المنشأة. يتم التحقق من بيانات السجل التجاري عبر خدمة واثق من وزارة التجارة.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٤. التكلفة</h2>
              <p>خدمة مقارنة عروض التمويل مجانية بالكامل للمنشآت وأصحاب الأعمال. لا توجد رسوم تسجيل أو رسوم خفية.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٥. إخلاء المسؤولية</h2>
              <p>نسبة لا تضمن الموافقة على أي طلب تمويل. قرارات التمويل تعود بالكامل لجهات التمويل المشاركة. العروض المقدمة عبر المنصة قد تخضع لشروط وأحكام إضافية من جهة التمويل.</p>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold text-[hsl(var(--foreground))]">٦. القانون المطبق</h2>
              <p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية. في حال وجود نزاع، تختص الجهات القضائية المعنية في المملكة بالفصل فيه.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function TermsPage() {
  return (
    <PublicLanguageProvider>
      <TermsContent />
    </PublicLanguageProvider>
  )
}
