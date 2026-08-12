import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Bot, User, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import clsx from 'clsx'

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'USER'
  const [copied, setCopied] = useState(false)

  function copyText() {
    navigator.clipboard.writeText(message.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm',
        isUser
          ? 'bg-gradient-to-br from-brand-500 to-brand-700'
          : 'bg-gradient-to-br from-slate-600 to-slate-800'
      )}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={clsx('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
          ) : (
            <div className="prose-chat text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="!rounded-xl !text-xs !my-3"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>{children}</code>
                    )
                  }
                }}
              >
                {message.message}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className={clsx('flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-xs text-slate-400">
            {message.timestamp
              ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
              : 'just now'}
          </span>
          {!isUser && (
            <button onClick={copyText} className="text-slate-400 hover:text-slate-600 transition-colors">
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
