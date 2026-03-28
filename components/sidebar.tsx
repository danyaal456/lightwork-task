'use client'

import { ViewType } from '@/app/page'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Clock, List, Sun, Moon, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const views = [
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timeline' as ViewType, label: 'Timeline', icon: Clock },
  { id: 'items' as ViewType, label: 'All Items', icon: List },
  { id: 'overview' as ViewType, label: 'Guide', icon: BookOpen },
]

export function Sidebar({ activeView, onViewChange }: {
  activeView: ViewType
  onViewChange: (v: ViewType) => void
}) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-sidebar h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">LW</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">LightWork</p>
            <p className="text-xs text-muted-foreground">Ops Agent</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {views.map(view => {
          const Icon = view.icon
          const active = activeView === view.id
          return (
            <motion.button
              key={view.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onViewChange(view.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {view.label}
            </motion.button>
          )
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
