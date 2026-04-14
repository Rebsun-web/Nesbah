# Frontend guidelines — Nesbah

Next.js 15.5 App Router, JavaScript (no TypeScript), Tailwind + Flowbite React,
Framer Motion, Chart.js / ApexCharts.

---

## Non-negotiables

- No TypeScript. Plain `.js` / `.jsx` only
- No inline `style={{}}` except computed values (e.g. dynamic width from JS)
- Tailwind utility classes only for styling
- Flowbite React first — check if the component exists there before building custom
- No new npm dependencies without asking

---

## Component structure

```jsx
// PascalCase filename: UserCard.jsx
// Named export

export function UserCard({ user, onAction }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white">
      ...
    </div>
  )
}
```

- PascalCase filenames and component names
- Props destructured in the function signature
- Keep components under 150 lines — extract sub-components if longer
- Co-locate component with its page where it is only used once
- Shared/reusable components go in `src/components/`

---

## Data fetching

Server components (default in App Router) — fetch directly:
```jsx
// src/app/admin/applications/page.js
export default async function ApplicationsPage() {
  const res = await fetch('/api/admin/applications', { cache: 'no-store' })
  const { data } = await res.json()
  return <ApplicationsTable applications={data} />
}
```

Client components — use fetch in useEffect or SWR (check what's already used in the file):
```jsx
'use client'
import { useState, useEffect } from 'react'

export function LiveStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => setStats(d.data))
  }, [])

  if (!stats) return <LoadingSpinner />
  return <StatsDisplay stats={stats} />
}
```

Always handle loading and error states — no component should render blank on failure.

---

## Flowbite React usage

Before building a custom modal, table, form, badge, or button — check Flowbite first:

```jsx
import { Modal, Table, Button, Badge, Spinner } from 'flowbite-react'
```

Match the Flowbite theme/variant already used in adjacent components.
Do not override Flowbite styles with custom CSS — use Tailwind modifiers if needed.

---

## Framer Motion

Animations use Framer Motion. Match the animation style and duration of
adjacent components — do not introduce new animation patterns unilaterally.

```jsx
import { motion } from 'framer-motion'

// Match existing fade-in pattern
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  ...
</motion.div>
```

---

## Charts

- **Chart.js** for standard charts (line, bar, doughnut, pie)
- **ApexCharts** for advanced analytics (real-time, heatmaps, range charts)
- Do not use Chart.js and ApexCharts for the same chart type in the same page
- Match whichever is already used in adjacent dashboard components

```jsx
// Chart.js pattern
import { Line } from 'react-chartjs-2'

// ApexCharts pattern
import dynamic from 'next/dynamic'
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })
```

ApexCharts must use dynamic import with `ssr: false` — it breaks SSR otherwise.

---

## Three portals — keep styles consistent within each

| Portal | Route prefix | User role |
|--------|-------------|-----------|
| Business | `/business/` | `business_user` |
| Bank | `/bank/` | `bank_user`, `bank_employee` |
| Admin | `/admin/` | `admin_user` |

When building a new page or component, match the layout, nav, and styling of
other pages in the same portal — not across portals.

---

## DayJS for dates

```javascript
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

dayjs(date).format('DD MMM YYYY')    // display
dayjs(date).fromNow()                // relative
```

Never use `new Date()` for display formatting — use DayJS.

---

## Before marking done

- [ ] Loading state shown while data fetches
- [ ] Error state shown on fetch failure (not blank)
- [ ] No inline styles except computed values
- [ ] No TypeScript annotations introduced
- [ ] ApexCharts loaded with `dynamic(..., { ssr: false })`
- [ ] Flowbite component used if one exists for this UI element
- [ ] Animation matches style of adjacent components
- [ ] No `console.log` left in code