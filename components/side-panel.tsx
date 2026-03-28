'use client'

import { Item, Note, Link } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Plus, Trash2, ChevronRight, Link2, MessageSquare, Check, Calendar } from 'lucide-react'
import { ItemStatusBadge, StatusBadge } from '@/components/status-badge'
import { fetchNotes, addNote, fetchLinks, addLink, deleteLink, updateItem } from '@/lib/db'
import { formatDeadline, getEffectiveStatus, STATUS_COLORS, TEAM_COLORS } from '@/lib/utils'
import { StatusType, TeamType, DeadlineType } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const TEAM_OPTIONS: TeamType[] = ['engineering', 'product', 'commercial', 'operations']

export function SidePanel({ item, allItems, onClose, onRefresh, onSelectItem }: {
  item: Item
  allItems: Item[]
  onClose: () => void
  onRefresh: () => void
  onSelectItem: (item: Item) => void
}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [editingTeams, setEditingTeams] = useState(false)
  const [editingOwners, setEditingOwners] = useState(false)
  const [ownerInput, setOwnerInput] = useState('')
  const [editingDeadline, setEditingDeadline] = useState(false)
  const [deadlineInput, setDeadlineInput] = useState(item.deadline_value)
  const [deadlineEditType, setDeadlineEditType] = useState<DeadlineType>(item.deadline_type)

  const parent = item.parent_id ? allItems.find(i => i.id === item.parent_id) : null
  const parentParent = parent?.parent_id ? allItems.find(i => i.id === parent.parent_id) : null
  const children = allItems.filter(i => i.parent_id === item.id)
  const effectiveStatus = getEffectiveStatus(item)

  useEffect(() => {
    fetchNotes(item.id).then(setNotes)
    fetchLinks(item.id).then(setLinks)
  }, [item.id])

  async function handleAddNote() {
    if (!noteInput.trim()) return
    const note = await addNote(item.id, noteInput.trim())
    setNotes(prev => [...prev, note])
    setNoteInput('')
  }

  async function handleAddLink() {
    if (!linkLabel.trim() || !linkUrl.trim()) return
    const link = await addLink(item.id, linkLabel.trim(), linkUrl.trim())
    setLinks(prev => [...prev, link])
    setLinkLabel('')
    setLinkUrl('')
    setShowLinkForm(false)
  }

  async function handleDeleteLink(id: string) {
    await deleteLink(id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  async function handleStatusChange(status: StatusType) {
    setSavingStatus(true)
    await updateItem(item.id, { status })
    onRefresh()
    setSavingStatus(false)
  }

  async function handleTeamToggle(team: TeamType) {
    const current = item.teams ?? []
    const next = current.includes(team) ? current.filter(t => t !== team) : [...current, team]
    await updateItem(item.id, { teams: next })
    onRefresh()
  }

  async function handleAddOwner() {
    const name = ownerInput.trim()
    if (!name) return
    const newOwners = [...(item.owners ?? []), name]
    await updateItem(item.id, { owners: newOwners })
    setOwnerInput('')
    onRefresh()
  }

  async function handleRemoveOwner(owner: string) {
    const newOwners = (item.owners ?? []).filter(o => o !== owner)
    await updateItem(item.id, { owners: newOwners })
    onRefresh()
  }

  async function handleDeadlineSave() {
    if (!deadlineInput) return
    await updateItem(item.id, { deadline_value: deadlineInput, deadline_type: deadlineEditType })
    setEditingDeadline(false)
    onRefresh()
  }

  // Breadcrumbs
  const breadcrumbs = [
    parentParent,
    parent,
    item,
  ].filter(Boolean) as Item[]

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-[420px] shrink-0 border-l border-border bg-card flex flex-col h-screen overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
              {breadcrumbs.map((b, i) => (
                <span key={b.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3" />}
                  <button
                    onClick={() => b.id !== item.id && onSelectItem(b)}
                    className={cn(
                      'hover:text-foreground transition-colors',
                      b.id === item.id ? 'text-foreground font-medium' : 'hover:text-foreground'
                    )}
                  >
                    {b.title}
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground leading-tight">{item.title}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <ItemStatusBadge item={item} />

            {/* Editable teams (multi-select) */}
            <div className="relative">
              <div className="flex items-center gap-1 flex-wrap">
                {(item.teams ?? []).map(t => (
                  <button
                    key={t}
                    onClick={() => setEditingTeams(v => !v)}
                    className={cn('text-xs px-2 py-0.5 rounded-full capitalize hover:opacity-80 transition-opacity', TEAM_COLORS[t])}
                  >
                    {t}
                  </button>
                ))}
                {(item.teams ?? []).length === 0 && (
                  <button
                    onClick={() => setEditingTeams(v => !v)}
                    className="text-xs px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-foreground/30"
                  >
                    + team
                  </button>
                )}
              </div>
              {editingTeams && (
                <div className="absolute top-7 left-0 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  {TEAM_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => handleTeamToggle(t)}
                      className="w-full text-left text-xs px-3 py-1.5 capitalize hover:bg-muted transition-colors flex items-center justify-between text-muted-foreground hover:text-foreground"
                    >
                      {t}
                      {(item.teams ?? []).includes(t) && <Check className="w-3 h-3 text-primary" />}
                    </button>
                  ))}
                  <button
                    onClick={() => setEditingTeams(false)}
                    className="w-full text-left text-xs px-3 py-1.5 text-muted-foreground/60 border-t border-border mt-1 pt-1.5"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Editable deadline */}
            {editingDeadline ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  {(['date', 'month', 'quarter'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setDeadlineEditType(t)}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded capitalize transition-colors',
                        deadlineEditType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t === 'date' ? 'Date' : t === 'month' ? 'Month' : 'Quarter'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {deadlineEditType === 'date' && (
                    <input
                      type="date"
                      autoFocus
                      value={deadlineInput}
                      onChange={e => setDeadlineInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleDeadlineSave(); if (e.key === 'Escape') setEditingDeadline(false) }}
                      className="text-xs bg-muted border border-primary rounded px-2 py-0.5 outline-none text-foreground"
                    />
                  )}
                  {deadlineEditType === 'month' && (
                    <input
                      type="month"
                      autoFocus
                      value={deadlineInput.slice(0, 7)}
                      onChange={e => {
                        const [y, m] = e.target.value.split('-').map(Number)
                        const lastDay = new Date(y, m, 0).toISOString().split('T')[0]
                        setDeadlineInput(lastDay)
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') handleDeadlineSave(); if (e.key === 'Escape') setEditingDeadline(false) }}
                      className="text-xs bg-muted border border-primary rounded px-2 py-0.5 outline-none text-foreground"
                    />
                  )}
                  {deadlineEditType === 'quarter' && (
                    <div className="flex items-center gap-1">
                      <select
                        value={Math.floor(new Date(deadlineInput).getMonth() / 3) + 1}
                        onChange={e => {
                          const q = Number(e.target.value)
                          const year = new Date(deadlineInput).getFullYear()
                          const lastDay = new Date(year, q * 3, 0).toISOString().split('T')[0]
                          setDeadlineInput(lastDay)
                        }}
                        className="text-xs bg-muted border border-primary rounded px-2 py-0.5 outline-none text-foreground"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <input
                        type="number"
                        value={new Date(deadlineInput).getFullYear()}
                        onChange={e => {
                          const year = Number(e.target.value)
                          const q = Math.floor(new Date(deadlineInput).getMonth() / 3) + 1
                          const lastDay = new Date(year, q * 3, 0).toISOString().split('T')[0]
                          setDeadlineInput(lastDay)
                        }}
                        min={2024}
                        max={2030}
                        className="text-xs bg-muted border border-primary rounded px-2 py-0.5 outline-none text-foreground w-16"
                      />
                    </div>
                  )}
                  <button onClick={handleDeadlineSave} className="text-xs text-primary hover:opacity-80">Save</button>
                  <button onClick={() => setEditingDeadline(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setDeadlineInput(item.deadline_value); setDeadlineEditType(item.deadline_type); setEditingDeadline(true) }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group/dl"
              >
                <Calendar className="w-3 h-3" />
                Due {formatDeadline(item.deadline_type, item.deadline_value)}
                <span className="opacity-0 group-hover/dl:opacity-100 text-xs text-primary transition-opacity">(edit)</span>
              </button>
            )}
          </div>

          {/* Editable owners */}
          <div className="mt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(item.owners ?? []).map(owner => (
                <div key={owner} className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 group">
                  <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center">
                    <span className="text-xs text-primary font-medium">{owner[0]}</span>
                  </div>
                  <span className="text-xs text-foreground">{owner}</span>
                  <button
                    onClick={() => handleRemoveOwner(owner)}
                    className="ml-0.5 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditingOwners(e => !e)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border hover:border-foreground/30"
              >
                <Plus className="w-3 h-3" /> Add owner
              </button>
            </div>
            {editingOwners && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  autoFocus
                  value={ownerInput}
                  onChange={e => setOwnerInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddOwner(); if (e.key === 'Escape') setEditingOwners(false) }}
                  placeholder="Owner name..."
                  className="flex-1 text-xs bg-muted rounded-lg px-2.5 py-1.5 border border-border outline-none focus:border-primary transition-colors"
                />
                <button onClick={handleAddOwner} className="text-xs px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Add</button>
                <button onClick={() => setEditingOwners(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status section */}
          {children.length === 0 ? (
            <div className="px-5 py-4 border-b border-border space-y-3">
              {/* Completion — manual */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Completion</p>
                <div className="flex gap-2">
                  {([
                    { value: 'not_started', label: 'Not Started', active: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40' },
                    { value: 'in_progress', label: 'In Progress', active: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
                    { value: 'done', label: 'Done', active: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
                  ] as const).map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      disabled={savingStatus}
                      className={cn(
                        'text-xs px-3 py-1 rounded-full border transition-all',
                        item.status === s.value
                          ? s.active
                          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Urgency — auto */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Urgency <span className="font-normal opacity-60">· auto from deadline</span></p>
                <ItemStatusBadge item={item} />
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
              <p className="text-xs text-muted-foreground">Derived from children — set status on individual tasks or key results.</p>
            </div>
          )}

          {/* Children */}
          {children.length > 0 && (
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {item.type === 'objective' ? 'Key Results' : 'Tasks'} ({children.length})
              </p>
              <div className="space-y-1.5">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => onSelectItem(child)}
                    className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">{child.title}</span>
                    <StatusBadge status={getEffectiveStatus(child)} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* References / Links */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">References</p>
              </div>
              <button
                onClick={() => setShowLinkForm(f => !f)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {showLinkForm && (
              <div className="space-y-2 mb-3 p-3 bg-muted/50 rounded-lg">
                <input
                  value={linkLabel}
                  onChange={e => setLinkLabel(e.target.value)}
                  placeholder="Label (e.g. Slack thread - contract review)"
                  className="w-full text-xs bg-background rounded-md px-3 py-1.5 border border-border outline-none focus:border-primary transition-colors"
                />
                <input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="URL"
                  className="w-full text-xs bg-background rounded-md px-3 py-1.5 border border-border outline-none focus:border-primary transition-colors"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddLink} className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md hover:opacity-90">Save</button>
                  <button onClick={() => setShowLinkForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              </div>
            )}

            {links.length === 0 && !showLinkForm && (
              <p className="text-xs text-muted-foreground">No references added</p>
            )}

            <div className="space-y-1.5">
              {links.map(link => (
                <div key={link.id} className="flex items-center gap-2 group">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {link.label}
                  </a>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes / Thread */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Notes ({notes.length})</p>
            </div>

            <div className="space-y-3 mb-4">
              {notes.map(note => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/50 rounded-lg px-3 py-2.5"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {format(new Date(note.created_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
                </motion.div>
              ))}

              {notes.length === 0 && (
                <p className="text-xs text-muted-foreground">No notes yet</p>
              )}
            </div>

            {/* Note input */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAddNote() }}
                placeholder="Add a note... (⌘+Enter to save)"
                className="w-full text-sm bg-muted rounded-lg px-3 py-2.5 border border-border outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteInput.trim()}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
