import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'

export function Stat({ title, value, change }) {
  return (
    <div>
      <Divider />
      {/* The value used to shrink on wider screens (text-3xl -> sm:text-2xl),
          which made the dashboard's primary figures read smaller on desktop than
          on a phone. It now grows, as it should. */}
      <div className="mt-6 text-base/6 font-medium text-[hsl(var(--muted-foreground))] sm:text-lg/7">{title}</div>
      <div className="mt-3 text-4xl/tight font-semibold sm:text-5xl/tight">{value}</div>
      {change && (
        <div className="mt-3 text-sm/6 sm:text-xs/6">
          <Badge color={change.startsWith('+') ? 'lime' : 'pink'}>{change}</Badge>{' '}
          <span className="text-zinc-500">from last week</span>
        </div>
      )}
    </div>
  )
}
