import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, userAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    userAPI.getMe()
      .then(r => setUser(r.data.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  // Handle OAuth2 redirect  (?token=...&refreshToken=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const refresh = params.get('refreshToken')
    if (token) {
      localStorage.setItem('accessToken', token)
      if (refresh) localStorage.setItem('refreshToken', refresh)
      window.history.replaceState({}, '', window.location.pathname)
      userAPI.getMe().then(r => setUser(r.data.data)).catch(() => {})
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    const { accessToken, refreshToken, user: u } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password })
    const { accessToken, refreshToken, user: u } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.clear()
    setUser(null)
  }, [])

  const updateUser = useCallback(async (updates) => {
    const { data } = await userAPI.updateProfile(updates)
    setUser(data.data)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
