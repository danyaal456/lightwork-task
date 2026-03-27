'use client'

import { useState, useRef, useEffect } from 'react'
import { Item } from '@/lib/supabase'
import { Send, Bot, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AgentChat({ selectedItem, onRefresh }: {
  selectedItem: Item | null
  onRefresh: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setExpanded(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentItemId: selectedItem?.id ?? null,
          currentItemTitle: selectedItem?.title ?? null,
        }),
      })

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (data.refreshData) onRefresh()
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="absolute bottom-0 left-56 right-0 z-20">
      <div className="border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
        {/* Chat history */}
        <AnimatePresence>
          {expanded && messages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 240, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto px-4 py-3 space-y-3 border-b border-border"
              style={{ height: 240 }}
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    'max-w-xl px-3 py-2 rounded-xl text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted px-3 py-2 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Bot className="w-4 h-4 text-muted-foreground shrink-0" />

          <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
            {selectedItem && (
              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border shrink-0">
                {selectedItem.title}
              </span>
            )}
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedItem
                ? `Ask about "${selectedItem.title}"...`
                : 'Ask anything — "what\'s at risk this week?" or "mark Greenfield as done"'}
              className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground"
              style={{ maxHeight: 80 }}
            />
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
