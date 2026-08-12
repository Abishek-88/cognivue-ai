import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, Upload, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Lightbulb, Target, Code, Users
} from 'lucide-react'
import { resumeAPI } from '../api'
import { FileDropzone, ScoreRing, ProgressBar, Spinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TABS = ['Overview', 'Skills', 'Suggestions', 'Interview Questions']

const QUESTION_CATEGORIES = [
  { key: 'technicalQuestions',   label: 'Technical',    icon: Code,   color: 'blue' },
  { key: 'behavioralQuestions',  label: 'Behavioral',   icon: Users,  color: 'purple' },
  { key: 'roleSpecificQuestions',label: 'Role-Specific', icon: Target, color: 'green' },
  { key: 'hrQuestions',          label: 'HR',           icon: Users,  color: 'yellow' },
  { key: 'codingChallenges',     label: 'Coding',       icon: Code,   color: 'red' },
]

export default function ResumePage() {
  const [file, setFile]             = useState(null)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [questions, setQuestions]   = useState(null)
  const [loadingQ, setLoadingQ]     = useState(false)
  const [tab, setTab]               = useState('Overview')
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [expanded, setExpanded]     = useState({})

  async function analyze() {
    if (!file) { toast.error('Please upload a resume PDF'); return }
    setLoading(true)
    setResult(null); setQuestions(null)
    try {
      const { data } = await resumeAPI.analyze(file)
      setResult(data.data)
      toast.success('Resume analyzed!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    } finally { setLoading(false) }
  }

  async function generateQuestions() {
    if (!result?.documentId) return
    setLoadingQ(true)
    try {
      const { data } = await resumeAPI.generateQuestions(result.documentId, targetRole)
      setQuestions(data.data)
      setTab('Interview Questions')
      toast.success('Questions generated!')
    } catch { toast.error('Failed to generate questions') }
    finally { setLoadingQ(false) }
  }

  function toggleQ(key, i) {
    setExpanded(p => ({ ...p, [`${key}-${i}`]: !p[`${key}-${i}`] }))
  }

  const skills = result?.extractedSkills?.split(',').map(s => s.trim()).filter(Boolean) || []
  const missing = result?.missingSkills?.split(',').map(s => s.trim()).filter(Boolean) || []
  const suggestions = result?.suggestions?.split('\n').filter(Boolean) || []

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Upload card */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-500" /> Resume Analyzer
          </h2>
          <FileDropzone onFile={setFile} label="Upload your Resume (PDF)" />
          <button onClick={analyze} disabled={!file || loading} className="btn-primary mt-4 w-full justify-center py-2.5">
            {loading ? <><Spinner size="sm" /> Analyzing…</> : <><Upload size={16} /> Analyze Resume</>}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {/* ATS Score hero */}
              <div className="card p-6 mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ScoreRing score={result.atsScore} size={140} />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">ATS Score</h3>
                    <p className="text-sm text-slate-500 mb-3">
                      {result.atsScore >= 80 ? '🎉 Excellent! Your resume is ATS-optimized.'
                       : result.atsScore >= 60 ? '👍 Good. A few tweaks will improve your score.'
                       : '⚠️ Needs work. Follow the suggestions below.'}
                    </p>
                    <div className="mb-2">
                      <ProgressBar value={result.atsScore} />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {result.experienceLevel && (
                        <span className="badge badge-blue">{result.experienceLevel}</span>
                      )}
                      {result.targetRoles?.split(',').slice(0, 3).map(r => (
                        <span key={r} className="badge badge-purple">{r.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate questions bar */}
              <div className="card p-4 mb-4 flex flex-col sm:flex-row items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Generate Interview Questions</span>
                <input
                  className="input-field flex-1 py-1.5"
                  placeholder="Target role (e.g. Backend Developer)"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                />
                <button onClick={generateQuestions} disabled={loadingQ} className="btn-primary shrink-0">
                  {loadingQ ? <Spinner size="sm" /> : 'Generate'}
                </button>
              </div>

              {/* Tabs */}
              <div className="card overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                  {TABS.filter(t => t !== 'Interview Questions' || questions).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={clsx(
                        'px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                        tab === t
                          ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Overview */}
                  {tab === 'Overview' && (
                    <div>
                      <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Summary</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.resumeSummary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {tab === 'Skills' && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                          <CheckCircle size={15} className="text-emerald-500" /> Detected Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.map(s => <span key={s} className="badge badge-green">{s}</span>)}
                        </div>
                      </div>
                      {missing.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <AlertCircle size={15} className="text-amber-500" /> Missing Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {missing.map(s => <span key={s} className="badge badge-yellow">{s}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestions */}
                  {tab === 'Suggestions' && (
                    <div className="space-y-3">
                      {suggestions.map((s, i) => (
                        <motion.div
                          key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800"
                        >
                          <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-700 dark:text-slate-200">{s}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Interview Questions */}
                  {tab === 'Interview Questions' && questions && (
                    <div className="space-y-6">
                      {QUESTION_CATEGORIES.map(({ key, label, icon: Icon, color }) => {
                        const qs = questions[key] || []
                        if (!qs.length) return null
                        const badgeClass = {
                          blue: 'badge-blue', purple: 'badge-purple',
                          green: 'badge-green', yellow: 'badge-yellow', red: 'badge-red'
                        }[color]
                        return (
                          <div key={key}>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                              <Icon size={15} /> {label} Questions
                              <span className={`badge ${badgeClass}`}>{qs.length}</span>
                            </h4>
                            <div className="space-y-2">
                              {qs.map((q, i) => (
                                <div key={i}
                                  onClick={() => toggleQ(key, i)}
                                  className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 cursor-pointer hover:border-brand-300 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm text-slate-700 dark:text-slate-200">{q}</p>
                                    {expanded[`${key}-${i}`]
                                      ? <ChevronUp size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                      : <ChevronDown size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
