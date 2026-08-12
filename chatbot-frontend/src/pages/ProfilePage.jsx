import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Globe, Save, Eye, EyeOff, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'
import { Spinner } from '../components/ui/Spinner'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ta', label: 'Tamil',   flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi',   flag: '🇮🇳' },
  { code: 'te', label: 'Telugu',  flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', flag: '🇮🇳' },
]

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [name, setName]           = useState(user?.name || '')
  const [lang, setLang]           = useState(user?.preferredLanguage || 'en')
  const [savingProfile, setSavingProfile] = useState(false)
  const [showPw, setShowPw]       = useState(false)
  const [pwForm, setPwForm]       = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw]   = useState(false)

  async function saveProfile() {
    setSavingProfile(true)
    try {
      await updateUser({ name, preferredLanguage: lang })
      toast.success('Profile updated')
    } catch { toast.error('Update failed') }
    finally { setSavingProfile(false) }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.newPassword.length < 6) { toast.error('Min 6 characters'); return }
    setSavingPw(true)
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally { setSavingPw(false) }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.name}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <span className="badge badge-blue mt-1.5">{user?.role}</span>
            </div>
          </div>
        </motion.div>

        {/* Profile settings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <User size={16} /> Profile Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Display Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field pl-9" value={name}
                  onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field pl-9 opacity-60 cursor-not-allowed" value={user?.email} readOnly />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-1.5">
                <Globe size={14} /> Preferred Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                      lang === l.code
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveProfile} disabled={savingProfile} className="btn-primary">
              {savingProfile ? <Spinner size="sm" /> : <><Save size={15} /> Save changes</>}
            </button>
          </div>
        </motion.div>

        {/* Change password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Lock size={16} /> Change Password
          </h3>
          <form onSubmit={changePassword} className="space-y-4">
            {[
              { k: 'currentPassword', label: 'Current password', ph: '••••••••' },
              { k: 'newPassword',     label: 'New password',     ph: '••••••••' },
              { k: 'confirm',         label: 'Confirm new password', ph: '••••••••' },
            ].map(({ k, label, ph }) => (
              <div key={k}>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">{label}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'} required
                    className="input-field pl-9 pr-10"
                    placeholder={ph}
                    value={pwForm[k]}
                    onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                  />
                  {k === 'confirm' && (
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="submit" disabled={savingPw} className="btn-primary">
              {savingPw ? <Spinner size="sm" /> : <><Lock size={15} /> Update password</>}
            </button>
          </form>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card p-5 border-red-200 dark:border-red-900">
          <h3 className="font-semibold text-red-600 mb-3 text-sm">Account Actions</h3>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <LogOut size={15} /> Sign out of all sessions
          </button>
        </motion.div>
      </div>
    </div>
  )
}
