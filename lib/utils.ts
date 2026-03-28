import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, format, parseISO } from "date-fns"
import { StatusType, Item } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEffectiveStatus(item: Item): StatusType {
  if (item.status === 'done') return 'done'
  const daysUntil = differenceInDays(parseISO(item.deadline_value), new Date())
  if (daysUntil < 0) return 'missed'
  if (daysUntil <= 2) return 'at_risk'
  // Fine deadline: preserve not_started, otherwise on_track
  return item.status === 'not_started' ? 'not_started' : 'on_track'
}

// True when an item should show the "NS" badge alongside an urgency badge
// Only case: not_started + at_risk deadline (the "Not Started · At Risk" combo)
export function isNotStartedAtRisk(item: Item): boolean {
  return item.status === 'not_started' && getEffectiveStatus(item) === 'at_risk'
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

// Urgency priority: missed → at_risk → not_started → on_track (lower score = more urgent)
const URGENCY_TIER: Record<StatusType, number> = {
  missed: 0,
  at_risk: 1,
  not_started: 2,
  on_track: 3,
  done: 999,
}

export function urgencyScore(item: Item): number {
  const status = getEffectiveStatus(item)
  const days = differenceInDays(parseISO(item.deadline_value), new Date())
  // Primary sort: status tier (×1000 to dominate), secondary: days remaining
  return URGENCY_TIER[status] * 1000 + days
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
