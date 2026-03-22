import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  FileText,
  Users,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Layers,
  RefreshCw,
  X,
  Loader2,
  ArrowRight,
  AlertTriangle,
  ShoppingCart,
  Clock,
  CheckCircle,
  BarChart3,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import BrandLogo from '../components/BrandLogo'
import Footer from '../components/Footer'
import { useAuth } from '../hooks/useAuth'

function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedLessons, setExpandedLessons] = useState(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [enrollSuccess, setEnrollSuccess] = useState(false)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null

  const fetchCourse = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const courseRes = await fetch(`/api/v1/courses/${id}`, { headers, credentials: 'include' })

      if (!courseRes.ok) {
        if (courseRes.status === 404) throw new Error('Course not found')
        throw new Error('Failed to load course')
      }

      const courseData = await courseRes.json()
      const c = courseData.course || courseData
      setCourse(c)
      if (c.is_enrolled) setEnrolled(true)

      try {
        const lessonsRes = await fetch(`/api/v1/courses/${id}/lessons`, { headers, credentials: 'include' })
        if (lessonsRes.ok) {
          const lessonsData = await lessonsRes.json()
          setLessons(lessonsData.lessons || lessonsData.data || lessonsData || [])
        }
      } catch {
        setLessons([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  function toggleLesson(lessonId) {
    setExpandedLessons((prev) => {
      const next = new Set(prev)
      if (next.has(lessonId)) {
        next.delete(lessonId)
      } else {
        next.add(lessonId)
      }
      return next
    })
  }

  function expandAll() {
    setExpandedLessons(new Set(lessons.map((l) => l.id)))
  }

  function collapseAll() {
    setExpandedLessons(new Set())
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const token = sessionStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/courses/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete course')
      navigate('/courses')
    } catch {
      setShowDeleteModal(false)
      setDeleting(false)
    }
  }

  async function handleEnrollFree() {
    if (!token) {
      navigate('/auth/login')
      return
    }
    setEnrolling(true)
    setEnrollError('')
    setEnrollSuccess(false)
    try {
      const res = await fetch(`/api/v1/courses/${id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      const data = await res.json()
      if (res.status === 201) {
        setEnrolled(true)
        setEnrollSuccess(true)
      } else if (res.status === 200 && data.already_enrolled) {
        setEnrolled(true)
      } else if (res.status === 401) {
        navigate('/auth/login')
        return
      } else if (res.status === 400) {
        setEnrollError(data.error || 'This course is not available for free enrollment')
      } else {
        setEnrollError(data.error || 'Enrollment failed')
      }
    } catch {
      setEnrollError('Network error. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const isFree = course?.is_free || parseFloat(course?.price) === 0
  const instructorName = course?.instructor?.name || 'Unknown Instructor'
  const enrollmentCount = course?.enrollment_count || 0
  const isOwnerOrAdmin = user && (user.role === 'admin' || (user.role === 'instructor' && course?.instructor?.id === user.id))
  const sortedLessons = [...lessons].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border-2 border-black rounded-2xl p-8 space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2 pt-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="bg-white border-2 border-black rounded-2xl p-8 space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 w-full bg-gray-100 border-2 border-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white border-2 border-black rounded-2xl p-6 space-y-4">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
                <div className="space-y-3 pt-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              {error === 'Course not found' ? (
                <BookOpen className="w-8 h-8 text-coral" />
              ) : (
                <RefreshCw className="w-7 h-7 text-coral" />
              )}
            </div>
            <h2 className="font-heading font-bold text-2xl mb-2">
              {error === 'Course not found' ? 'Course Not Found' : 'Something Went Wrong'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {error === 'Course not found'
                ? 'This course may have been removed or the link is incorrect.'
                : error}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/courses"
                className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Browse Courses
              </Link>
              {error !== 'Course not found' && (
                <button
                  onClick={fetchCourse}
                  className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="bg-white border-b-2 border-black py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 font-heading font-bold text-sm text-gray-600 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
        </div>
      </div>

      <section className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
                <div className="bg-ocean p-6 sm:p-8 border-b-2 border-black">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {isFree ? (
                      <span className="bg-mint border-2 border-black px-3 py-1 text-xs font-bold rounded-md">
                        FREE
                      </span>
                    ) : (
                      <span className="bg-sunshine border-2 border-black px-3 py-1 text-xs font-bold rounded-md">
                        ${course.price}
                      </span>
                    )}
                    {course.is_published ? (
                      <span className="bg-white border-2 border-black px-3 py-1 text-xs font-bold rounded-md">
                        Published
                      </span>
                    ) : (
                      <span className="bg-gray-200 border-2 border-black px-3 py-1 text-xs font-bold rounded-md">
                        Draft
                      </span>
                    )}
                    <span className="bg-white/80 border-2 border-black px-3 py-1 text-xs font-bold rounded-md inline-flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {enrollmentCount} enrolled
                    </span>
                  </div>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight">
                    {course.title}
                  </h1>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-100">
                    <div className="w-12 h-12 bg-lavender border-2 border-black rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0">
                      {instructorName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        Instructor
                      </p>
                      <p className="font-heading font-bold">{instructorName}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-heading font-bold text-xl mb-3">About this course</h2>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {course.description || 'No description provided for this course.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
                <div className="p-6 sm:p-8 border-b-2 border-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-heading font-bold text-xl">Course Curriculum</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {sortedLessons.length} lesson{sortedLessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {sortedLessons.length > 0 && (
                    <button
                      onClick={expandedLessons.size === sortedLessons.length ? collapseAll : expandAll}
                      className="font-heading font-bold text-sm text-ocean hover:text-ocean-dark transition-colors shrink-0"
                    >
                      {expandedLessons.size === sortedLessons.length
                        ? 'Collapse all'
                        : 'Expand all'}
                    </button>
                  )}
                </div>

                {sortedLessons.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-14 h-14 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
                      <Layers className="w-7 h-7" />
                    </div>
                    <p className="font-heading font-bold text-lg mb-1">No lessons yet</p>
                    <p className="text-gray-500 text-sm">
                      The instructor hasn&apos;t added lessons to this course yet.
                    </p>
                  </div>
                ) : (
                  <div>
                    {sortedLessons.map((lesson, i) => {
                      const isExpanded = expandedLessons.has(lesson.id)
                      const hasVideo = !!lesson.youtube_video_id || !!lesson.has_video
                      const hasContent = !!lesson.content_text || !!lesson.has_content

                      return (
                        <div
                          key={lesson.id}
                          className={i < sortedLessons.length - 1 ? 'border-b-2 border-gray-100' : ''}
                        >
                          <button
                            onClick={() => toggleLesson(lesson.id)}
                            className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                          >
                            <div className="w-9 h-9 bg-cream border-2 border-black rounded-lg flex items-center justify-center font-heading font-bold text-sm shrink-0 shadow-brutal-sm">
                              {lesson.order_index ?? i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-heading font-bold text-sm sm:text-base truncate">
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {hasVideo && (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                    <Play className="w-3 h-3" /> Video
                                  </span>
                                )}
                                {hasContent && (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                    <FileText className="w-3 h-3" /> Reading
                                  </span>
                                )}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-4 sm:px-5 pb-5 pl-[68px] sm:pl-[76px]">
                              {hasVideo && lesson.embed_url && (
                                <div className="mb-4 rounded-xl overflow-hidden border-2 border-black shadow-brutal-sm">
                                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                      src={lesson.embed_url}
                                      title={lesson.title}
                                      className="absolute inset-0 w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}
                              {hasVideo && !lesson.embed_url && lesson.youtube_video_id && (
                                <div className="mb-4 rounded-xl overflow-hidden border-2 border-black shadow-brutal-sm">
                                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                      src={`https://www.youtube.com/embed/${lesson.youtube_video_id}`}
                                      title={lesson.title}
                                      className="absolute inset-0 w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}
                              {hasContent && (
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
                                  {lesson.content_text}
                                </div>
                              )}
                              {!hasVideo && !hasContent && (
                                <p className="text-sm text-gray-400 italic">
                                  No content available for this lesson yet.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border-2 border-black shadow-brutal-md rounded-2xl p-6 lg:sticky lg:top-24">
                <div className="mb-5">
                  {isFree ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading font-bold text-3xl">Free</span>
                      <span className="text-sm text-gray-500">No payment required</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading font-bold text-3xl">${course.price}</span>
                      <span className="text-sm text-gray-500">one-time</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {enrolled ? (
                    <>
                      {enrollSuccess && (
                        <div className="bg-mint border-2 border-black rounded-xl p-3 flex items-center gap-2 text-sm shadow-brutal-sm">
                          <CheckCircle className="w-5 h-5 shrink-0" />
                          <span className="font-heading font-bold">
                            You&apos;re enrolled!
                          </span>
                        </div>
                      )}
                      {!enrollSuccess && (
                        <div className="bg-mint/40 border-2 border-black rounded-xl p-3 flex items-center gap-2 text-sm">
                          <CheckCircle className="w-5 h-5 shrink-0" />
                          <span className="font-heading font-bold">Enrolled</span>
                        </div>
                      )}
                      <Link
                        to={`/learn/courses/${id}`}
                        className="w-full font-heading font-bold py-3.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
                      >
                        <Play className="w-5 h-5" />
                        Start Learning
                      </Link>
                      <Link
                        to={`/progress/${id}`}
                        className="w-full font-heading font-bold py-3 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Progress
                      </Link>
                      <Link
                        to={`/courses/${id}/resources`}
                        className="w-full font-heading font-bold py-3 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Resources
                      </Link>
                    </>
                  ) : isFree && course.is_published ? (
                    <>
                      <button
                        type="button"
                        onClick={handleEnrollFree}
                        disabled={enrolling}
                        className="w-full font-heading font-bold py-3.5 bg-mint text-black border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:opacity-70"
                      >
                        {enrolling ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <BrandLogo className="w-5 h-5 rounded-md object-cover border border-black/20" />
                        )}
                        {enrolling ? 'Enrolling...' : 'Enroll Free'}
                      </button>
                      {enrollError && (
                        <div className="bg-coral/10 border-2 border-coral rounded-xl p-3 flex items-start gap-2 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
                          <span className="text-coral-dark">{enrollError}</span>
                        </div>
                      )}
                    </>
                  ) : !isFree && course.is_published ? (
                    <>
                      <Link
                        to={`/checkout/${id}`}
                        className="w-full font-heading font-bold py-3.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Enroll Now
                      </Link>
                    </>
                  ) : (
                    <div className="bg-gray-100 border-2 border-black rounded-xl p-4 text-center">
                      <p className="font-heading font-bold text-sm text-gray-600">
                        This course is not yet available for enrollment.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-gray-100 pt-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="w-4 h-4" /> Lessons
                    </span>
                    <span className="font-heading font-bold">{sortedLessons.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" /> Enrolled
                    </span>
                    <span className="font-heading font-bold">{enrollmentCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" /> Updated
                    </span>
                    <span className="font-heading font-bold text-xs">
                      {course.updated_at
                        ? new Date(course.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4" /> Status
                    </span>
                    <span
                      className={`font-heading font-bold text-xs px-2 py-0.5 rounded border-2 border-black ${
                        course.is_published ? 'bg-mint' : 'bg-gray-200'
                      }`}
                    >
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="border-t-2 border-gray-100 pt-5 mt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-lavender border-2 border-black rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0">
                      {instructorName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Taught by</p>
                      <p className="font-heading font-bold text-sm">{instructorName}</p>
                    </div>
                  </div>
                </div>

                {isOwnerOrAdmin && (
                  <div className="border-t-2 border-gray-100 pt-5 mt-5 space-y-2">
                    <p className="font-heading font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">
                      Management
                    </p>
                    <Link
                      to={`/dashboard/instructor/courses/${id}/edit`}
                      className="w-full font-heading font-bold py-2.5 bg-ocean text-white border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" /> Edit Course
                    </Link>
                    <Link
                      to={`/dashboard/instructor/courses/${id}/lessons`}
                      className="w-full font-heading font-bold py-2.5 bg-white border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <Layers className="w-4 h-4" /> Manage Lessons
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full font-heading font-bold py-2.5 bg-white text-coral border-2 border-coral rounded-lg hover:bg-coral/5 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Course
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative bg-white border-2 border-black shadow-brutal-lg rounded-2xl p-8 max-w-sm w-full">
            <button
              onClick={() => !deleting && setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-14 h-14 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-2">Delete Course?</h3>
              <p className="text-gray-500 text-sm mb-6">
                This action will soft-delete &ldquo;{course.title}&rdquo;. This cannot be easily
                undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 font-heading font-bold py-3 border-2 border-black rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 font-heading font-bold py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-brutal-sm disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetailPage
