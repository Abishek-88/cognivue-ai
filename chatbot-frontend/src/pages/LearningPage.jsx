import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Map, HelpCircle, ChevronDown, ChevronUp,
  CheckCircle, Circle, Trophy, Zap, RotateCcw
} from 'lucide-react'
import { learningAPI } from '../api'
import { Spinner } from '../components/ui/Spinner'
import ChatMessage from '../components/chat/ChatMessage'
import ChatInput from '../components/chat/ChatInput'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const QUICK_TOPICS = ['DSA', 'System Design', 'React', 'Spring Boot', 'Machine Learning', 'SQL', 'Docker', 'DevOps']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function LearningPage() {
  const [tab, setTab]             = useState('roadmap')
  const [topic, setTopic]         = useState('')
  const [level, setLevel]         = useState('Beginner')
  const [loading, setLoading]     = useState(false)
  const [roadmap, setRoadmap]     = useState(null)
  const [convId, setConvId]       = useState(null)
  const [messages, setMessages]   = useState([])
  const [sending, setSending]     = useState(false)
  const [openWeek, setOpenWeek]   = useState(0)
  const [quiz, setQuiz]           = useState(null)
  const [quizTopic, setQuizTopic] = useState('')
  const [quizLoading, setQuizLoading] = useState(false)
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const bottomRef = useRef(null)

  async function generateRoadmap() {
    if (!topic.trim()) { toast.error('Enter a topic'); return }
    setLoading(true)
    try {
      const { data } = await learningAPI.generateRoadmap({ topic, currentLevel: level })
      setRoadmap(data.data)
      setConvId(data.data.conversationId)
      setMessages([])
      toast.success('Roadmap generated!')
    } catch { toast.error('Failed to generate roadmap') }
    finally { setLoading(false) }
  }

  async function handleAsk(question, lang) {
    if (!convId) return
    const tempMsg = { id: Date.now(), sender: 'USER', message: question, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    setSending(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    try {
      const { data } = await learningAPI.askQuestion(convId, { question })
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempMsg.id),
        { id: Date.now() + 1, sender: 'USER', message: question, timestamp: new Date().toISOString() },
        { id: Date.now() + 2, sender: 'AI', message: data.data, timestamp: new Date().toISOString() },
      ])
    } catch { toast.error('Failed to ask question') }
    finally { setSending(false) }
  }

  async function generateQuiz() {
    if (!quizTopic.trim()) { toast.error('Enter a quiz topic'); return }
    setQuizLoading(true)
    setAnswers({}); setSubmitted(false)
    try {
      const { data } = await learningAPI.generateQuiz(quizTopic, 5)
      setQuiz(data.data)
      toast.success('Quiz ready!')
    } catch { toast.error('Failed to generate quiz') }
    finally { setQuizLoading(false) }
  }

  function submitQuiz() {
    if (Object.keys(answers).length < (quiz?.questions?.length || 0)) {
      toast.error('Answer all questions first'); return
    }
    setSubmitted(true)
  }

  const score = submitted && quiz
    ? quiz.questions.filter((q, i) => answers[i] === q.correctAnswer).length
    : 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-900 shrink-0">
        {[
          { key: 'roadmap', label: 'Learning Roadmap', icon: Map },
          { key: 'chat',    label: 'Ask Questions',    icon: BookOpen },
          { key: 'quiz',    label: 'Quiz',             icon: HelpCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Roadmap tab ── */}
        {tab === 'roadmap' && (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Input */}
            <div className="card p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Topic</label>
                <input
                  className="input-field"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateRoadmap()}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_TOPICS.map(t => (
                    <button key={t} onClick={() => setTopic(t)}
                      className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:text-brand-600 transition-colors">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Your Level</label>
                <div className="flex gap-2">
                  {LEVELS.map(l => (
                    <button key={l} onClick={() => setLevel(l)}
                      className={clsx(
                        'flex-1 py-2 rounded-xl text-sm font-medium border transition-all',
                        level === l
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={generateRoadmap} disabled={loading} className="btn-primary w-full justify-center py-2.5">
                {loading ? <><Spinner size="sm" /> Generating…</> : <><Zap size={16} /> Generate Roadmap</>}
              </button>
            </div>

            {/* Roadmap display */}
            <AnimatePresence>
              {roadmap && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="card p-5 mb-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{roadmap.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">⏱ {roadmap.totalDuration}</p>
                    {roadmap.milestones?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {roadmap.milestones.map(m => (
                          <span key={m} className="badge badge-purple">{m}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {roadmap.weeks?.map((week, i) => (
                      <div key={i} className="card overflow-hidden">
                        <button
                          onClick={() => setOpenWeek(openWeek === i ? -1 : i)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                            <span className="text-brand-700 dark:text-brand-300 font-bold text-sm">{week.week}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Week {week.week}</p>
                            <p className="text-xs text-slate-500 truncate">{week.topic}</p>
                          </div>
                          {openWeek === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>

                        <AnimatePresence>
                          {openWeek === i && (
                            <motion.div
                              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3 grid sm:grid-cols-3 gap-4">
                                {[
                                  { label: 'Resources', items: week.resources, color: 'text-blue-600' },
                                  { label: 'Tasks', items: week.tasks, color: 'text-emerald-600' },
                                  { label: 'Quiz Topics', items: week.quiz, color: 'text-amber-600' },
                                ].map(({ label, items, color }) => (
                                  <div key={label}>
                                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>{label}</p>
                                    <ul className="space-y-1.5">
                                      {items?.map((item, j) => (
                                        <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                          <Circle size={8} className="mt-1.5 shrink-0 text-slate-300" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Chat tab ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            {!convId && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Generate a roadmap first, then come here to ask follow-up questions.</p>
                </div>
              </div>
            )}
            {convId && (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm mb-4">Ask anything about your learning roadmap</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['Explain week 1 in detail', 'What resources should I use?', 'Give me practice problems'].map(q => (
                          <button key={q} onClick={() => handleAsk(q, 'en')}
                            className="text-xs border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 transition-colors">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map(m => <ChatMessage key={m.id} message={m} />)}
                  <div ref={bottomRef} />
                </div>
                <ChatInput onSend={handleAsk} disabled={sending} placeholder="Ask about your learning plan…" />
              </>
            )}
          </div>
        )}

        {/* ── Quiz tab ── */}
        {tab === 'quiz' && (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="card p-5 flex gap-3">
              <input
                className="input-field flex-1"
                placeholder="Quiz topic (e.g. Binary Trees)"
                value={quizTopic}
                onChange={e => setQuizTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateQuiz()}
              />
              <button onClick={generateQuiz} disabled={quizLoading} className="btn-primary shrink-0">
                {quizLoading ? <Spinner size="sm" /> : 'Start Quiz'}
              </button>
            </div>

            <AnimatePresence>
              {quiz && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {submitted && (
                    <div className={clsx(
                      'card p-5 flex items-center gap-4',
                      score === quiz.questions.length ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                    )}>
                      <Trophy size={32} className={score === quiz.questions.length ? 'text-emerald-500' : 'text-amber-500'} />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {score}/{quiz.questions.length} correct
                        </p>
                        <p className="text-sm text-slate-500">
                          {score === quiz.questions.length ? 'Perfect score! 🎉' : 'Keep practising!'}
                        </p>
                      </div>
                      <button onClick={() => { setAnswers({}); setSubmitted(false) }}
                        className="btn-secondary ml-auto text-xs">
                        <RotateCcw size={13} /> Retry
                      </button>
                    </div>
                  )}

                  {quiz.questions.map((q, i) => (
                    <div key={i} className="card p-5">
                      <p className="font-medium text-slate-800 dark:text-slate-100 mb-3 text-sm">
                        {i + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, j) => {
                          const letter = opt[0]
                          const isSelected = answers[i] === letter
                          const isCorrect  = submitted && letter === q.correctAnswer
                          const isWrong    = submitted && isSelected && letter !== q.correctAnswer
                          return (
                            <button
                              key={j}
                              disabled={submitted}
                              onClick={() => !submitted && setAnswers(p => ({ ...p, [i]: letter }))}
                              className={clsx(
                                'w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all',
                                isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                  : isWrong ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                  : isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200'
                              )}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                      {submitted && q.explanation && (
                        <p className="text-xs text-slate-500 mt-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {!submitted && (
                    <button onClick={submitQuiz} className="btn-primary w-full justify-center py-2.5">
                      <CheckCircle size={16} /> Submit Answers
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
