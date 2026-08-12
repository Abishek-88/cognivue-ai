import { useState, useCallback } from 'react'
import { chatAPI } from '../api'
import toast from 'react-hot-toast'

// ── useConversations ──────────────────────────────────────────────────────────
export function useConversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await chatAPI.getConversations()
      setConversations(data.data || [])
    } catch { toast.error('Could not load conversations') }
    finally { setLoading(false) }
  }, [])

  const remove = useCallback(async (id) => {
    await chatAPI.deleteConversation(id)
    setConversations(p => p.filter(c => c.id !== id))
  }, [])

  return { conversations, setConversations, loading, load, remove }
}

// ── useVoiceOutput ────────────────────────────────────────────────────────────
export function useVoiceOutput() {
  const [speaking, setSpeaking] = useState(false)

  const speak = useCallback((text, lang = 'en') => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text.slice(0, 500))
    const langMap = { ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN', ml: 'ml-IN', en: 'en-US' }
    utt.lang = langMap[lang] || 'en-US'
    utt.onstart = () => setSpeaking(true)
    utt.onend   = () => setSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { speaking, speak, stop }
}

// ── useLocalStorage ───────────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })

  const setValue = (value) => {
    try {
      setStoredValue(value)
      localStorage.setItem(key, JSON.stringify(value))
    } catch { /* ignore */ }
  }

  return [storedValue, setValue]
}
