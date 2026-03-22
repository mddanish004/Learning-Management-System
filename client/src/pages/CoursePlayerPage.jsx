import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Check,
  CheckCircle,
  Brain,
  Loader2,
  BookOpen,
  List,
  X,
  AlertTriangle,
  RefreshCw,
  Award,
  FileText,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../hooks/useAuth'

function CoursePlayerPage() {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin'
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [courseError, setCourseError] = useState(null)
  const [accessError, setAccessError] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [completingId, setCompletingId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  const fetchCourse = useCallback(async () => {
    try {
      const courseHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`/api/v1/courses/${courseId}`, { headers: courseHeaders, credentials: 'include' })
      if (!res.ok) {
        if (res.status === 404) throw new Error('Course not found')
        throw new Error('Failed to load course')
      }
      const data = await res.json()
      setCourse(data.course || data)
    } catch (err) {
      setCourseError(err.message)
    }
  }, [courseId, token])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  useEffect(() => {
    setSelectedLesson(null)
    setLessons([])
    setProgress(null)
  }, [courseId])

  useEffect(() => {
    if (!course || courseError) return
    setLoading(true)
    setAccessError(null)
    if (!token) {
      setAccessError('Please log in to view course content')
      setLoading(false)
      return
    }
    Promise.all([
      fetch(`/api/v1/courses/${courseId}/lessons`, { headers, credentials: 'include' }),
      fetch(`/api/v1/progress/${courseId}`, { headers, credentials: 'include' }),
    ])
      .then(async ([lessonsRes, progressRes]) => {
        if (lessonsRes.ok) {
          const lessonsData = await lessonsRes.json()
          const list = lessonsData.lessons || lessonsData.data || lessonsData || []
          setLessons(list)
          setSelectedLesson(list[0] || null)
        } else {
          if (lessonsRes.status === 403) setAccessError('Enroll in this course to access lessons')
          else setAccessError('Failed to load lessons')
        }
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setProgress(progressData)
        } else {
          setProgress(null)
          if (progressRes.status === 403) setAccessError('Enroll in this course to track progress')
        }
      })
      .catch(() => setAccessError('Network error'))
      .finally(() => setLoading(false))
  }, [courseId, course, courseError, token, headers])

  async function handleMarkComplete(lessonId) {
    if (!token) {
      navigate('/auth/login')
      return
    }
    setCompletingId(lessonId)
    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({}),
        credentials: 'include',
      })
      if (res.ok) {
        const progressRes = await fetch(`/api/v1/progress/${courseId}`, { headers, credentials: 'include' })
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          setProgress(progressData)
        }
      }
    } finally {
      setCompletingId(null)
    }
  }

  const completedSet = progress?.lessons_progress
    ? new Set(progress.lessons_progress.filter((p) => p.completed).map((p) => p.lesson_id))
    : new Set()
  const sortedLessons = [...lessons].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const completionPct = progress?.completion_percentage ?? 0
  const isCompleted = selectedLesson && completedSet.has(selectedLesson.id)
  const isAssessmentLesson = selectedLesson && selectedLesson.title === 'Final assessment quiz'

  if (courseError && !course) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Cannot load course</h2>
            <p className="text-gray-500 text-sm mb-6">{courseError}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/courses"
                className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Courses
              </Link>
              <button
                onClick={() => { setCourseError(null); fetchCourse() }}
                className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <header className="bg-white border-b-2 border-black py-3 px-4 shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to={`/courses/${courseId}`}
                className="p-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="font-heading font-bold text-lg sm:text-xl truncate">
                  {course?.title || 'Course'}
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm truncate">
                  {progress ? `${completionPct}% complete` : 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-24 sm:w-32 h-3 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-mint rounded-full transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <Link
                to={`/courses/${courseId}/resources`}
                className="font-heading font-bold px-3 py-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4" /> Resources
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className="lg:hidden font-heading font-bold px-3 py-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <List className="w-5 h-5" /> Lessons
              </button>
            </div>
          </div>
          <div className="sm:hidden mt-2">
            <div className="w-full h-2.5 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
              <div
                className="h-full bg-mint rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <aside
          className={`${
            sidebarOpen ? 'fixed inset-0 z-40 bg-cream/95 lg:bg-transparent lg:relative lg:block' : 'hidden lg:block'
          } lg:w-80 xl:w-96 shrink-0 border-b-2 lg:border-b-0 lg:border-r-2 border-black bg-white`}
        >
          <div className="flex items-center justify-between p-4 border-b-2 border-black lg:border-b-2">
            <span className="font-heading font-bold">Lessons</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 border-2 border-black rounded-xl hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-12rem)] p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 border-2 border-black rounded-xl animate-pulse" />
                ))}
              </div>
            ) : accessError ? (
              <div className="p-4">
                <div className="bg-coral/10 border-2 border-coral rounded-xl p-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-coral mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-heading font-bold text-coral-dark mb-1">Access required</p>
                    <p>{accessError}</p>
                    <Link
                      to={`/courses/${courseId}`}
                      className="inline-block mt-3 font-heading font-bold text-sm text-ocean hover:underline"
                    >
                      View course & enroll →
                    </Link>
                  </div>
                </div>
              </div>
            ) : sortedLessons.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No lessons in this course yet.
              </div>
            ) : (
              <ul className="space-y-1 p-2">
                {sortedLessons.map((lesson, index) => {
                  const completed = completedSet.has(lesson.id)
                  const active = selectedLesson?.id === lesson.id
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLesson(lesson)
                          setSidebarOpen(false)
                        }}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                          active
                            ? 'bg-ocean/20 border-ocean shadow-brutal-sm'
                            : 'border-black hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg border-2 border-black bg-cream flex items-center justify-center shrink-0 font-heading font-bold text-sm">
                          {completed ? <Check className="w-4 h-4 text-mint" strokeWidth={3} /> : index + 1}
                        </span>
                        <span className="flex-1 truncate font-medium text-sm">{lesson.title}</span>
                        {completed && (
                          <CheckCircle className="w-5 h-5 text-mint shrink-0" strokeWidth={2} />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col p-4 sm:p-6">
          {loading && !accessError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-ocean mx-auto mb-4" />
                <p className="font-heading font-bold text-gray-600">Loading content...</p>
              </div>
            </div>
          ) : accessError && sortedLessons.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-8 max-w-md text-center">
                <AlertTriangle className="w-14 h-14 text-coral mx-auto mb-4" />
                <h2 className="font-heading font-bold text-xl mb-2">Enroll to learn</h2>
                <p className="text-gray-600 text-sm mb-6">{accessError}</p>
                <Link
                  to={`/courses/${courseId}`}
                  className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-block"
                >
                  Go to course
                </Link>
              </div>
            </div>
          ) : !selectedLesson ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Play className="w-14 h-14 mx-auto mb-3 opacity-50" />
                <p className="font-heading font-bold text-lg">Select a lesson</p>
                <p className="text-sm">Choose one from the sidebar to start.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 sm:gap-6 max-w-4xl">
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
                <h2 className="font-heading font-bold text-lg sm:text-xl p-4 sm:p-5 border-b-2 border-black">
                  {selectedLesson.title}
                </h2>
                {selectedLesson.youtube_video_id && !isAssessmentLesson && (
                  <div className="relative w-full bg-charcoal" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      title={selectedLesson.title}
                      src={`https://www.youtube.com/embed/${selectedLesson.youtube_video_id}`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                {selectedLesson.content_text && (!isAssessmentLesson || isInstructor) && (
                  <div className="p-4 sm:p-5 border-t-2 border-black">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-body">
                      {selectedLesson.content_text}
                    </div>
                  </div>
                )}
                <div className="p-4 sm:p-5 border-t-2 border-black flex flex-wrap items-center gap-3">
                  {!isAssessmentLesson && (
                    <button
                      type="button"
                      onClick={() => handleMarkComplete(selectedLesson.id)}
                      disabled={completingId === selectedLesson.id || isCompleted}
                      className="font-heading font-bold px-5 py-2.5 bg-mint text-black border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {completingId === selectedLesson.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      )}
                      {isCompleted ? 'Completed' : 'Mark complete'}
                    </button>
                  )}
                  {isAssessmentLesson && !isInstructor && (
                    <span className="text-xs sm:text-sm text-gray-600">
                      Complete the final assessment quiz to finish this course.
                    </span>
                  )}
                  {isAssessmentLesson && !isInstructor && (
                    <Link
                      to={`/quiz?lessonId=${selectedLesson.id}&courseId=${courseId}`}
                      className="font-heading font-bold px-5 py-2.5 bg-lavender text-black border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" /> Take assessment quiz
                    </Link>
                  )}
                  {isAssessmentLesson && isInstructor && (
                    <Link
                      to={`/dashboard/instructor/courses/${courseId}/lessons`}
                      className="font-heading font-bold px-5 py-2.5 bg-lavender text-black border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" /> Manage quiz in lessons
                    </Link>
                  )}
                </div>
              </div>

              {completionPct >= 100 && (
                <div className="bg-mint/20 border-2 border-black shadow-brutal rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-mint border-2 border-black rounded-full flex items-center justify-center shrink-0 shadow-brutal-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg">Course completed!</h3>
                    <p className="text-sm text-gray-600">
                      You finished all lessons. Claim your certificate now.
                    </p>
                  </div>
                  <Link
                    to={`/certificates/${courseId}`}
                    className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 text-sm shrink-0"
                  >
                    <Award className="w-4 h-4" /> Get Certificate
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}

export default CoursePlayerPage
