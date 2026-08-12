import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Upload, Trash2, MessageSquare,
  CheckCircle, Clock, AlertCircle, Loader, RefreshCw
} from 'lucide-react'
import { documentAPI } from '../api'
import { FileDropzone, Modal, EmptyState, TypingIndicator } from '../components/ui/Spinner'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const STATUS_ICON = {
  READY:      <CheckCircle size={14} className="text-emerald-500" />,
  PROCESSING: <Loader size={14} className="text-amber-500 animate-spin" />,
  PENDING:    <Clock size={14} className="text-slate-400" />,
  FAILED:     <AlertCircle size={14} className="text-red-500" />,
}

export default function DocumentsPage() {
  const [docs, setDocs]             = useState([])
  const [uploading, setUploading]   = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [activeDoc, setActiveDoc]   = useState(null)
  const [messages, setMessages]     = useState([])
  const [convId, setConvId]         = useState(null)
  const [sending, setSending]       = useState(false)
  const [file, setFile]             = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => { loadDocs() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  async function loadDocs() {
    try {
      const { data } = await documentAPI.list()
      setDocs(data.data || [])
    } catch { toast.error('Could not load documents') }
  }

  async function handleUpload() {
    if (!file) { toast.error('Please select a PDF file'); return }
    setUploading(true)
    try {
      const { data } = await documentAPI.upload(file)
      toast.success('Document uploaded! Processing in background…')
      setDocs(prev => [data.data, ...prev])
      setShowUpload(false)
      setFile(null)
      // Poll for status
      pollStatus(data.data.id)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally { setUploading(false) }
  }

  function pollStatus(docId) {
    const interval = setInterval(async () => {
      try {
        const { data } = await documentAPI.list()
        const doc = (data.data || []).find(d => d.id === docId)
        if (doc) {
          setDocs(data.data)
          if (doc.status === 'READY' || doc.status === 'FAILED') clearInterval(interval)
        }
      } catch { clearInterval(interval) }
    }, 3000)
    setTimeout(() => clearInterval(interval), 120000)
  }

  async function deleteDoc(id) {
    try {
      await documentAPI.delete(id)
      setDocs(prev => prev.filter(d => d.id !== id))
      if (activeDoc?.id === id) { setActiveDoc(null); setMessages([]) }
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  async function handleAsk(question, lang) {
    if (!activeDoc) return
    const tempMsg = { id: Date.now(), sender: 'USER', message: question, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    setSending(true)
    try {
      const { data } = await documentAPI.ask({
        question, documentId: activeDoc.id, conversationId: convId, languageCode: lang
      })
      const { conversationId, userMessage, aiMessage } = data.data
      setConvId(conversationId)
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), userMessage, aiMessage])
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      toast.error(err.response?.data?.error || 'Failed to get answer')
    } finally { setSending(false) }
  }

  function openDoc(doc) {
    if (doc.status !== 'READY') { toast('Document is still processing…'); return }
    setActiveDoc(doc)
    setMessages([])
    setConvId(null)
  }

  return (
    <div className="flex h-full">
      {/* Left: doc list */}
      <div className="w-80 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">My Documents</h2>
          <div className="flex gap-1">
            <button onClick={loadDocs} className="btn-ghost p-1.5"><RefreshCw size={14} /></button>
            <button onClick={() => setShowUpload(true)} className="btn-primary py-1.5 px-3 text-xs">
              <Upload size={13} /> Upload
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {docs.length === 0 && (
            <EmptyState icon={FileText} title="No documents" description="Upload a PDF to get started." />
          )}
          {docs.map(doc => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => openDoc(doc)}
              className={clsx(
                'group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                activeDoc?.id === doc.id
                  ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-700'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <FileText size={18} className="text-brand-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{doc.originalName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {STATUS_ICON[doc.status]}
                  <span className="text-xs text-slate-400 capitalize">{doc.status?.toLowerCase()}</span>
                  {doc.pageCount && <span className="text-xs text-slate-400">· {doc.pageCount}p</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(doc.uploadTime), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteDoc(doc.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 hover:text-red-500 text-slate-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: chat panel */}
      <div className="flex-1 flex flex-col">
        {!activeDoc ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a document"
              description="Choose a ready document from the left to start asking questions using AI."
            />
          </div>
        ) : (
          <>
            {/* Doc header */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900 shrink-0">
              <FileText size={16} className="text-brand-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate">{activeDoc.originalName}</span>
              {activeDoc.isScanned && <span className="badge badge-yellow">OCR</span>}
              <span className="badge badge-green ml-auto">Ready</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">Ask anything about this document</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Summarize this document', 'What are the key points?', 'List the main topics'].map(q => (
                      <button key={q} onClick={() => handleAsk(q, 'en')}
                        className="text-xs border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
              {sending && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                    <span className="text-white text-xs">AI</span>
                  </div>
                  <div className="chat-bubble-ai"><TypingIndicator /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <ChatInput onSend={handleAsk} disabled={sending} placeholder="Ask about this document…" />
          </>
        )}
      </div>

      {/* Upload modal */}
      <Modal open={showUpload} onClose={() => { setShowUpload(false); setFile(null) }} title="Upload PDF Document">
        <FileDropzone onFile={setFile} />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => { setShowUpload(false); setFile(null) }} className="btn-secondary">Cancel</button>
          <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary">
            {uploading ? 'Uploading…' : 'Upload & Process'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
