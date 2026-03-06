import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { sendChatMessage } from '../../services/chat'
import { cn } from '../../lib/utils'

const WELCOME = "Hey there! 👋 I'm **Edison**, your EdisonKart assistant. I can help with orders, products, shipping & more. How can I help you today?"

const QUICK_ACTIONS = [
  { label: '📦 Track my order', message: 'Where is my order?' },
  { label: '🛒 Browse products', message: 'Show me products to browse' },
  { label: '🔄 Return/Refund', message: 'How do I return a product?' },
  { label: '❓ Help', message: 'What can you help me with?' },
]

function ChatMessage({ msg, onLinkClick }) {
  const rendered = useMemo(() => parseMessage(msg.content), [msg.content])

  return (
    <div className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
      {msg.role === 'assistant' && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mt-1">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          msg.role === 'user'
            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-md'
            : 'bg-muted/70 text-foreground rounded-bl-md border border-border/50'
        )}
      >
        {rendered.map((node, i) => renderNode(node, i, onLinkClick))}
      </div>
    </div>
  )
}

function parseMessage(text) {
  if (!text) return [{ type: 'text', value: '' }]
  const nodes = []
  const lines = text.split('\n')

  for (let li = 0; li < lines.length; li++) {
    if (li > 0) nodes.push({ type: 'br' })
    const line = lines[li]
    const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
    for (const part of parts) {
      if (!part) continue
      const boldMatch = part.match(/^\*\*(.+)\*\*$/)
      if (boldMatch) { nodes.push({ type: 'bold', value: boldMatch[1] }); continue }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) { nodes.push({ type: 'link', label: linkMatch[1], href: linkMatch[2] }); continue }
      nodes.push({ type: 'text', value: part })
    }
  }
  return nodes
}

function renderNode(node, key, onLinkClick) {
  if (node.type === 'br') return <br key={key} />
  if (node.type === 'bold') return <strong key={key} className="font-semibold">{node.value}</strong>
  if (node.type === 'link') {
    return (
      <button
        key={key}
        onClick={() => onLinkClick(node.href)}
        className="inline text-orange-600 dark:text-orange-400 underline underline-offset-2 hover:text-orange-700 dark:hover:text-orange-300 font-medium cursor-pointer bg-transparent border-none p-0"
      >
        {node.label}
      </button>
    )
  }
  return <span key={key}>{node.value}</span>
}

export default function ChatWidget() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, messages, loading])

  const handleLinkClick = (href) => {
    if (href.startsWith('http')) { window.open(href, '_blank'); return }
    navigate(href)
    setOpen(false)
  }

  const handleSend = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setShowQuick(false)
    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }))
      const { reply } = await sendChatMessage(msg, history)
      setMessages(prev => [...prev, { role: 'assistant', content: reply || 'No response.' }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't reach the server. Please try again or visit [Contact Us](/contact)."
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[min(400px,calc(100vw-2rem))] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Edison</div>
                <div className="text-xs text-orange-100">EdisonKart Support • Online</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-[260px] max-h-[380px]">
              <div className="p-4 space-y-4">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} msg={msg} onLinkClick={handleLinkClick} />
                ))}

                {showQuick && messages.length === 1 && !loading && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {QUICK_ACTIONS.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(qa.message)}
                        className="text-xs px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-colors dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/50"
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}

                {loading && (
                  <div className="flex gap-2 items-start">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-muted/70 border border-border/50 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Edison is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background/80 backdrop-blur-sm flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={loading}
                className="flex-1 rounded-xl border-muted-foreground/20"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="rounded-xl shrink-0 bg-orange-500 hover:bg-orange-600"
                aria-label="Send"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-shadow"
        aria-label={open ? 'Close chat' : 'Open chat'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
