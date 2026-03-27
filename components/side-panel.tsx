'use client'

import { Item, Note, Link } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Plus, Trash2, ChevronRight, Link2, MessageSquare } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { fetchNotes, addNote, fetchLinks, addLink, deleteLink, updateItem } from '@/lib/db'
import { formatDeadline, getEffectiveStatus, STATUS_LABELS, TEAM_COLORS } from '@/lib/utils'
import { StatusType } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const STATUS_OPTIONS: StatusType[] = ['not_started', 'on_track', 'at_risk', 'missed', 'done']

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
            <StatusBadge status={effectiveStatus} />
            <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', TEAM_COLORS[item.team])}>
              {item.team}
            </span>
            <span className="text-xs text-muted-foreground">
              Due {formatDeadline(item.deadline_type, item.deadline_value)}
            </span>
          </div>

          {/* Owners */}
          {item.owners && item.owners.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {item.owners.map(owner => (
                <div key={owner} className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
                  <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center">
                    <span className="text-xs text-primary font-medium">{owner[0]}</span>
                  </div>
                  <span className="text-xs text-foreground">{owner}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status override */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Set Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={savingStatus}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-all',
                    item.status === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

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
