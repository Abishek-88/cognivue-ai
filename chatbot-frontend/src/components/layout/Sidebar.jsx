import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, FileText, Briefcase, BookOpen,
  User, Plus, Trash2, ChevronRight, Bot, X, Archive
} from 'lucide-react'
import { chatAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const NAV = [
  { to: '/chat',      icon: MessageSquare, label: 'Chat' },
  { to: '/documents', icon: FileText,      label: 'Documents' },
  { to: '/resume',    icon: Briefcase,     label: 'Resume' },
  { to: '/learning',  icon: BookOpen,      label: 'Learning' },
  { to: '/profile',   icon: User,          label: 'Profile' },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: activeId } = useParams()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    try {
      setLoading(true)
      const { data } = await chatAPI.getConversations()
      setConversations(data.data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function newChat() {
    try {
      const { data } = await chatAPI.createConversation({ title: 'New Chat', type: 'GENERAL' })
      setConversations(prev => [data.data, ...prev])
      navigate(`/chat/${data.data.id}`)
    } catch { toast.error('Could not create chat') }
  }

  async function deleteConversation(e, id) {
    e.preventDefault(); e.stopPropagation()
    try {
      await chatAPI.deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (String(activeId) === String(id)) navigate('/chat')
    } catch { toast.error('Delete failed') }
  }

  async function archiveConversation(e, id) {
    e.preventDefault(); e.stopPropagation()
    try {
      await chatAPI.archiveConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
    } catch { toast.error('Archive failed') }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={clsx(
            'fixed lg:relative z-30 flex flex-col w-72 h-full',
            'bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-slate-800'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow">
              <Bot size={16} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">AI Assistant</span>
            <button onClick={onClose} className="ml-auto lg:hidden btn-ghost p-1">
              <X size={16} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="px-3 pt-4 space-y-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Conversations */}
          <div className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Chats</span>
              <button onClick={newChat} className="btn-ghost p-1 text-brand-600 dark:text-brand-400">
                <Plus size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && conversations.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No conversations yet.<br />Start a new chat!</p>
              )}
              {conversations.map(conv => (
                <NavLink
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className={({ isActive }) => clsx(
                    'group flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm',
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-900/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <MessageSquare size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-slate-700 dark:text-slate-200 text-xs">
                      {conv.title || 'Untitled Chat'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDistanceToNow(new Date(conv.updatedAt || conv.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button onClick={e => archiveConversation(e, conv.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 transition-colors">
                      <Archive size={12} />
                    </button>
                    <button onClick={e => deleteConversation(e, conv.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>

          {/* User footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <NavLink to="/profile" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
            </NavLink>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
