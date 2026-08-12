import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../components/ui/Spinner'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // AuthContext handles token extraction from URL params on mount
    // Give it a moment then redirect
    const t = setTimeout(() => navigate('/chat', { replace: true }), 800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-slate-500 text-sm">Signing you in…</p>
    </div>
  )
}
