'use client'

import { Item, ItemType, TeamType } from '@/lib/supabase'
import { getEffectiveStatus, formatDeadline, TEAM_COLORS } from '@/lib/utils'
import { StatusBadge } from '@/components/status-badge'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Plus, Trash2, Users, Check } from 'lucide-react'
import { useState } from 'react'
import { createItem, deleteItem, updateItem } from '@/lib/db'
import { cn } from '@/lib/utils'

const TEAM_OPTIONS: TeamType[] = ['engineering', 'product', 'commercial', 'operations']

const TYPE_INDENT: Record<ItemType, string> = {
  objective: 'ml-0',
  key_result: 'ml-6',
  task: 'ml-12',
}

const TYPE_LABEL: Record<ItemType, string> = {
  objective: 'OBJ',
  key_result: 'KR',
  task: 'T',
}

const TYPE_COLORS: Record<ItemType, string> = {
  objective: 'bg-primary/20 text-primary',
  key_result: 'bg-yellow-500/20 text-yellow-400',
  task: 'bg-muted text-muted-foreground',
}

function OwnersTag({ owners }: { owners: string[] }) {
  const [hovered, setHovered] = useState(false)
  if (!owners || owners.length === 0) return null

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex items-center gap-1 bg-muted/80 rounded-full px-2 py-0.5 cursor-default">
        <Users className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {owners.length === 1 ? owners[0] : `${owners[0]} +${owners.length - 1}`}
        </span>
      </div>
      <AnimatePresence>
        {hovered && owners.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-full left-0 mb-1.5 bg-popover border border-border rounded-lg px-3 py-2 shadow-lg z-50 min-w-max"
          >
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Owners</p>
            <div className="space-y-1">
              {owners.map(o => (
                <div key={o} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{o[0]}</span>
                  </div>
                  <span className="text-xs text-foreground">{o}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ItemRow({ item, onSelectItem, onRefresh }: {
  item: Item
  onSelectItem: (item: Item) => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [adding, setAdding] = useState<ItemType | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editingTeam, setEditingTeam] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const status = getEffectiveStatus(item)

  async function handleTeamChange(team: TeamType) {
    await updateItem(item.id, { team })
    setEditingTeam(false)
    onRefresh()
  }

  // Objectives can add KR or Task; KRs can add Task; Tasks can't add children
  const childOptions: ItemType[] =
    item.type === 'objective' ? ['key_result', 'task'] :
    item.type === 'key_result' ? ['task'] : []

  async function handleAdd() {
    if (!newTitle.trim() || !adding) return
    await createItem({
      type: adding,
      title: newTitle.trim(),
      team: item.team,
      deadline_type: 'date',
      deadline_value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      parent_id: item.id,
      owners: item.owners ?? [],
    })
    setNewTitle('')
    setAdding(null)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}" and all its children?`)) return
    await deleteItem(item.id)
    onRefresh()
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 group transition-colors', TYPE_INDENT[item.type])}
      >
        <button
          onClick={() => setExpanded(e => !e)}
          className={cn('w-4 h-4 shrink-0', hasChildren ? 'text-muted-foreground' : 'opacity-0 pointer-events-none')}
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform duration-150', expanded ? 'rotate-90' : '')} />
        </button>

        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded shrink-0', TYPE_COLORS[item.type])}>
          {TYPE_LABEL[item.type]}
        </span>

        <button
          onClick={() => onSelectItem(item)}
          className="flex-1 text-left text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
        >
          {item.title}
        </button>

        {/* Clickable team tag */}
        <div className="relative shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setEditingTeam(t => !t) }}
            className={cn('text-xs px-2 py-0.5 rounded-full capitalize hover:opacity-80 transition-opacity', TEAM_COLORS[item.team])}
          >
            {item.team}
          </button>
          <AnimatePresence>
            {editingTeam && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute top-6 left-0 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]"
              >
                {TEAM_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={e => { e.stopPropagation(); handleTeamChange(t) }}
                    className="w-full text-left text-xs px-3 py-1.5 capitalize hover:bg-muted transition-colors flex items-center justify-between text-muted-foreground hover:text-foreground"
                  >
                    {t}
                    {t === item.team && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <OwnersTag owners={item.owners ?? []} />

        <StatusBadge status={status} />
        <span className="text-xs text-muted-foreground shrink-0">{formatDeadline(item.deadline_type, item.deadline_value)}</span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {childOptions.map(type => (
            <button
              key={type}
              onClick={() => setAdding(a => a === type ? null : type)}
              className={cn(
                'text-xs px-1.5 py-0.5 rounded transition-colors',
                adding === type
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-primary/20 text-muted-foreground hover:text-primary'
              )}
              title={`Add ${type.replace('_', ' ')}`}
            >
              + {TYPE_LABEL[type]}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Inline add child */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn('flex items-center gap-2 px-3 py-1.5', TYPE_INDENT[adding])}
          >
            <div className="w-4" />
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(null) }}
              placeholder={`New ${adding.replace('_', ' ')} title...`}
              className="flex-1 text-sm bg-muted rounded-lg px-3 py-1.5 outline-none border border-border focus:border-primary transition-colors"
            />
            <button onClick={handleAdd} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Add</button>
            <button onClick={() => setAdding(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {item.children!.map(child => (
              <ItemRow key={child.id} item={child} onSelectItem={onSelectItem} onRefresh={onRefresh} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type RootType = 'objective' | 'key_result' | 'task'

const ROOT_OPTIONS: { type: RootType; label: string; placeholder: string; deadline_type: 'quarter' | 'month' | 'date'; deadline_value: string }[] = [
  { type: 'objective', label: 'New Objective', placeholder: 'Objective title...', deadline_type: 'quarter', deadline_value: '2026-06-30' },
  { type: 'key_result', label: 'New Key Result', placeholder: 'Key result title...', deadline_type: 'month', deadline_value: '2026-04-30' },
  { type: 'task', label: 'New Task', placeholder: 'Task title...', deadline_type: 'date', deadline_value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
]

export function AllItemsView({ tree, onSelectItem, onRefresh }: {
  tree: Item[]
  onSelectItem: (item: Item) => void
  onRefresh: () => void
}) {
  const [addingType, setAddingType] = useState<RootType | null>(null)
  const [newTitle, setNewTitle] = useState('')

  async function handleAdd() {
    if (!newTitle.trim() || !addingType) return
    const opt = ROOT_OPTIONS.find(o => o.type === addingType)!
    await createItem({
      type: addingType,
      title: newTitle.trim(),
      team: 'operations',
      deadline_type: opt.deadline_type,
      deadline_value: opt.deadline_value,
      owners: [],
    })
    setNewTitle('')
    setAddingType(null)
    onRefresh()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">All Items</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full hierarchy — click any item to open details</p>
        </div>
        <div className="flex items-center gap-2">
          {ROOT_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => setAddingType(addingType === opt.type ? null : opt.type)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all',
                addingType === opt.type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {addingType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-4 px-3 py-2 bg-muted rounded-lg border border-border"
          >
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddingType(null) }}
              placeholder={ROOT_OPTIONS.find(o => o.type === addingType)?.placeholder}
              className="flex-1 text-sm bg-transparent outline-none"
            />
            <button onClick={handleAdd} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Add</button>
            <button onClick={() => setAddingType(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {tree.map(item => (
          <ItemRow key={item.id} item={item} onSelectItem={onSelectItem} onRefresh={onRefresh} />
        ))}
      </div>

      {tree.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No items yet. Create one above or use the AI agent below.</p>
        </div>
      )}
    </div>
  )
}
