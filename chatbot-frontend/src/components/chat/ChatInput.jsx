import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Globe, Paperclip } from 'lucide-react'
import clsx from 'clsx'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
]

export default function ChatInput({ onSend, disabled, placeholder = 'Type a message…' }) {
  const [text, setText]         = useState('')
  const [listening, setListening] = useState(false)
  const [lang, setLang]         = useState('en')
  const [showLang, setShowLang] = useState(false)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [text])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed, lang)
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : lang === 'ml' ? 'ml-IN' : 'en-US'
    rec.interimResults = true
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setText(transcript)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  return (
    <div className="relative border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900 px-4 py-3">
      {/* Language badge */}
      <div className="relative inline-block mb-2">
        <button
          onClick={() => setShowLang(v => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors"
        >
          <Globe size={13} />
          {LANGUAGES.find(l => l.code === lang)?.label}
        </button>
        {showLang && (
          <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setShowLang(false) }}
                className={clsx(
                  'block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors',
                  lang === l.code ? 'text-brand-600 font-medium' : 'text-slate-700 dark:text-slate-200'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={clsx(
        'flex items-end gap-2 rounded-2xl border px-4 py-2 transition-all',
        disabled
          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-surface-800 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/30'
      )}>
        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none py-1 leading-relaxed"
          placeholder={disabled ? 'Processing…' : placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />

        <div className="flex items-center gap-1 pb-1 shrink-0">
          {/* Voice */}
          <button
            onClick={toggleVoice}
            disabled={disabled}
            className={clsx(
              'p-1.5 rounded-lg transition-all',
              listening
                ? 'bg-red-100 text-red-500 animate-pulse'
                : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20'
            )}
            title={listening ? 'Stop recording' : 'Voice input'}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className={clsx(
              'p-1.5 rounded-lg transition-all',
              text.trim() && !disabled
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
