import ProductPage from '@/components/public/ProductPage'

export const metadata = {
  title: 'التمويل العقاري التجاري للشركات في السعودية',
  description: 'قارن عروض التمويل العقاري التجاري لشراء أو تطوير العقارات لمنشأتك. عروض من عدة جهات تمويل مرخصة — مجاناً وبدون التزام.',
}

export default function Page() {
  return <ProductPage code="commercial_real_estate" />
}
