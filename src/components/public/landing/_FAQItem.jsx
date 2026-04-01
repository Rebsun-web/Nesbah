'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl bg-[hsl(var(--background))] shadow-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-start text-base font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent)/0.4)] transition-colors"
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={`ms-3 h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          {a}
        </div>
      )}
    </div>
  )
}
