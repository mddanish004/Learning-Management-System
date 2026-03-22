import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Layers,
  UserCheck,
  Clock,
  Mail,
  BarChart3,
  UserX,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
]

const LIMIT = 10

function InstructorEnrollmentsPage() {
  const { id: courseId } = useParams()
  const [enrollments, setEnrollments] = useState([])
  const [course, setCourse] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/v1/instructor/courses/${courseId}/enrollments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) { setError('auth'); return }
        if (res.status === 403) { setError('forbidden'); return }
        if (res.status === 404) { setError('Course not found or you do not own it'); return }
        throw new Error('Failed to load enrollments')
      }
      const json = await res.json()
      setCourse(json.course)
      setEnrollments(json.enrollments || [])
      setPagination(json.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, token, page, statusFilter])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  function handleTabChange(key) {
    if (key === statusFilter) return
    setStatusFilter(key)
    setPage(1)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
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
            <div className="w-16 h-16 bg-ocean/15 border-2 border-ocean rounded-full flex items-center justify-center mx-auto mb-5">
              <Users className="w-8 h-8 text-ocean" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Sign in required</h2>
            <p className="text-gray-500 text-sm mb-6">Log in as an instructor to view enrollments.</p>
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

  if (error === 'forbidden') {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              <Layers className="w-8 h-8 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Access denied</h2>
            <p className="text-gray-500 text-sm mb-6">You do not own this course or lack instructor permissions.</p>
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

  if (error && !course) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              <RefreshCw className="w-7 h-7 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Cannot load enrollments</h2>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/instructor/courses"
                className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> My courses
              </Link>
              <button
                type="button"
                onClick={fetchEnrollments}
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

      <div className="bg-white border-b-2 border-black py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/dashboard/instructor/courses"
              className="p-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-lg sm:text-xl truncate">
                Course Enrollments
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">
                {loading && !course ? 'Loading...' : course?.title || 'Course'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/instructor/courses/${courseId}/analytics`}
              className="font-heading font-bold px-3 py-1.5 text-sm bg-ocean text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>
          </div>
        </div>
      </div>

      <section className="flex-1 py-6 sm:py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`font-heading font-bold px-4 py-2 text-sm border-2 border-black rounded-xl transition-all duration-200 ${
                  statusFilter === tab.key
                    ? 'bg-charcoal text-white shadow-brutal-sm'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {pagination && !loading && (
              <span className="ml-auto text-sm text-gray-500 font-heading">
                {pagination.total} learner{pagination.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="hidden sm:grid sm:grid-cols-4 gap-4 bg-white border-2 border-black rounded-xl px-5 py-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white border-2 border-black rounded-xl px-5 py-4">
                  <div className="flex flex-col sm:grid sm:grid-cols-4 gap-3">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-lavender/30 border-2 border-lavender rounded-full flex items-center justify-center mx-auto mb-5">
                <UserX className="w-8 h-8 text-lavender" />
              </div>
              <h2 className="font-heading font-bold text-xl mb-2">No enrollments found</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {statusFilter
                  ? `No ${statusFilter} enrollments yet. Try a different filter.`
                  : 'No learners have enrolled in this course yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid sm:grid-cols-4 gap-4 bg-charcoal text-white border-2 border-black rounded-xl px-5 py-3 font-heading font-bold text-sm">
                <span>Learner</span>
                <span>Email</span>
                <span>Status</span>
                <span>Enrolled</span>
              </div>

              <div className="space-y-3">
                {enrollments.map((enrollment, idx) => {
                  const colors = ['bg-sunshine', 'bg-skyblue', 'bg-lavender', 'bg-blush', 'bg-peach', 'bg-mint']
                  const avatarColor = colors[idx % colors.length]
                  const initial = (enrollment.user?.name || enrollment.user?.email || '?').charAt(0).toUpperCase()

                  return (
                    <div
                      key={enrollment.id}
                      className="bg-white border-2 border-black rounded-xl px-4 sm:px-5 py-3 sm:py-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-brutal-sm transition-all duration-200"
                    >
                      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 ${avatarColor} border-2 border-black rounded-lg flex items-center justify-center shrink-0`}>
                            <span className="font-heading font-bold text-sm">{initial}</span>
                          </div>
                          <span className="font-heading font-bold text-sm truncate">
                            {enrollment.user?.name || 'Unknown'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 min-w-0 sm:pl-0 pl-12">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden sm:block" />
                          <span className="text-sm text-gray-600 truncate">
                            {enrollment.user?.email || '—'}
                          </span>
                        </div>

                        <div className="pl-12 sm:pl-0">
                          {enrollment.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-mint border-2 border-black rounded-lg text-xs font-heading font-bold">
                              <UserCheck className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sunshine border-2 border-black rounded-lg text-xs font-heading font-bold">
                              <Clock className="w-3.5 h-3.5" /> Active
                            </span>
                          )}
                        </div>

                        <div className="pl-12 sm:pl-0 text-sm text-gray-500">
                          {formatDate(enrollment.enrolled_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="font-heading font-bold px-4 py-2 text-sm bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span className="text-sm font-heading">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="font-heading font-bold px-4 py-2 text-sm bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1.5"
                  >
                    Next <ChevronRight className="w-4 h-4" />
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

export default InstructorEnrollmentsPage
