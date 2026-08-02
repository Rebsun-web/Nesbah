import LegalDocument from '@/components/public/LegalDocument'
import { privacy } from '@/content/legal'

export const metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية وحماية البيانات في منصة نسبة. بياناتك لا تُشارك إلا بموافقتك مع جهات التمويل المرخصة.',
}


export default function Page() {
  return <LegalDocument doc={privacy} />
}
