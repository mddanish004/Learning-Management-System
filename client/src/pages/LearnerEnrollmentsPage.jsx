import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Play,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  Award,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import BrandLogo from '../components/BrandLogo'
import Footer from '../components/Footer'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
]

function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  if (total > 1) pages.push(total)
  return pages
}

function LearnerEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false })
  const limit = 9

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null

  const fetchEnrollments = useCallback(async () => {
    if (!token) {
      setError('auth')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(apiUrl(`/api/v1/enrollments?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) {
          setError('auth')
          return
        }
        throw new Error('Failed to load enrollments')
      }
      const data = await res.json()
      setEnrollments(data.enrollments || [])
      setPagination(data.pagination || { total: 0, totalPages: 1, hasNext: false, hasPrev: false })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, page, limit, statusFilter])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  function handleStatusChange(key) {
    setStatusFilter(key)
    setPage(1)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (error === 'auth') {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-white border-2 border-ocean rounded-full flex items-center justify-center mx-auto mb-5 p-1.5 shadow-brutal-sm">
              <BrandLogo className="w-full h-full rounded-full object-cover" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Sign in to continue</h2>
            <p className="text-gray-500 text-sm mb-6">
              You need to be logged in to view your enrolled courses.
            </p>
            <Link
              to="/auth/login"
              className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
            >
              Log in
            </Link>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-xl sm:text-2xl">My Learning</h1>
              <p className="text-gray-500 text-xs sm:text-sm">
                {pagination.total} enrolled course{pagination.total !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              to="/courses"
              className="font-heading font-bold px-4 py-2 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 text-sm inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Browse courses
            </Link>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleStatusChange(tab.key)}
                className={`font-heading font-bold px-4 py-2 border-2 border-black rounded-xl text-sm transition-all duration-200 shrink-0 ${
                  statusFilter === tab.key
                    ? 'bg-charcoal text-white shadow-brutal-sm'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border-2 border-black rounded-2xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
                  <RefreshCw className="w-7 h-7 text-coral" />
                </div>
                <h2 className="font-heading font-bold text-xl mb-2">Something went wrong</h2>
                <p className="text-gray-500 text-sm mb-6">{error}</p>
                <button
                  onClick={fetchEnrollments}
                  className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-5 shadow-brutal-sm p-1.5">
                  <BrandLogo className="w-full h-full rounded-full object-cover" />
                </div>
                <h2 className="font-heading font-bold text-xl mb-2">
                  {statusFilter === 'all' ? 'No enrollments yet' : `No ${statusFilter} courses`}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {statusFilter === 'all'
                    ? 'You haven\u2019t enrolled in any courses yet. Start exploring our catalog!'
                    : `You don\u2019t have any courses with \u201C${statusFilter}\u201D status.`}
                </p>
                <Link
                  to="/courses"
                  className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Browse courses
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => {
                  const course = enrollment.course || {}
                  const isCompleted = enrollment.status === 'completed'
                  const isFree = course.is_free || parseFloat(course.price) === 0
                  const instructorName = course.instructor?.name || 'Instructor'
                  const descSnippet = course.description
                    ? course.description.length > 120
                      ? course.description.slice(0, 120) + '...'
                      : course.description
                    : 'No description available.'

                  const colors = [
                    'bg-ocean',
                    'bg-lavender',
                    'bg-mint',
                    'bg-sunshine',
                    'bg-skyblue',
                    'bg-peach',
                    'bg-blush',
                    'bg-coral',
                  ]
                  const colorIndex =
                    typeof enrollment.course_id === 'string'
                      ? enrollment.course_id.charCodeAt(0) % colors.length
                      : (enrollment.id || 0) % colors.length
                  const headerColor = colors[colorIndex]

                  return (
                    <div
                      key={enrollment.id}
                      className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden flex flex-col hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal-sm transition-all duration-200"
                    >
                      <div className={`${headerColor} border-b-2 border-black p-5 flex items-center justify-between`}>
                        <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-brutal-sm shrink-0">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          {isFree ? (
                            <span className="bg-white border-2 border-black px-2.5 py-0.5 text-xs font-heading font-bold rounded-md">
                              FREE
                            </span>
                          ) : (
                            <span className="bg-white border-2 border-black px-2.5 py-0.5 text-xs font-heading font-bold rounded-md">
                              ${course.price}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 border-2 border-black rounded-md text-xs font-heading font-bold ${
                              isCompleted ? 'bg-mint' : 'bg-sunshine'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {isCompleted ? 'Completed' : 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-heading font-bold text-base sm:text-lg mb-1 line-clamp-2">
                          {course.title || 'Untitled Course'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          By {instructorName}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                          {descSnippet}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          Enrolled {formatDate(enrollment.enrolled_at)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {isCompleted ? (
                            <Link
                              to={`/certificates/${enrollment.course_id}`}
                              className="font-heading font-bold flex-1 min-w-[120px] text-center px-4 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 text-sm inline-flex items-center justify-center gap-2"
                            >
                              <Award className="w-4 h-4" /> Certificate
                            </Link>
                          ) : (
                            <Link
                              to={`/learn/courses/${enrollment.course_id}`}
                              className="font-heading font-bold flex-1 min-w-[120px] text-center px-4 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 text-sm inline-flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" /> Continue
                            </Link>
                          )}
                          <Link
                            to={`/progress/${enrollment.course_id}`}
                            className="font-heading font-bold flex-1 min-w-[120px] text-center px-4 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors text-sm inline-flex items-center justify-center gap-2"
                          >
                            <BarChart3 className="w-4 h-4" /> Progress
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="p-2 border-2 border-black rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {generatePageNumbers(page, pagination.totalPages).map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className="px-2 text-gray-400 font-heading font-bold">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 border-2 border-black rounded-xl font-heading font-bold text-sm transition-all duration-200 ${
                          page === p
                            ? 'bg-charcoal text-white shadow-brutal-sm'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasNext}
                    className="p-2 border-2 border-black rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LearnerEnrollmentsPage
