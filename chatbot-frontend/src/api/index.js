import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request: attach JWT ──────────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        const newToken = data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: d => api.post('/auth/register', d),
  login:    d => api.post('/auth/login', d),
  refresh:  d => api.post('/auth/refresh', d),
  changePassword: d => api.post('/auth/change-password', d),
}

// ── User ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getMe:         () => api.get('/users/me'),
  updateProfile: d  => api.patch('/users/me', d),
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage:        d  => api.post('/chat/message', d),
  createConversation: d  => api.post('/chat/conversations', d),
  getConversations:   () => api.get('/chat/conversations'),
  getConversation:    id => api.get(`/chat/conversations/${id}`),
  archiveConversation:id => api.patch(`/chat/conversations/${id}/archive`),
  deleteConversation: id => api.delete(`/chat/conversations/${id}`),
}

// ── Documents ────────────────────────────────────────────────────────────────
export const documentAPI = {
  upload: (file, type = 'GENERAL') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    return api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  ask:     d  => api.post('/documents/ask', d),
  list:    () => api.get('/documents'),
  delete:  id => api.delete(`/documents/${id}`),
}

// ── Resume ───────────────────────────────────────────────────────────────────
export const resumeAPI = {
  analyze: file => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/resume/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  generateQuestions: (docId, role) =>
    api.post(`/resume/${docId}/interview-questions`, null, { params: { targetRole: role } }),
  getHistory: () => api.get('/resume/history'),
}

// ── Learning ─────────────────────────────────────────────────────────────────
export const learningAPI = {
  generateRoadmap: d      => api.post('/learning/roadmap', d),
  askQuestion:     (id,d) => api.post(`/learning/ask/${id}`, d),
  generateQuiz:    (t,n)  => api.get('/learning/quiz', { params: { topic: t, count: n } }),
}
