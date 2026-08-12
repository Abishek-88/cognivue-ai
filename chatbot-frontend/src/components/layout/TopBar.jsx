import { Menu, Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/chat':      'Chat',
  '/documents': 'Documents',
  '/resume':    'Resume Analyzer',
  '/learning':  'Learning',
  '/profile':   'Profile',
}

export default function TopBar({ onMenuClick }) {
  const { logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path))?.[1] || 'AI Assistant'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex items-center gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900 shrink-0">
      <button onClick={onMenuClick} className="btn-ghost p-1.5">
        <Menu size={18} />
      </button>

      <h1 className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</h1>

      <div className="ml-auto flex items-center gap-1">
        <button onClick={toggle} className="btn-ghost p-1.5" title="Toggle theme">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button onClick={handleLogout} className="btn-ghost p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Logout">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  )
}
