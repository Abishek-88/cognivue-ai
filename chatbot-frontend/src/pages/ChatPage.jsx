import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, Volume2 } from 'lucide-react'
import { chatAPI } from '../api'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import { Spinner, TypingIndicator, EmptyState } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [sending, setSending]     = useState(false)
  const [convId, setConvId]       = useState(id ? Number(id) : null)

  // Load conversation when ID changes
  useEffect(() => {
    if (!id) { setMessages([]); setConvId(null); return }
    setLoading(true)
    chatAPI.getConversation(id)
      .then(r => {
        setMessages(r.data.data.messages || [])
        setConvId(r.data.data.id)
      })
      .catch(() => toast.error('Could not load conversation'))
      .finally(() => setLoading(false))
  }, [id])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend(text, lang) {
    // Optimistic user message
    const tempMsg = { id: Date.now(), sender: 'USER', message: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    setSending(true)

    try {
      const { data } = await chatAPI.sendMessage({
        message: text,
        conversationId: convId,
        languageCode: lang,
      })
      const { conversationId, userMessage, aiMessage } = data.data

      // Replace temp + add real messages
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempMsg.id),
        userMessage,
        aiMessage,
      ])
      setConvId(conversationId)

      if (!id || id !== String(conversationId)) {
        navigate(`/chat/${conversationId}`, { replace: true })
      }

      // Text-to-speech
      if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(aiMessage.message.slice(0, 300))
        utt.lang = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
        // Don't auto-play — user can trigger
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      toast.error(err.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function speakLast() {
    const last = [...messages].reverse().find(m => m.sender === 'AI')
    if (!last || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(last.message.slice(0, 500))
    window.speechSynthesis.speak(utt)
  }

  async function newChat() {
    setMessages([])
    setConvId(null)
    navigate('/chat')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900 shrink-0">
        <button onClick={newChat} className="btn-secondary text-xs py-1.5 px-3">
          <Plus size={14} /> New chat
        </button>
        {messages.length > 0 && (
          <button onClick={speakLast} className="btn-ghost text-xs py-1.5 px-3">
            <Volume2 size={14} /> Read aloud
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {loading && (
          <div className="flex justify-center py-12"><Spinner /></div>
        )}

        {!loading && messages.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="Start a conversation"
            description="Ask me anything — I can chat, explain concepts, write code, and more."
          />
        )}

        {messages.map(msg => (
          <ChatMessage key={msg.id || msg.timestamp} message={msg} />
        ))}

        {sending && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-3 items-start"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <span className="text-white text-xs">AI</span>
            </div>
            <div className="chat-bubble-ai">
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  )
}
