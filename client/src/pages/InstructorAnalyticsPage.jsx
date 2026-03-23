import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Loader2,
  RefreshCw,
  Layers,
  UserCheck,
  Clock,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function InstructorAnalyticsPage() {
  const { id: courseId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null

  const fetchAnalytics = useCallback(async () => {
    if (!token) {
      setError('auth')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/v1/instructor/courses/${courseId}/analytics`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) { setError('auth'); return }
        if (res.status === 403) { setError('forbidden'); return }
        if (res.status === 404) { setError('Course not found'); return }
        throw new Error('Failed to load analytics')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, token])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (error === 'auth') {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-ocean/15 border-2 border-ocean rounded-full flex items-center justify-center mx-auto mb-5">
              <BarChart3 className="w-8 h-8 text-ocean" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Sign in required</h2>
            <p className="text-gray-500 text-sm mb-6">Log in as an instructor to view analytics.</p>
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

  if (error && !data) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              <RefreshCw className="w-7 h-7 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Cannot load analytics</h2>
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
                onClick={fetchAnalytics}
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

  const course = data?.course
  const stats = data?.stats

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
                Course Analytics
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">
                {loading ? 'Loading...' : course?.title || 'Course'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/instructor/courses/${courseId}/edit`}
              className="font-heading font-bold px-3 py-1.5 text-sm text-ocean hover:text-ocean-dark transition-colors"
            >
              Edit course
            </Link>
            <Link
              to={`/dashboard/instructor/courses/${courseId}/lessons`}
              className="font-heading font-bold px-3 py-1.5 text-sm text-ocean hover:text-ocean-dark transition-colors"
            >
              Lessons
            </Link>
          </div>
        </div>
      </div>

      <section className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {loading ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white border-2 border-black rounded-xl p-4 space-y-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="bg-white border-2 border-black rounded-2xl p-6 space-y-3">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="Total enrollments"
                  value={stats?.total_enrollments ?? 0}
                  color="bg-ocean"
                />
                <StatCard
                  icon={Clock}
                  label="Active"
                  value={stats?.active_enrollments ?? 0}
                  color="bg-sunshine"
                />
                <StatCard
                  icon={UserCheck}
                  label="Completed"
                  value={stats?.completed_enrollments ?? 0}
                  color="bg-mint"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Completion rate"
                  value={`${stats?.enrollment_completion_rate ?? 0}%`}
                  color="bg-lavender"
                />
                <StatCard
                  icon={BookOpen}
                  label="Lessons"
                  value={stats?.lessons_count ?? 0}
                  color="bg-skyblue"
                />
                <StatCard
                  icon={FileText}
                  label="Resources"
                  value={stats?.resources_count ?? 0}
                  color="bg-peach"
                />
                <StatCard
                  icon={BarChart3}
                  label="Avg progress"
                  value={`${stats?.average_progress_pct ?? 0}%`}
                  color="bg-blush"
                />
                <StatCard
                  icon={DollarSign}
                  label="Revenue"
                  value={`$${(stats?.total_revenue ?? 0).toFixed(2)}`}
                  color="bg-coral"
                  valueWhite
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-5 sm:p-6">
                  <h2 className="font-heading font-bold text-lg mb-4">Enrollment breakdown</h2>
                  <div className="space-y-4">
                    <ProgressRow
                      label="Active"
                      value={stats?.active_enrollments ?? 0}
                      total={stats?.total_enrollments || 1}
                      color="bg-sunshine"
                    />
                    <ProgressRow
                      label="Completed"
                      value={stats?.completed_enrollments ?? 0}
                      total={stats?.total_enrollments || 1}
                      color="bg-mint"
                    />
                  </div>
                  <div className="mt-5 pt-5 border-t-2 border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion rate</span>
                    <span className="font-heading font-bold text-lg">
                      {stats?.enrollment_completion_rate ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-5 sm:p-6">
                  <h2 className="font-heading font-bold text-lg mb-4">Progress stats</h2>
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Average learner progress</span>
                        <span className="font-heading font-bold">{stats?.average_progress_pct ?? 0}%</span>
                      </div>
                      <div className="h-4 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                        <div
                          className="h-full bg-lavender rounded-full transition-all duration-500"
                          style={{ width: `${stats?.average_progress_pct ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-cream border-2 border-black rounded-xl p-4 text-center shadow-brutal-sm">
                        <p className="font-heading font-bold text-2xl">{stats?.completed_progress_records ?? 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Lessons completed (all learners)</p>
                      </div>
                      <div className="bg-cream border-2 border-black rounded-xl p-4 text-center shadow-brutal-sm">
                        <p className="font-heading font-bold text-2xl">{stats?.lessons_count ?? 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Total lessons</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-5 sm:p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Revenue</h2>
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="bg-coral border-2 border-black rounded-xl p-5 shadow-brutal-sm text-center sm:text-left">
                    <p className="text-xs text-white/80 uppercase font-heading tracking-wider mb-1">
                      Total revenue
                    </p>
                    <p className="font-heading font-bold text-3xl text-white">
                      ${(stats?.total_revenue ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-mint" />
                      From successful payments only
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-ocean" />
                      {stats?.total_enrollments ?? 0} total enrollment{(stats?.total_enrollments ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to={`/dashboard/instructor/courses/${courseId}/enrollments`}
                  className="font-heading font-bold px-5 py-2.5 bg-ocean text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 text-sm"
                >
                  <Users className="w-4 h-4" /> View enrollments
                </Link>
                <Link
                  to={`/dashboard/instructor/courses/${courseId}/resources`}
                  className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" /> Manage resources
                </Link>
                <Link
                  to={`/dashboard/instructor/courses/${courseId}/lessons`}
                  className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <BookOpen className="w-4 h-4" /> Manage lessons
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

function StatCard({ icon, label, value, color, valueWhite }) {
  const Icon = icon
  return (
    <div className="bg-white border-2 border-black shadow-brutal-sm rounded-xl p-4 flex flex-col gap-2 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-heading uppercase text-gray-500 truncate">{label}</span>
        <div className={`w-8 h-8 ${color} border-2 border-black rounded-lg flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${valueWhite ? 'text-white' : ''}`} />
        </div>
      </div>
      <p className="font-heading font-bold text-xl sm:text-2xl">{value}</p>
    </div>
  )
}

function ProgressRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-heading font-bold">{label}</span>
        <span className="text-gray-600">
          {value} <span className="text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-3 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default InstructorAnalyticsPage
