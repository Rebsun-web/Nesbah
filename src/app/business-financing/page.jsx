import ProductPage from '@/components/public/ProductPage'

export const metadata = {
  title: 'تمويل الشركات في السعودية — قارن عروض من عدة جهات مجاناً',
  description: 'احصل على عروض تمويل لشركتك من بنوك وشركات تمويل مرخصة بطلب واحد. نسبة تساعدك في مقارنة الخيارات واختيار الأنسب — مجاناً وبدون التزام.',
}

export default function Page() {
  return <ProductPage code="corporate" />
}
