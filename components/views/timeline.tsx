'use client'

import { Item } from '@/lib/supabase'
import { getEffectiveStatus, formatDeadline, daysUntilDeadline } from '@/lib/utils'
import { ItemStatusBadge } from '@/components/status-badge'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TimelineView({ items, onSelectItem }: {
  items: Item[]
  onSelectItem: (item: Item) => void
}) {
  const sorted = [...items]
    .filter(i => getEffectiveStatus(i) !== 'done')
    .sort((a, b) => new Date(a.deadline_value).getTime() - new Date(b.deadline_value).getTime())

  // Group by relative time
  const overdue = sorted.filter(i => daysUntilDeadline(i.deadline_value) < 0)
  const thisWeek = sorted.filter(i => { const d = daysUntilDeadline(i.deadline_value); return d >= 0 && d <= 7 })
  const thisMonth = sorted.filter(i => { const d = daysUntilDeadline(i.deadline_value); return d > 7 && d <= 31 })
  const later = sorted.filter(i => daysUntilDeadline(i.deadline_value) > 31)

  const groups = [
    { label: 'Overdue', items: overdue, accent: 'text-red-400' },
    { label: 'This Week', items: thisWeek, accent: 'text-amber-400' },
    { label: 'This Month', items: thisMonth, accent: 'text-blue-400' },
    { label: 'Later', items: later, accent: 'text-muted-foreground' },
  ].filter(g => g.items.length > 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All open items sorted by deadline</p>
      </div>

      <div className="space-y-8">
        {groups.map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className={cn('w-4 h-4', group.accent)} />
              <h2 className={cn('text-sm font-semibold', group.accent)}>{group.label}</h2>
              <span className="text-xs text-muted-foreground">({group.items.length})</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2 ml-6">
              {group.items.map((item, idx) => {
                const days = daysUntilDeadline(item.deadline_value)
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => onSelectItem(item)}
                    className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors group"
                  >
                    {/* Type indicator */}
                    <div className="shrink-0">
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        item.type === 'objective' ? 'bg-primary/20 text-primary' :
                        item.type === 'key_result' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {item.type === 'objective' ? 'OBJ' : item.type === 'key_result' ? 'KR' : 'T'}
                      </span>
                    </div>

                    {/* Title + team */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{(item.teams ?? []).join(', ')} · {item.owners?.join(', ')}</p>
                    </div>

                    {/* Status */}
                    <ItemStatusBadge item={item} />

                    {/* Deadline */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-foreground">{formatDeadline(item.deadline_type, item.deadline_value)}</p>
                      <p className={cn('text-xs', days < 0 ? 'text-red-400' : days <= 2 ? 'text-amber-400' : 'text-muted-foreground')}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All items are complete</p>
          </div>
        )}
      </div>
    </div>
  )
}
