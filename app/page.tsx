'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { DashboardView } from '@/components/views/dashboard'
import { TimelineView } from '@/components/views/timeline'
import { AllItemsView } from '@/components/views/all-items'
import { SidePanel } from '@/components/side-panel'
import { AgentChat } from '@/components/agent-chat'
import { Item } from '@/lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllItems, buildTree } from '@/lib/db'

export type ViewType = 'dashboard' | 'timeline' | 'items'

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const queryClient = useQueryClient()

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchAllItems,
  })

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
                <DashboardView items={allItems} tree={tree} onSelectItem={setSelectedItem} />
              )}
              {activeView === 'timeline' && (
                <TimelineView items={allItems} onSelectItem={setSelectedItem} />
              )}
              {activeView === 'items' && (
                <AllItemsView tree={tree} onSelectItem={setSelectedItem} onRefresh={refresh} />
              )}
            </>
          )}
        </div>

        <AgentChat selectedItem={selectedItem} onRefresh={refresh} />
      </main>

      {selectedItem && (
        <SidePanel
          item={selectedItem}
          allItems={allItems}
          onClose={() => setSelectedItem(null)}
          onRefresh={refresh}
          onSelectItem={setSelectedItem}
        />
      )}
    </div>
  )
}
