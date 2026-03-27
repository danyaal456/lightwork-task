import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

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
  team: TeamType
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
