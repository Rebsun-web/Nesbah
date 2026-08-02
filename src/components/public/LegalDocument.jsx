'use client'

// Renders a legal document from src/content/legal.js inside the shared LegalShell.
// Blocks are positional AR/EN pairs, so the two languages stay structurally identical.

import { PublicLanguageProvider, useLang } from '@/contexts/PublicLanguageContext'
import LegalShell from '@/components/public/LegalShell'

function Body({ doc }) {
  const { t, lang } = useLang()
  return (
    <LegalShell title={t(doc.title)} updated={t(doc.updated)}>
      {doc.blocks.map((b, i) => {
        if (b.tag === 'h2') return <h2 key={i}>{t(b)}</h2>
        if (b.tag === 'ul') {
          const items = b[lang] || b.ar
          return <ul key={i}>{items.map((it, j) => <li key={j}>{it}</li>)}</ul>
        }
        return <p key={i}>{t(b)}</p>
      })}
    </LegalShell>
  )
}

export default function LegalDocument({ doc }) {
  return (
    <PublicLanguageProvider>
      <Body doc={doc} />
    </PublicLanguageProvider>
  )
}
