'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, CheckSquare, ChevronRight, Bot, Zap } from 'lucide-react'

const levels = [
  {
    icon: Target,
    type: 'Objective',
    badge: 'OBJ',
    badgeColor: 'bg-primary/20 text-primary',
    description: 'The high-level goal a team is working towards. Set at a quarterly cadence. Each objective answers: what are we trying to achieve?',
    example: 'Grow Commercial Pipeline Q2',
    fields: ['Team', 'Owner(s)', 'Quarter deadline'],
  },
  {
    icon: TrendingUp,
    type: 'Key Result',
    badge: 'KR',
    badgeColor: 'bg-yellow-500/20 text-yellow-400',
    description: 'A measurable outcome that defines what success looks like for an objective. Each KR answers: how do we know we\'ve achieved it?',
    example: 'Close 3 pilot clients',
    fields: ['Team', 'Owner(s)', 'Month or date deadline'],
  },
  {
    icon: CheckSquare,
    type: 'Task',
    badge: 'T',
    badgeColor: 'bg-muted text-muted-foreground',
    description: 'A specific, actionable piece of work that moves a key result forward. Tasks are the day-to-day operational layer.',
    example: 'Close pilot with Greenfield by 31 March',
    fields: ['Team', 'Owner(s)', 'Hard date deadline', 'Notes', 'References'],
  },
]

const statuses = [
  { label: 'Not Started', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', desc: 'Work hasn\'t begun yet' },
  { label: 'On Track', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', desc: 'More than 7 days to deadline' },
  { label: 'At Risk', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', desc: 'Within 2 days of deadline' },
  { label: 'Missed', color: 'bg-red-500/20 text-red-400 border-red-500/30', desc: 'Past deadline, not done' },
  { label: 'Done', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', desc: 'Marked complete' },
]

export function OverviewView() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">How this system is structured and how to use it</p>
      </div>

      {/* Hierarchy */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Item Hierarchy</h2>
        <div className="space-y-3">
          {levels.map((level, idx) => {
            const Icon = level.icon
            return (
              <motion.div
                key={level.type}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
              >
                <div className="flex gap-4">
                  {/* Connector line */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {idx < levels.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-2 mb-0 min-h-[16px]" />
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${level.badgeColor}`}>
                        {level.badge}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{level.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{level.description}</p>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Example</p>
                      <p className="text-xs font-medium text-foreground">"{level.example}"</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {level.fields.map(f => (
                        <span key={f} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Status logic */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Status Logic</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Statuses on parent items (Objectives, Key Results) are automatically derived from their children — the worst child status bubbles up. You can manually override any status at any time.
        </p>
        <div className="space-y-2">
          {statuses.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${s.color}`}>{s.label}</span>
              <span className="text-sm text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI agent */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">AI Agent</h2>
        <div className="bg-card border border-border rounded-xl p-4 card-glow space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Persistent chat bar at the bottom of every page</p>
          </div>
          <p className="text-sm text-muted-foreground">
            The AI agent is a natural language interface to the same operations available in the UI. Everything it does, you can also do manually. It understands context — if you have an item open in the side panel, it knows which item you're referring to.
          </p>
          <div className="space-y-2">
            {[
              'Mark Greenfield as done',
              'Add a note to the bug backlog KR saying we\'re blocked on auth',
              'Create a task under Close 3 pilots — draft NDA for Harlow, due next Friday, owner James',
              'What\'s at risk this week?',
              'Generate weekly summary',
            ].map(ex => (
              <div key={ex} className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">"{ex}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rules */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Rules</h2>
        <div className="space-y-2">
          {[
            'Every item must have a deadline and at least one owner',
            'Max 3 levels deep: Objective → Key Result → Task',
            'Items can exist without parents (standalone KRs or tasks are valid)',
            'Stale items — approaching deadline with no note in 3+ days — are flagged on the dashboard',
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
