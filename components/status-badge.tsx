import { Item, StatusType } from '@/lib/supabase'
import { STATUS_COLORS, STATUS_LABELS, getEffectiveStatus, isNotStartedAtRisk } from '@/lib/utils'
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

// Shows compound status: "Not Started · At Risk" when applicable, otherwise single badge
export function ItemStatusBadge({ item }: { item: Item }) {
  const status = getEffectiveStatus(item)
  const nsAtRisk = isNotStartedAtRisk(item)

  if (nsAtRisk) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS['not_started'])}>
          NS
        </span>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_COLORS['at_risk'])}>
          At Risk
        </span>
      </span>
    )
  }

  return <StatusBadge status={status} />
}
