import LegalDocument from '@/components/public/LegalDocument'
import { terms } from '@/content/legal'

export const metadata = {
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام الخاصة باستخدام منصة نسبة لتجميع وتسهيل خدمات التمويل للشركات في السعودية.',
}


export default function Page() {
  return <LegalDocument doc={terms} />
}
