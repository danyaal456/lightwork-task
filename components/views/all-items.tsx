'use client'

import { Item, ItemType, TeamType, DeadlineType } from '@/lib/supabase'
import { getEffectiveStatus, formatDeadline } from '@/lib/utils'
import { StatusBadge } from '@/components/status-badge'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createItem, deleteItem } from '@/lib/db'
import { cn } from '@/lib/utils'

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

function ItemRow({ item, onSelectItem, onRefresh, depth = 0 }: {
  item: Item
  onSelectItem: (item: Item) => void
  onRefresh: () => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const hasChildren = item.children && item.children.length > 0
  const status = getEffectiveStatus(item)

  const childType: ItemType | null =
    item.type === 'objective' ? 'key_result' :
    item.type === 'key_result' ? 'task' : null

  async function handleAdd() {
    if (!newTitle.trim() || !childType) return
    await createItem({
      type: childType,
      title: newTitle.trim(),
      team: item.team,
      deadline_type: 'date',
      deadline_value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      parent_id: item.id,
      owners: item.owners ?? [],
    })
    setNewTitle('')
    setAdding(false)
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
          className={cn('w-4 h-4 shrink-0 transition-transform', hasChildren ? 'text-muted-foreground' : 'opacity-0')}
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform', expanded ? 'rotate-90' : '')} />
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

        <span className="text-xs text-muted-foreground hidden group-hover:inline capitalize">{item.team}</span>
        <StatusBadge status={status} />
        <span className="text-xs text-muted-foreground">{formatDeadline(item.deadline_type, item.deadline_value)}</span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {childType && (
            <button
              onClick={() => setAdding(a => !a)}
              className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
              title={`Add ${childType}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Inline add */}
      <AnimatePresence>
        {adding && childType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn('flex items-center gap-2 px-3 py-1.5', TYPE_INDENT[childType])}
          >
            <div className="w-4" />
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder={`New ${childType.replace('_', ' ')} title...`}
              className="flex-1 text-sm bg-muted rounded-lg px-3 py-1.5 outline-none border border-border focus:border-primary transition-colors"
            />
            <button onClick={handleAdd} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              Add
            </button>
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {item.children!.map(child => (
              <ItemRow key={child.id} item={child} onSelectItem={onSelectItem} onRefresh={onRefresh} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AllItemsView({ tree, onSelectItem, onRefresh }: {
  tree: Item[]
  onSelectItem: (item: Item) => void
  onRefresh: () => void
}) {
  const [addingRoot, setAddingRoot] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  async function handleAddObjective() {
    if (!newTitle.trim()) return
    await createItem({
      type: 'objective',
      title: newTitle.trim(),
      team: 'operations',
      deadline_type: 'quarter',
      deadline_value: '2026-06-30',
      owners: [],
    })
    setNewTitle('')
    setAddingRoot(false)
    onRefresh()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">All Items</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full hierarchy — click any item to open details</p>
        </div>
        <button
          onClick={() => setAddingRoot(a => !a)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Objective
        </button>
      </div>

      {addingRoot && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-muted rounded-lg">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddObjective(); if (e.key === 'Escape') setAddingRoot(false) }}
            placeholder="New objective title..."
            className="flex-1 text-sm bg-transparent outline-none"
          />
          <button onClick={handleAddObjective} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg">Add</button>
          <button onClick={() => setAddingRoot(false)} className="text-xs text-muted-foreground">Cancel</button>
        </div>
      )}

      <div className="space-y-1">
        {tree.map(item => (
          <ItemRow key={item.id} item={item} onSelectItem={onSelectItem} onRefresh={onRefresh} />
        ))}
      </div>

      {/* Standalone tasks (no parent) */}
      {tree.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No items yet. Create an objective or use the AI agent below.</p>
        </div>
      )}
    </div>
  )
}
