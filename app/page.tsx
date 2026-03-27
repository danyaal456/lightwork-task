'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { DashboardView } from '@/components/views/dashboard'
import { TimelineView } from '@/components/views/timeline'
import { AllItemsView } from '@/components/views/all-items'
import { OverviewView } from '@/components/views/overview'
import { SidePanel } from '@/components/side-panel'
import { AgentChat } from '@/components/agent-chat'
import type { Item } from '@/lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllItems, buildTree } from '@/lib/db'

export type ViewType = 'dashboard' | 'timeline' | 'items' | 'overview'

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchAllItems,
  })

  // Derive selectedItem from allItems so it auto-updates after any refresh
  const selectedItem = selectedItemId ? allItems.find(i => i.id === selectedItemId) ?? null : null

  const tree = buildTree(allItems)
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['items'] })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto pb-36">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView items={allItems} tree={tree} onSelectItem={i => setSelectedItemId(i.id)} />
              )}
              {activeView === 'timeline' && (
                <TimelineView items={allItems} onSelectItem={i => setSelectedItemId(i.id)} />
              )}
              {activeView === 'items' && (
                <AllItemsView tree={tree} onSelectItem={i => setSelectedItemId(i.id)} onRefresh={refresh} />
              )}
              {activeView === 'overview' && (
                <OverviewView />
              )}
            </>
          )}
        </div>

        <AgentChat selectedItem={selectedItem ?? null} onRefresh={refresh} />
      </main>

      {selectedItem && (
        <SidePanel
          item={selectedItem}
          allItems={allItems}
          onClose={() => setSelectedItemId(null)}
          onRefresh={refresh}
          onSelectItem={i => setSelectedItemId(i.id)}
        />
      )}
    </div>
  )
}
