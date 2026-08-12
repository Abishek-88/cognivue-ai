import clsx from 'clsx'

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size]
  return (
    <div className={clsx(
      'border-2 border-brand-500 border-t-transparent rounded-full animate-spin',
      s, className
    )} />
  )
}

export default Spinner

// ── Typing dots ───────────────────────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 inline-block"
          style={{ animation: `pulseDot 1.4s ease-in-out ${delay}s infinite` }}
        />
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={clsx('relative card w-full z-10 p-6', widths[size])}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{title}</h2>
              <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'brand' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const colors = {
    brand:   'bg-brand-500',
    green:   'bg-emerald-500',
    yellow:  'bg-amber-500',
    red:     'bg-red-500',
  }
  const barColor = value >= 80 ? colors.green : value >= 50 ? colors.yellow : colors.red
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={clsx('h-full rounded-full', barColor)}
      />
    </div>
  )
}

// ── Score ring ───────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 120 }) {
  const r = 46
  const c = 2 * Math.PI * r
  const pct = Math.min(100, score)
  const strokeDash = (pct / 100) * c
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${c}`}
          strokeDashoffset={c / 4}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${strokeDash} ${c}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{score}</div>
        <div className="text-xs text-slate-400">/ 100</div>
      </div>
    </div>
  )
}

// ── FileDropzone ─────────────────────────────────────────────────────────────
import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'

export function FileDropzone({ onFile, accept = { 'application/pdf': ['.pdf'] }, label = 'Upload PDF' }) {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept,
    maxFiles: 1,
    onDrop: files => files[0] && onFile(files[0])
  })

  const file = acceptedFiles[0]

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
        isDragActive
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {file
          ? <><FileText size={36} className="text-brand-500" />
              <p className="font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p></>
          : <><Upload size={36} className={isDragActive ? 'text-brand-500' : 'text-slate-400'} />
              <p className="font-medium text-slate-600 dark:text-slate-300">{label}</p>
              <p className="text-xs text-slate-400">Drag & drop or click to browse · PDF only · Max 20MB</p></>
        }
      </div>
    </div>
  )
}
