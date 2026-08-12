import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import ChatPage           from './pages/ChatPage'
import DocumentsPage      from './pages/DocumentsPage'
import ResumePage         from './pages/ResumePage'
import LearningPage       from './pages/LearningPage'
import ProfilePage        from './pages/ProfilePage'
import OAuthCallbackPage  from './pages/OAuthCallbackPage'
import AppLayout          from './components/layout/AppLayout'
import Spinner            from './components/ui/Spinner'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  return user ? <Navigate to="/chat" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/login"          element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"       element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />

      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/chat"           element={<ChatPage />} />
        <Route path="/chat/:id"       element={<ChatPage />} />
        <Route path="/documents"      element={<DocumentsPage />} />
        <Route path="/resume"         element={<ResumePage />} />
        <Route path="/learning"       element={<LearningPage />} />
        <Route path="/profile"        element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            className: 'text-sm font-medium',
            style: { borderRadius: '12px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
