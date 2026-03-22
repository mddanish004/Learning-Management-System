import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Layers,
  RefreshCw,
  Users,
  DollarSign,
  ChevronRight,
  BookMarked,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function InstructorDashboardPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = sessionStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (includeDeleted) params.set('include_deleted', 'true')
      const res = await fetch(`/api/v1/courses/my-courses?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in to view your dashboard')
        throw new Error('Failed to load courses')
      }
      const data = await res.json()
      setCourses(data.courses || data.data || data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [includeDeleted])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const total = courses.length
  const published = courses.filter((c) => c.is_published && !c.deleted_at).length
  const draft = courses.filter((c) => !c.is_published && !c.deleted_at).length
  const deletedCount = courses.filter((c) => c.deleted_at).length
  const recentCourses = courses.filter((c) => !c.deleted_at).slice(0, 5)

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <section className="border-b-2 border-black bg-white py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl">Instructor Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your courses and track your teaching activity
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard/instructor/courses/new"
                className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Course
              </Link>
              <Link
                to="/dashboard/instructor/courses"
                className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <Layers className="w-5 h-5" />
                Manage Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8 px-4 flex-1">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-black rounded-xl p-6 animate-pulse"
                >
                  <div className="h-10 w-10 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-6 w-20 bg-gray-200 rounded mb-2" />
                  <div className="h-8 w-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md mx-auto mb-8">
              <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
                <RefreshCw className="w-7 h-7 text-coral" />
              </div>
              <h2 className="font-heading font-bold text-xl mb-2">Could not load dashboard</h2>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/auth/login"
                  className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                >
                  Log In
                </Link>
                <button
                  onClick={fetchCourses}
                  className="font-heading font-bold px-6 py-3 bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="font-heading font-bold text-lg">Overview</h2>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(e) => setIncludeDeleted(e.target.checked)}
                    className="w-4 h-4 border-2 border-black rounded accent-coral cursor-pointer"
                  />
                  <span className="font-heading font-bold text-sm">Include deleted courses</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                  <div className="w-12 h-12 bg-ocean border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-brutal-sm">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total courses</p>
                  <p className="font-heading font-bold text-3xl">{total}</p>
                </div>

                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                  <div className="w-12 h-12 bg-mint border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-brutal-sm">
                    <Eye className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Published</p>
                  <p className="font-heading font-bold text-3xl">{published}</p>
                </div>

                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                  <div className="w-12 h-12 bg-sunshine border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-brutal-sm">
                    <EyeOff className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Draft</p>
                  <p className="font-heading font-bold text-3xl">{draft}</p>
                </div>

                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                  <div className="w-12 h-12 bg-gray-200 border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-brutal-sm">
                    <Trash2 className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Soft-deleted</p>
                  <p className="font-heading font-bold text-3xl">{deletedCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-lavender border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold">Enrollment</h3>
                      <p className="text-xs text-gray-500">Total enrollments across your courses</p>
                    </div>
                  </div>
                  <p className="font-heading font-bold text-2xl">
                    {courses.filter((c) => !c.deleted_at).length > 0 ? (
                      <Link to="/dashboard/instructor/courses" className="text-ocean hover:underline">
                        View per course →
                      </Link>
                    ) : '0'}
                  </p>
                </div>

                <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-sunshine border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-sm">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold">Revenue</h3>
                      <p className="text-xs text-gray-500">Earnings from paid enrollments</p>
                    </div>
                  </div>
                  <p className="font-heading font-bold text-2xl">
                    {courses.filter((c) => !c.deleted_at).length > 0 ? (
                      <Link to="/dashboard/instructor/courses" className="text-ocean hover:underline">
                        View per course →
                      </Link>
                    ) : '$0.00'}
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-black shadow-brutal rounded-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b-2 border-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="font-heading font-bold text-lg">Your courses</h3>
                  <Link
                    to="/dashboard/instructor/courses"
                    className="font-heading font-bold text-sm text-ocean hover:text-ocean-dark transition-colors inline-flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {recentCourses.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <div className="w-14 h-14 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
                      <BookMarked className="w-7 h-7" />
                    </div>
                    <p className="font-heading font-bold text-lg mb-1">No courses yet</p>
                    <p className="text-gray-500 text-sm mb-6">
                      Create your first course to start teaching on Penta Academy.
                    </p>
                    <Link
                      to="/dashboard/instructor/courses/new"
                      className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Create Course
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y-2 divide-gray-100">
                    {recentCourses.map((course) => (
                      <li key={course.id}>
                        <Link
                          to={`/dashboard/instructor/courses/${course.id}/lessons`}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold truncate">{course.title}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {course.is_free ? (
                                <span className="bg-mint border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  FREE
                                </span>
                              ) : (
                                <span className="bg-sunshine border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  ${course.price}
                                </span>
                              )}
                              {course.is_published ? (
                                <span className="bg-mint border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  Published
                                </span>
                              ) : (
                                <span className="bg-gray-200 border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 sm:ml-2" />
                        </Link>
                      </li>
                    ))}
                  </ul>
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

export default InstructorDashboardPage
