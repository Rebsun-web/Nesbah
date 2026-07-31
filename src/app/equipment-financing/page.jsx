import ProductPage from '@/components/public/ProductPage'

export const metadata = {
  title: 'تمويل المعدات والأجهزة للشركات في السعودية',
  description: 'احصل على عروض تمويل لشراء المعدات والآلات والأجهزة التي تحتاجها منشأتك. قارن العروض من عدة جهات تمويل مرخصة — مجاناً.',
}

export default function Page() {
  return <ProductPage code="equipment" />
}
