import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Bot, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Spinner } from '../components/ui/Spinner'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/chat')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  function googleLogin() {
    window.location.href = '/oauth2/authorize/google'
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot size={22} className="text-white" />
          </div>
          <span className="font-bold text-xl">AI Assistant</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Your intelligent<br />learning companion
          </h2>
          <p className="text-brand-200 text-lg">Chat, learn, analyze documents and supercharge your career with AI.</p>
        </div>
        <div className="flex gap-6 text-sm text-brand-200">
          <div><div className="text-2xl font-bold text-white mb-1">RAG</div>Document Q&A</div>
          <div><div className="text-2xl font-bold text-white mb-1">OCR</div>Scanned PDFs</div>
          <div><div className="text-2xl font-bold text-white mb-1">5+</div>Languages</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-surface-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to continue</p>
          </div>

          {/* Google */}
          <button onClick={googleLogin} className="btn-secondary w-full justify-center mb-6 py-2.5">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required
                  className="input-field pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'} required
                  className="input-field pl-9 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <Spinner size="sm" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
