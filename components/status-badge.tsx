import { StatusType } from '@/lib/supabase'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
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
