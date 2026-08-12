# AI Chatbot — React Frontend

## Tech Stack
- **React 18** + Vite 5
- **Tailwind CSS** — utility-first styling with custom design tokens
- **Framer Motion** — animations
- **React Router v6** — client-side routing
- **Axios** — HTTP with auto JWT refresh interceptor
- **React Markdown** + Syntax Highlighter — rich AI responses
- **React Dropzone** — PDF upload
- **React Hot Toast** — notifications
- **Lucide React** — icons

---

## Features
- 🔐 JWT auth + Google OAuth2 login
- 💬 Full chat with conversation history + memory
- 🌍 5 languages (EN/TA/HI/TE/ML) with voice input/output
- 📄 Document upload → RAG Q&A
- 📝 Resume analyzer with ATS score
- 🎓 Learning roadmap generator + quiz
- 🌙 Dark mode

---

## Quick Start

```bash
npm install
npm run dev
```

Runs on http://localhost:5173 (proxies API to http://localhost:8080)

---

## Project Structure

```
src/
├── api/
│   └── index.js           # All API calls + Axios interceptors
├── context/
│   ├── AuthContext.jsx    # Global user state, login/logout
│   └── ThemeContext.jsx   # Dark/light mode
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx  # Shell with sidebar + topbar
│   │   ├── Sidebar.jsx    # Nav + conversation list
│   │   └── TopBar.jsx     # Header + theme toggle
│   ├── chat/
│   │   ├── ChatMessage.jsx # Markdown message bubble
│   │   └── ChatInput.jsx   # Textarea + voice + language
│   └── ui/
│       └── Spinner.jsx    # Spinner, Modal, FileDropzone, ScoreRing, etc.
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── OAuthCallbackPage.jsx
│   ├── ChatPage.jsx
│   ├── DocumentsPage.jsx
│   ├── ResumePage.jsx
│   ├── LearningPage.jsx
│   └── ProfilePage.jsx
├── hooks/index.js         # useConversations, useVoiceOutput, useLocalStorage
├── utils/index.js         # formatDate, formatBytes, getErrorMessage, etc.
├── App.jsx                # Routes + providers
├── main.jsx               # Entry point
└── index.css              # Tailwind + global styles
```

---

## Environment / Config

The Vite dev server proxies `/api` and `/oauth2` to `http://localhost:8080`.
For production (Vercel), set these in `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-backend.onrender.com/api/:path*" },
    { "source": "/oauth2/:path*", "destination": "https://your-backend.onrender.com/oauth2/:path*" }
  ]
}
```

---

## Build for Production

```bash
npm run build
# dist/ folder is ready to deploy on Vercel, Netlify, etc.
```
