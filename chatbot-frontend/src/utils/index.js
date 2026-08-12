import { formatDistanceToNow, format } from 'date-fns'

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffHrs = (now - d) / 1000 / 3600
    if (diffHrs < 24) return formatDistanceToNow(d, { addSuffix: true })
    if (diffHrs < 24 * 7) return format(d, 'EEE, h:mm a')
    return format(d, 'MMM d, yyyy')
  } catch { return '' }
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function truncate(str, n = 60) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function getErrorMessage(err) {
  return err?.response?.data?.error
    || err?.response?.data?.message
    || err?.message
    || 'Something went wrong'
}

export function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',    speechCode: 'en-US' },
  { code: 'ta', label: 'Tamil',      speechCode: 'ta-IN' },
  { code: 'hi', label: 'Hindi',      speechCode: 'hi-IN' },
  { code: 'te', label: 'Telugu',     speechCode: 'te-IN' },
  { code: 'ml', label: 'Malayalam',  speechCode: 'ml-IN' },
]
