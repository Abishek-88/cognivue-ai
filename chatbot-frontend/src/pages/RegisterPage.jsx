import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Bot, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Spinner } from '../components/ui/Spinner'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created!')
      navigate('/chat')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  const set = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-slate-100">AI Assistant</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Create account</h1>
          <p className="text-slate-500 text-sm">Get started for free</p>
        </div>

        <button
          onClick={() => window.location.href = '/oauth2/authorize/google'}
          className="btn-secondary w-full justify-center mb-6 py-2.5"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-400">or with email</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { k: 'name',  type: 'text',  icon: User,  label: 'Full name',  ph: 'John Doe' },
            { k: 'email', type: 'email', icon: Mail,  label: 'Email',      ph: 'you@example.com' },
          ].map(({ k, type, icon: Icon, label, ph }) => (
            <div key={k}>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">{label}</label>
              <div className="relative">
                <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={type} required className="input-field pl-9" placeholder={ph}
                  value={form[k]} onChange={set(k)} />
              </div>
            </div>
          ))}

          {['password', 'confirm'].map(k => (
            <div key={k}>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                {k === 'password' ? 'Password' : 'Confirm password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'} required
                  className="input-field pl-9 pr-10" placeholder="••••••••"
                  value={form[k]} onChange={set(k)}
                />
                {k === 'confirm' && (
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
            {loading ? <Spinner size="sm" /> : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
