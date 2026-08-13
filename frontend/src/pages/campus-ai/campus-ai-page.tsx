import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bot, Send } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api, ApiClientError } from '@/services/api/client'

interface Message { role: 'user' | 'assistant'; content: string }

const suggestions = [
  'How many complaints do I have?',
  'Where is my Wi-Fi complaint?',
  'Are others reporting this issue?',
  'Create a complaint about broken projector',
]

export default function CampusAiPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m Campus AI for KLH University Aziz Nagar. Ask me about your complaints, Wi-Fi issues, hostel problems, or campus health.' },
  ])
  const [input, setInput] = useState('')

  const chat = useMutation({
    mutationFn: (message: string) => api.ai.chat(message),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    },
    onError: (err) => {
      const msg = err instanceof ApiClientError ? err.message : 'Campus AI is unavailable. Start the backend server on port 8000.'
      toast.error(msg)
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I couldn't connect to the server. ${msg}` }])
    },
  })

  const send = (text?: string) => {
    const msg = text ?? input
    if (!msg.trim() || chat.isPending) return
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    chat.mutate(msg)
    setInput('')
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6" style={{ height: 'calc(100vh - 10rem)' }}>
      <PageHeader eyebrow="AI Assistant" title="Campus AI" description="Ask questions about your KLH campus complaints, hotspots, and service status." />

      <Card padding="none" className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'gradient-brand text-white shadow-lg' : 'bg-surface-100 dark:bg-surface-800'}`}>
                {m.role === 'assistant' ? (
                  <div className="mb-2 flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Bot className="h-4 w-4" /><span className="text-xs font-semibold">Campus AI</span>
                  </div>
                ) : null}
                {m.content}
              </div>
            </div>
          ))}
          {chat.isPending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface-100 px-4 py-3 dark:bg-surface-800">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-brand-400" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t bg-surface-50/50 p-4 dark:bg-surface-900/50">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} disabled={chat.isPending} className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:bg-surface-900">
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:bg-surface-900"
              placeholder="Ask Campus AI anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            />
            <Button onClick={() => send()} loading={chat.isPending}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
