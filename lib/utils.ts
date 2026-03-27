import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, format, parseISO } from "date-fns"
import { StatusType, Item } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function computeStatus(deadlineValue: string, currentStatus: StatusType): StatusType {
  if (currentStatus === 'done') return 'done'
  const today = new Date()
  const deadline = parseISO(deadlineValue)
  const daysUntil = differenceInDays(deadline, today)
  if (daysUntil < 0) return 'missed'
  if (daysUntil <= 2) return 'at_risk'
  return currentStatus === 'not_started' ? 'not_started' : 'on_track'
}

export function getEffectiveStatus(item: Item): StatusType {
  return computeStatus(item.deadline_value, item.status)
}

const STATUS_RANK: Record<StatusType, number> = {
  missed: 0,
  at_risk: 1,
  not_started: 2,
  on_track: 3,
  done: 4,
}

export function worstStatus(statuses: StatusType[]): StatusType {
  if (statuses.length === 0) return 'not_started'
  return statuses.reduce((worst, s) =>
    STATUS_RANK[s] < STATUS_RANK[worst] ? s : worst
  )
}

export function urgencyScore(item: Item): number {
  const today = new Date()
  const deadline = parseISO(item.deadline_value)
  const daysUntil = differenceInDays(deadline, today)
  const statusPenalty = STATUS_RANK[getEffectiveStatus(item)]
  return daysUntil - statusPenalty * 10
}

export function formatDeadline(deadlineType: string, deadlineValue: string): string {
  const date = parseISO(deadlineValue)
  if (deadlineType === 'quarter') {
    const month = date.getMonth()
    const quarter = Math.floor(month / 3) + 1
    return `Q${quarter} ${format(date, 'yyyy')}`
  }
  if (deadlineType === 'month') return format(date, 'MMMM yyyy')
  return format(date, 'dd MMM yyyy')
}

export function daysUntilDeadline(deadlineValue: string): number {
  return differenceInDays(parseISO(deadlineValue), new Date())
}

export const STATUS_LABELS: Record<StatusType, string> = {
  not_started: 'Not Started',
  on_track: 'On Track',
  at_risk: 'At Risk',
  missed: 'Missed',
  done: 'Done',
}

export const STATUS_COLORS: Record<StatusType, string> = {
  not_started: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  on_track: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  at_risk: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  missed: 'bg-red-500/20 text-red-400 border-red-500/30',
  done: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export const TEAM_COLORS: Record<string, string> = {
  engineering: 'bg-purple-500/20 text-purple-400',
  product: 'bg-blue-500/20 text-blue-400',
  commercial: 'bg-yellow-500/20 text-yellow-400',
  operations: 'bg-teal-500/20 text-teal-400',
}
