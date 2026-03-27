'use client'

import { Item, StatusType, TeamType } from '@/lib/supabase'
import { getEffectiveStatus, urgencyScore, formatDeadline, daysUntilDeadline, STATUS_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/status-badge'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AlertTriangle, CheckCircle, Clock, Users, TrendingUp, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { differenceInDays } from 'date-fns'

const TEAMS: TeamType[] = ['engineering', 'product', 'commercial', 'operations']
const TEAM_LABELS: Record<TeamType, string> = {
  engineering: 'Engineering',
  product: 'Product',
  commercial: 'Commercial',
  operations: 'Operations',
}

const STATUS_DONUT_COLORS: Record<StatusType, string> = {
  not_started: '#71717a',
  on_track: '#10b981',
  at_risk: '#f59e0b',
  missed: '#ef4444',
  done: '#3b82f6',
}

function Widget({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-4 ${className}`}
    >
      {children}
    </motion.div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
    </div>
  )
}

export function DashboardView({ items, tree, onSelectItem }: {
  items: Item[]
  tree: Item[]
  onSelectItem: (item: Item) => void
}) {
  const tasks = items.filter(i => i.type === 'task')
  const objectives = tree.filter(i => i.type === 'objective')

  // Hero: 3 most urgent
  const urgent = [...tasks]
    .filter(i => getEffectiveStatus(i) !== 'done')
    .sort((a, b) => urgencyScore(a) - urgencyScore(b))
    .slice(0, 3)

  // Stale: approaching deadline, no note in 3 days
  const stale = items.filter(i => {
    const days = daysUntilDeadline(i.deadline_value)
    const status = getEffectiveStatus(i)
    return days >= 0 && days <= 7 && status !== 'done' && status !== 'missed'
  })

  // Missed
  const missed = items.filter(i => getEffectiveStatus(i) === 'missed')

  // At risk
  const atRisk = items.filter(i => getEffectiveStatus(i) === 'at_risk')

  // Status donut
  const statusCounts: Partial<Record<StatusType, number>> = {}
  items.forEach(i => {
    const s = getEffectiveStatus(i)
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
  })
  const donutData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status as StatusType],
    value: count,
    color: STATUS_DONUT_COLORS[status as StatusType],
  }))

  // Completion by team
  const teamCompletion = TEAMS.map(team => {
    const teamItems = items.filter(i => i.team === team && i.type === 'task')
    const done = teamItems.filter(i => i.status === 'done').length
    return { team, total: teamItems.length, done, pct: teamItems.length > 0 ? Math.round((done / teamItems.length) * 100) : 0 }
  })

  // Completion by objective
  const objCompletion = objectives.map(obj => {
    const allChildren = flattenChildren(obj)
    const tasks = allChildren.filter(i => i.type === 'task')
    const done = tasks.filter(i => i.status === 'done').length
    return { title: obj.title, total: tasks.length, done, pct: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 }
  })

  // Owner workload
  const ownerMap: Record<string, number> = {}
  items.forEach(i => {
    if (getEffectiveStatus(i) !== 'done') {
      i.owners?.forEach(o => { ownerMap[o] = (ownerMap[o] ?? 0) + 1 })
    }
  })
  const ownerWorkload = Object.entries(ownerMap).sort((a, b) => b[1] - a[1])

  // Missed by owner
  const ownerMissed: Record<string, number> = {}
  missed.forEach(i => {
    i.owners?.forEach(o => { ownerMissed[o] = (ownerMissed[o] ?? 0) + 1 })
  })
  const missedByOwner = Object.entries(ownerMissed).sort((a, b) => b[1] - a[1])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Helicopter view across all teams</p>
      </div>

      {/* Hero: 3 most urgent */}
      <div>
        <SectionTitle icon={Zap} label="Most Urgent" />
        <div className="grid grid-cols-3 gap-3">
          {urgent.map((item, idx) => {
            const days = daysUntilDeadline(item.deadline_value)
            const status = getEffectiveStatus(item)
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelectItem(item)}
                className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <StatusBadge status={status} />
                  <span className="text-xs text-muted-foreground">
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{item.team} · {item.owners?.join(', ')}</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Row 2: risk widgets */}
      <div className="grid grid-cols-3 gap-4">
        <Widget>
          <SectionTitle icon={Clock} label="Stale & Approaching" />
          {stale.length === 0 ? (
            <p className="text-xs text-muted-foreground">No items approaching deadline</p>
          ) : (
            <div className="space-y-2">
              {stale.map(item => (
                <button key={item.id} onClick={() => onSelectItem(item)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                    <span className="text-xs text-amber-400 shrink-0">{daysUntilDeadline(item.deadline_value)}d</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Widget>

        <Widget>
          <SectionTitle icon={AlertTriangle} label="Missed" />
          {missed.length === 0 ? (
            <p className="text-xs text-muted-foreground">No missed deadlines</p>
          ) : (
            <div className="space-y-2">
              {missed.map(item => (
                <button key={item.id} onClick={() => onSelectItem(item)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                    <span className="text-xs text-red-400 capitalize shrink-0">{item.team}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Widget>

        <Widget>
          <SectionTitle icon={AlertTriangle} label="At Risk by Team" />
          {atRisk.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing at risk</p>
          ) : (
            <div className="space-y-2">
              {TEAMS.map(team => {
                const count = atRisk.filter(i => i.team === team).length
                if (count === 0) return null
                return (
                  <div key={team} className="flex items-center justify-between">
                    <span className="text-xs text-foreground capitalize">{TEAM_LABELS[team]}</span>
                    <span className="text-xs font-semibold text-amber-400">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Widget>
      </div>

      {/* Row 3: progress */}
      <div className="grid grid-cols-2 gap-4">
        {/* Donut */}
        <Widget>
          <SectionTitle icon={TrendingUp} label="Status Distribution" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Widget>

        {/* Completion by team */}
        <Widget>
          <SectionTitle icon={CheckCircle} label="Completion by Team" />
          <div className="space-y-3">
            {teamCompletion.map(t => (
              <div key={t.team}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{TEAM_LABELS[t.team]}</span>
                  <span className="text-xs text-muted-foreground">{t.done}/{t.total} · {t.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      {/* Row 4: objectives + people */}
      <div className="grid grid-cols-2 gap-4">
        <Widget>
          <SectionTitle icon={TrendingUp} label="Completion by Objective" />
          <div className="space-y-3">
            {objCompletion.map(o => (
              <div key={o.title}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground truncate max-w-[60%]">{o.title}</span>
                  <span className="text-xs text-muted-foreground">{o.done}/{o.total} · {o.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${o.pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Widget>

        <Widget>
          <SectionTitle icon={Users} label="Owner Workload" />
          <div className="space-y-2">
            {ownerWorkload.slice(0, 6).map(([owner, count]) => (
              <div key={owner} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{owner[0]}</span>
                  </div>
                  <span className="text-xs text-foreground">{owner}</span>
                  {ownerMissed[owner] > 0 && (
                    <span className="text-xs text-red-400">({ownerMissed[owner]} missed)</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground">{count} open</span>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  )
}

function flattenChildren(item: Item): Item[] {
  const result: Item[] = [item]
  item.children?.forEach(child => result.push(...flattenChildren(child)))
  return result
}
