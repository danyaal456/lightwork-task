import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase environment variables')
    _supabase = createClient(url, key)
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type ItemType = 'objective' | 'key_result' | 'task'
export type TeamType = 'engineering' | 'product' | 'commercial' | 'operations'
export type StatusType = 'not_started' | 'on_track' | 'at_risk' | 'missed' | 'done'
export type DeadlineType = 'date' | 'month' | 'quarter'

export interface Item {
  id: string
  type: ItemType
  title: string
  description?: string
  parent_id?: string
  teams: TeamType[]
  status: StatusType
  deadline_type: DeadlineType
  deadline_value: string
  created_at: string
  updated_at: string
  owners?: string[]
  children?: Item[]
}

export interface Note {
  id: string
  item_id: string
  content: string
  created_at: string
}

export interface Link {
  id: string
  item_id: string
  label: string
  url: string
  created_at: string
}
