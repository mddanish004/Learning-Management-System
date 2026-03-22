import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Circle,
  BarChart3,
  Layers,
  Award,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function CourseProgressPage() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessError, setAccessError] = useState('')

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      setAccessError('')
      try {
        const courseHeaders = token ? { Authorization: `Bearer ${token}` } : {}
        const courseRes = await fetch(`/api/v1/courses/${courseId}`, { headers: courseHeaders, credentials: 'include' })
        if (!courseRes.ok) {
          if (courseRes.status === 404) {
            if (!cancelled) setError('Course not found')
            return
          }
          if (!cancelled) setError('Failed to load course')
          return
        }
        const courseData = await courseRes.json()
        if (!cancelled) setCourse(courseData.course || courseData)
      } catch {
        if (!cancelled) {
          setError('Failed to load course')
          setLoading(false)
        }
        return
      }

      if (!token) {
        if (!cancelled) {
          setAccessError('Please log in to view your course progress')
          setProgress(null)
          setLoading(false)
        }
        return
      }

      try {
        const progressRes = await fetch(`/api/v1/progress/${courseId}`, { headers, credentials: 'include' })
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          if (!cancelled) setProgress(progressData)
        } else if (progressRes.status === 403) {
          if (!cancelled) {
            setAccessError('You must be enrolled in this course to view progress')
            setProgress(null)
          }
        } else {
          if (!cancelled) {
            setAccessError('Failed to load progress')
            setProgress(null)
          }
        }
      } catch {
        if (!cancelled) {
          setAccessError('Network error while loading progress')
          setProgress(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [courseId, token, headers])

  const totalLessons = progress?.total_lessons ?? 0
  const completedLessons = progress?.completed_lessons ?? 0
  const completionPercentage = progress?.completion_percentage ?? 0
  const enrollmentStatus = progress?.enrollment_status

  function getStatusLabel() {
    if (!token) return 'Guest'
    if (!progress && accessError) return 'Not enrolled'
    if (!enrollmentStatus) return 'Unknown'
    if (enrollmentStatus === 'completed') return 'Completed'
    if (enrollmentStatus === 'active') return 'In progress'
    return enrollmentStatus.charAt(0).toUpperCase() + enrollmentStatus.slice(1)
  }

  function getStatusColor() {
    if (!token || (accessError && !progress)) return 'bg-gray-200'
    if (enrollmentStatus === 'completed') return 'bg-mint'
    if (enrollmentStatus === 'active') return 'bg-sunshine'
    return 'bg-lavender'
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Cannot load progress</h2>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <Link
              to="/courses"
              className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Browse courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="bg-white border-b-2 border-black py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to={`/learn/courses/${courseId}`}
              className="p-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-lg sm:text-xl truncate">
                {course?.title || 'Course progress'}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Progress overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 border-black rounded-full text-xs sm:text-sm font-heading font-bold ${getStatusColor()}`}
            >
              <Circle className="w-3 h-3" />
              {getStatusLabel()}
            </span>
          </div>
        </div>
      </div>

      <section className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {loading && (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                <div className="space-y-3 w-full sm:w-auto">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-black bg-gray-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-ocean" />
                  </div>
                  <div className="space-y-2 hidden sm:block">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 border-2 border-black rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && accessError && !progress && (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-coral/10 border-2 border-coral rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-coral" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-lg mb-1">Progress unavailable</h2>
                <p className="text-sm text-gray-600 mb-4">{accessError}</p>
                <div className="flex flex-wrap gap-3">
                  {!token && (
                    <Link
                      to="/auth/login"
                      className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 text-sm"
                    >
                      Log in
                    </Link>
                  )}
                  <Link
                    to={`/courses/${courseId}`}
                    className="font-heading font-bold px-5 py-2.5 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-100 transition-colors text-sm inline-flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View course
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!loading && !accessError && (
            <>
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                  <div className="space-y-2">
                    <h2 className="font-heading font-bold text-xl sm:text-2xl">
                      Completion overview
                    </h2>
                    <p className="text-sm text-gray-600">
                      Track how far you have progressed through this course.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-black bg-cream flex items-center justify-center relative shadow-brutal-sm">
                      <div className="absolute inset-1 rounded-full border-2 border-black bg-white flex items-center justify-center">
                        <span className="font-heading font-bold text-2xl">
                          {completionPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col gap-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>
                          {completedLessons} of {totalLessons} lesson
                          {totalLessons !== 1 ? 's' : ''} completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-mint" />
                        <span>{completionPercentage === 100 ? 'You have finished this course' : 'Keep going to complete this course'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-mint border-2 border-black rounded-xl p-4 flex flex-col justify-between shadow-brutal-sm">
                    <span className="text-xs font-heading uppercase text-gray-700 mb-1">
                      Completion
                    </span>
                    <p className="font-heading font-bold text-2xl">{completionPercentage}%</p>
                  </div>
                  <div className="bg-sunshine border-2 border-black rounded-xl p-4 flex flex-col justify-between shadow-brutal-sm">
                    <span className="text-xs font-heading uppercase text-gray-700 mb-1">
                      Lessons completed
                    </span>
                    <p className="font-heading font-bold text-2xl">
                      {completedLessons}/{totalLessons}
                    </p>
                  </div>
                  <div className="bg-lavender border-2 border-black rounded-xl p-4 flex flex-col justify-between shadow-brutal-sm">
                    <span className="text-xs font-heading uppercase text-gray-700 mb-1">
                      Status
                    </span>
                    <p className="font-heading font-bold text-lg">{getStatusLabel()}</p>
                  </div>
                </div>
              </div>

              {completionPercentage >= 100 && (
                <div className="bg-mint/20 border-2 border-black shadow-brutal rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-mint border-2 border-black rounded-full flex items-center justify-center shrink-0 shadow-brutal-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg">You completed this course!</h3>
                    <p className="text-sm text-gray-600">
                      Generate and download your certificate of completion.
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

              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
                <div className="p-5 sm:p-6 border-b-2 border-black flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-bold text-lg">Lesson checklist</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      See which lessons you have completed so far.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle className="w-4 h-4 text-mint" />
                    <span>Completed</span>
                  </div>
                </div>

                {totalLessons === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
                      <Layers className="w-8 h-8" />
                    </div>
                    <p className="font-heading font-bold text-lg mb-1">No lessons yet</p>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      This course has no lessons configured. Check back later when the instructor adds content.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-gray-100">
                    {progress?.lessons_progress?.map((lesson, index) => {
                      const done = lesson.completed
                      return (
                        <div
                          key={lesson.lesson_id}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-cream border-2 border-black rounded-lg flex items-center justify-center font-heading font-bold text-sm shrink-0 shadow-brutal-sm">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {lesson.progress_pct}% complete
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black rounded-full text-xs font-heading font-bold ${
                                done ? 'bg-mint' : 'bg-gray-100'
                              }`}
                            >
                              {done ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Circle className="w-3.5 h-3.5" />
                              )}
                              {done ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default CourseProgressPage

