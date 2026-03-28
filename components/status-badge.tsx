import { Item, StatusType } from '@/lib/supabase'
import { STATUS_COLORS, STATUS_LABELS, getEffectiveStatus, isNotStartedUrgent } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      STATUS_COLORS[status]
    )}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// Compound badge: NS + At Risk, NS + Missed when not started but deadline is bad
export function ItemStatusBadge({ item }: { item: Item }) {
  const status = getEffectiveStatus(item)
  const nsUrgent = isNotStartedUrgent(item)

  if (nsUrgent) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS['not_started'])}>
          NS
        </span>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </span>
      </span>
    )
  }

  return <StatusBadge status={status} />
}
