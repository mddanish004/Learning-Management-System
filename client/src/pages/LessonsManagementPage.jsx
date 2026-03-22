import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Loader2,
  Layers,
  AlertTriangle,
  Brain,
  CheckCircle,
  Save,
  Circle,
  Sparkles,
  Eye,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LessonEditorModal from '../components/LessonEditorModal'

function QuizManagerPanel({ courseId }) {
  const [content, setContent] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [apiError, setApiError] = useState('')
  const [retryAfter, setRetryAfter] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [published, setPublished] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [savedQuiz, setSavedQuiz] = useState(null)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  useEffect(() => {
    let cancelled = false
    async function loadExisting() {
      setLoadingSaved(true)
      try {
        const res = await fetch(`/api/v1/ai/quiz/${courseId}`, {
          headers: authHeaders,
          credentials: 'include',
        })
        const data = await res.json()
        if (!cancelled && res.ok && data.quiz && data.quiz.length > 0) {
          setSavedQuiz(data.quiz)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingSaved(false)
      }
    }
    loadExisting()
    return () => { cancelled = true }
  }, [courseId, authHeaders])

  useEffect(() => {
    if (!retryAfter || retryAfter <= 0) return
    const id = setInterval(() => {
      setRetryAfter((v) => (!v || v <= 1) ? 0 : v - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [retryAfter])

  async function handleGenerate(e) {
    e.preventDefault()
    setApiError('')
    setRetryAfter(null)
    setQuizResult(null)
    setPublished(false)
    setSaveError('')

    if (!content.trim()) {
      setApiError('Enter the course material to generate quiz questions from.')
      return
    }

    let count = parseInt(numQuestions, 10)
    if (Number.isNaN(count)) count = 5
    if (count < 1) count = 1
    if (count > 20) count = 20
    setNumQuestions(count)

    setGenerating(true)
    try {
      const res = await fetch('/api/v1/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ lesson_text: content.trim(), num_questions: count }),
        credentials: 'include',
      })

      if (res.status === 429) {
        const header = res.headers.get('Retry-After')
        const seconds = header ? parseInt(header, 10) : NaN
        if (!Number.isNaN(seconds) && seconds > 0) setRetryAfter(seconds)
        setApiError('Rate limit exceeded. Please wait before trying again.')
        return
      }

      const data = await res.json()
      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : data?.error?.message
        setApiError(msg || 'Failed to generate quiz')
        return
      }

      setQuizResult(data.quiz || [])
    } catch {
      setApiError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish() {
    if (!quizResult || quizResult.length === 0 || !courseId) return
    setSaving(true)
    setSaveError('')
    setPublished(false)
    try {
      const res = await fetch('/api/v1/ai/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ course_id: courseId, quiz: quizResult }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : data?.error?.message
        setSaveError(msg || 'Failed to publish quiz')
        return
      }
      setPublished(true)
      setSavedQuiz(quizResult)
    } catch {
      setSaveError('Network error while publishing quiz')
    } finally {
      setSaving(false)
    }
  }

  const hasGenerated = quizResult && quizResult.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-lavender border-2 border-black rounded-full flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg">AI quiz generator</h3>
          <p className="text-xs text-gray-500">Enter course material, generate questions, then publish for learners.</p>
        </div>
        <div className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-sunshine border-2 border-black rounded-full text-xs font-heading font-bold shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          AI
        </div>
      </div>

      {savedQuiz && !hasGenerated && !generating && (
        <div className="bg-mint/20 border-2 border-black rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-charcoal shrink-0 mt-0.5" />
          <div>
            <p className="font-heading font-bold text-sm">Quiz published ({savedQuiz.length} questions)</p>
            <p className="text-xs text-gray-600 mt-0.5">Learners can see this quiz. Generate a new one below to replace it.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="font-heading font-bold text-sm mb-1.5 block">Course material</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Paste or type the course material that the AI will use to generate quiz questions..."
            className="w-full px-4 py-2.5 border-2 border-black rounded-xl font-body text-sm focus:outline-none focus:shadow-brutal-sm bg-white resize-y min-h-[120px]"
          />
          <span className="text-xs text-gray-400 mt-1 block text-right">{content.trim().length} characters</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="font-heading font-bold text-sm mb-1.5 block">Questions</label>
            <input
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                setNumQuestions(Number.isNaN(n) ? '' : n)
              }}
              className="w-20 px-3 py-2 border-2 border-black rounded-xl font-body text-sm focus:outline-none focus:shadow-brutal-sm bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">1–20</p>
          </div>

          {retryAfter > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-700 bg-sunshine/40 border-2 border-black rounded-xl px-3 py-2">
              <Circle className="w-3 h-3 animate-pulse" />
              Retry in {retryAfter}s
            </div>
          )}
        </div>

        {apiError && (
          <div className="bg-coral/10 border-2 border-coral rounded-xl p-3 text-xs sm:text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-coral" />
            <span className="text-coral-dark">{apiError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={generating}
          className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-70"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Generate quiz'}
        </button>
      </form>

      {generating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-ocean mx-auto mb-3" />
            <p className="font-heading font-bold text-gray-600 text-sm">Creating questions...</p>
          </div>
        </div>
      )}

      {hasGenerated && !generating && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <h4 className="font-heading font-bold text-sm">Preview ({quizResult.length} questions)</h4>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {quizResult.map((item, index) => {
              const answerLetter = item.answer || ''
              const answerIndex =
                typeof answerLetter === 'string'
                  ? Math.max(0, Math.min(3, answerLetter.toUpperCase().charCodeAt(0) - 65))
                  : 0
              return (
                <div key={`${item.question}-${index}`} className="border-2 border-black rounded-xl p-3 bg-cream">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center font-heading font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <p className="font-heading font-bold text-sm">{item.question}</p>
                  </div>
                  <div className="space-y-1.5 ml-8">
                    {item.options?.map((option, optIndex) => {
                      const isCorrect = optIndex === answerIndex
                      return (
                        <div
                          key={option}
                          className={`px-3 py-1.5 border-2 border-black rounded-lg text-xs flex items-center gap-2 ${isCorrect ? 'bg-mint' : 'bg-white'}`}
                        >
                          <span className="font-heading font-bold shrink-0">{String.fromCharCode(65 + optIndex)}.</span>
                          <span className="flex-1">{option}</span>
                          {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-charcoal shrink-0" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {saveError && (
            <div className="bg-coral/10 border-2 border-coral rounded-xl p-3 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-coral" />
              <span className="text-coral-dark">{saveError}</span>
            </div>
          )}

          {published && (
            <div className="bg-mint/30 border-2 border-black rounded-xl p-3 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-charcoal" />
              <span>Quiz published. Learners will see these questions when they take the assessment.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || published}
            className="font-heading font-bold px-5 py-2.5 bg-ocean text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Publishing...' : published ? 'Published' : 'Publish quiz for learners'}
          </button>
        </div>
      )}

      {loadingSaved && !hasGenerated && !generating && !savedQuiz && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking for existing quiz...
        </div>
      )}
    </div>
  )
}

function LessonsManagementPage() {
  const { id: courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState('')

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/courses/${courseId}`, { headers, credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setCourse(data.course || data)
    } catch {
      setCourse(null)
    }
  }, [courseId, headers])

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons`, { headers, credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in to manage lessons')
        if (res.status === 403) throw new Error('You do not have permission to manage this course')
        if (res.status === 404) throw new Error('Course not found')
        throw new Error('Failed to load lessons')
      }
      const data = await res.json()
      setLessons(data.lessons || data.data || data || [])
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, headers])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  function handleDragStart(e, index) {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e, dropIndex) {
    e.preventDefault()
    setDraggedIndex(null)
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (isNaN(fromIndex) || fromIndex === dropIndex) return

    const reordered = [...lessons]
    const [item] = reordered.splice(fromIndex, 1)
    reordered.splice(dropIndex, 0, item)
    const lesson_ids = reordered.map((l) => l.id)

    setReordering(true)
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ lesson_ids }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setReorderError(data.error || 'Failed to reorder')
        return
      }
      setLessons(data.lessons || reordered)
      setReorderError('')
    } catch {
      setReorderError('Network error')
    } finally {
      setReordering(false)
    }
  }

  const sortedLessons = [...lessons].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const selectedLesson = selectedId && selectedId !== 'new'
    ? sortedLessons.find((l) => l.id === selectedId)
    : null
  const isAssessmentSelected = selectedLesson?.title === 'Final assessment quiz'
  const showModal = selectedId && !isAssessmentSelected

  function handleLessonClick(lesson) {
    setSelectedId(lesson.id)
  }

  if (loadError && !course) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              <Layers className="w-8 h-8 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Cannot load lessons</h2>
            <p className="text-gray-500 text-sm mb-6">{loadError}</p>
            <Link
              to="/dashboard/instructor/courses"
              className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> My courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <section className="border-b-2 border-black bg-white py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/dashboard/instructor/courses"
                className="p-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="font-heading font-bold text-xl sm:text-2xl truncate">
                  Manage lessons
                </h1>
                <p className="text-gray-500 text-sm truncate">
                  {course?.title || 'Course lessons'}
                </p>
              </div>
            </div>
            <Link
              to={`/dashboard/instructor/courses/${courseId}/edit`}
              className="font-heading font-bold text-sm text-ocean hover:text-ocean-dark transition-colors shrink-0"
            >
              Edit course
            </Link>
          </div>
        </div>
      </section>

      <section className="flex-1 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border-2 border-black shadow-brutal rounded-xl overflow-hidden">
              <div className="p-4 border-b-2 border-black flex items-center justify-between">
                <span className="font-heading font-bold">Lessons</span>
                <button
                  type="button"
                  onClick={() => setSelectedId('new')}
                  className="font-heading font-bold px-3 py-1.5 bg-coral text-white border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center gap-1.5 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {loading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sortedLessons.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No lessons yet. Click Add to create one.
                </div>
              ) : (
                <ul className="divide-y-2 divide-gray-100 max-h-[400px] overflow-y-auto">
                  {sortedLessons.map((lesson, index) => {
                    const isAssessment = lesson.title === 'Final assessment quiz'
                    return (
                      <li
                        key={lesson.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`flex items-center gap-2 p-3 cursor-move hover:bg-gray-50 transition-colors ${
                          selectedId === lesson.id ? 'bg-ocean/10' : ''
                        } ${draggedIndex === index ? 'opacity-50' : ''}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <div className="text-gray-400 shrink-0">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-heading font-bold shrink-0 border-2 border-black ${isAssessment ? 'bg-lavender' : 'bg-cream'}`}>
                          {isAssessment ? <Brain className="w-3.5 h-3.5" /> : (lesson.order_index ?? index + 1)}
                        </span>
                        <span className="flex-1 truncate font-medium text-sm">{lesson.title}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
              {reorderError && (
                <div className="p-2 border-t-2 border-coral/30 bg-coral/10 flex items-center justify-center gap-2 text-sm text-coral-dark">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {reorderError}
                </div>
              )}
              {reordering && (
                <div className="p-2 border-t-2 border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Reordering...
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {isAssessmentSelected ? (
                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 sm:p-8">
                  <QuizManagerPanel courseId={courseId} />
                </div>
              ) : (
                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 sm:p-8 min-h-[280px] flex items-center justify-center">
                  <div className="text-center py-8 text-gray-500 max-w-sm">
                    <Layers className="w-14 h-14 mx-auto mb-4 opacity-50" />
                    <p className="font-heading font-bold text-lg mb-1">Lesson detail / editor</p>
                    <p className="text-sm mb-6">Select a lesson from the list or click Add to open the editor modal.</p>
                    <button
                      type="button"
                      onClick={() => setSelectedId('new')}
                      className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {showModal && (
        <LessonEditorModal
          courseId={courseId}
          lessonId={selectedId}
          onClose={() => setSelectedId(isAssessmentSelected ? selectedId : null)}
          onSaved={(updated) => {
            if (selectedId === 'new' && updated) {
              setLessons((prev) => [...prev, updated].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)))
            } else if (updated) {
              setLessons((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
            }
          }}
          onDeleted={() => {
            if (selectedId !== 'new') {
              setLessons((prev) => prev.filter((l) => l.id !== selectedId))
            }
            setSelectedId(null)
          }}
        />
      )}
    </div>
  )
}

export default LessonsManagementPage
