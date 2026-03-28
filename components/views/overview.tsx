'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, CheckSquare, ChevronRight, Bot, Zap, Filter, SlidersHorizontal, Calendar, Users, Shield } from 'lucide-react'

const levels = [
  {
    icon: Target,
    type: 'Objective',
    badge: 'OBJ',
    badgeColor: 'bg-primary/20 text-primary',
    description: 'A high-level goal for the company or a team. Set quarterly. Answers: what are we trying to achieve?',
    example: 'Grow Commercial Pipeline Q2 2026',
    fields: ['Team(s)', 'Owner(s)', 'Quarter deadline'],
    canAdd: 'Can contain Key Results and Tasks directly',
  },
  {
    icon: TrendingUp,
    type: 'Key Result',
    badge: 'KR',
    badgeColor: 'bg-yellow-500/20 text-yellow-400',
    description: 'A measurable outcome that defines success for an Objective. Answers: how do we know we\'ve achieved it?',
    example: 'Close 3 pilot clients by end of April',
    fields: ['Team(s)', 'Owner(s)', 'Month or date deadline'],
    canAdd: 'Can contain Tasks',
  },
  {
    icon: CheckSquare,
    type: 'Task',
    badge: 'T',
    badgeColor: 'bg-muted text-muted-foreground',
    description: 'A specific, actionable piece of work. The day-to-day operational layer. Leaf items — no children.',
    example: 'Draft NDA for Harlow, send by Friday',
    fields: ['Team(s)', 'Owner(s)', 'Hard date deadline', 'Notes', 'References'],
    canAdd: 'Leaf node — no children',
  },
]

const statusRows = [
  {
    badges: [{ label: 'Not Started', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' }],
    how: 'Manual',
    desc: 'Default state. Nothing has been started yet. Clears automatically when you mark Done.',
  },
  {
    badges: [
      { label: 'NS', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
      { label: 'At Risk', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    ],
    how: 'Auto',
    desc: 'Item hasn\'t been started AND deadline is ≤ 2 days away. Both badges show together.',
  },
  {
    badges: [{ label: 'At Risk', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }],
    how: 'Auto',
    desc: 'Work has started but the deadline is ≤ 2 days away.',
  },
  {
    badges: [{ label: 'On Track', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }],
    how: 'Auto',
    desc: 'Work has started and the deadline is more than 2 days away.',
  },
  {
    badges: [{ label: 'Missed', color: 'bg-red-500/20 text-red-400 border-red-500/30' }],
    how: 'Auto',
    desc: 'Deadline has passed and the item is not marked Done.',
  },
  {
    badges: [{ label: 'Done', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }],
    how: 'Manual',
    desc: 'Marked complete. Overrides all urgency — deadline no longer matters.',
  },
]

export function OverviewView() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-xl font-bold text-foreground">Guide</h1>
        <p className="text-sm text-muted-foreground mt-0.5">How this system works — hierarchy, status logic, editing, and the AI agent</p>
      </div>

      {/* Hierarchy */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">Item Hierarchy</h2>
        <div className="space-y-3">
          {levels.map((level, idx) => {
            const Icon = level.icon
            return (
              <motion.div key={level.type} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {idx < levels.length - 1 && <div className="w-px flex-1 bg-border mt-2 min-h-[16px]" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${level.badgeColor}`}>{level.badge}</span>
                      <span className="text-sm font-semibold text-foreground">{level.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{level.description}</p>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border mb-2">
                      <p className="text-xs text-muted-foreground mb-0.5">Example</p>
                      <p className="text-xs font-medium text-foreground">"{level.example}"</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {level.fields.map(f => (
                        <span key={f} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{f}</span>
                      ))}
                      <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground/60 italic">{level.canAdd}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Status logic */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-1">Status System</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Status has two dimensions: <strong className="text-foreground">completion</strong> (manual — Not Started or Done) and <strong className="text-foreground">urgency</strong> (auto-computed from deadline). These combine into the badges you see.
        </p>
        <div className="space-y-2">
          {statusRows.map((row, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-1 shrink-0 w-40">
                {row.badges.map(b => (
                  <span key={b.label} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${b.color}`}>{b.label}</span>
                ))}
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${row.how === 'Manual' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{row.how}</span>
              <p className="text-sm text-muted-foreground">{row.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 bg-muted/40 rounded-lg px-3 py-2.5">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Status on parent items (OBJ, KR) is read-only — it bubbles up from children. The worst child status surfaces to the parent. Set status only on leaf items (tasks, or items with no children).</p>
        </div>
      </section>

      {/* Editing items */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Editing Items</h2>
        <div className="space-y-2.5">
          {[
            { icon: SlidersHorizontal, title: 'Side panel', desc: 'Click any item to open its detail panel on the right. Edit team(s), owners, deadline, completion status, notes, and references from here.' },
            { icon: Calendar, title: 'Deadlines', desc: 'Hover the "Due …" line in the side panel to reveal an edit button. Click to open a date picker. Changing the deadline will immediately recalculate urgency badges.' },
            { icon: Users, title: 'Teams', desc: 'Items can belong to multiple teams. Click any team badge (on a row or in the side panel) to open a toggle dropdown — check or uncheck teams freely.' },
            { icon: Filter, title: 'All Items filters', desc: 'In the All Items view, use the filter bar at the top to narrow by Status, Team, or Owner. A flat filtered list appears when any filter is active.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI agent */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">AI Agent</h2>
        <div className="bg-card border border-border rounded-xl p-4 card-glow space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Chat bar at the bottom of every page</p>
          </div>
          <p className="text-sm text-muted-foreground">
            The agent is a natural language interface to the same operations available in the UI. It has full visibility of all current data, so you can ask it questions or give it instructions. If you have an item open in the side panel, it knows you're referring to that item when you say "this" or "it".
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Mark the Harlow task as done',
              'What\'s at risk this week?',
              'Add a note to the bug backlog KR — blocked on auth review',
              'How many tasks does engineering have open?',
              'Create a task under Close 3 pilots — draft NDA, due Friday, owner James',
              'Generate a weekly summary',
            ].map(ex => (
              <div key={ex} className="flex items-start gap-2 bg-muted/40 rounded-lg px-2.5 py-2">
                <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">"{ex}"</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">The agent only calls tools (create/update/delete) when you ask it to change something. For questions, it answers directly from the current data without touching the database.</p>
        </div>
      </section>

      {/* Rules */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Rules & Constraints</h2>
        <div className="space-y-2">
          {[
            'Max 3 levels: Objective → Key Result → Task',
            'Items can exist without parents — standalone KRs and Tasks are valid',
            'Status is only settable on leaf items (those with no children)',
            'At Risk and Missed are computed automatically — you cannot manually set them',
            'Deleting a parent deletes all its children',
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{rule}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
