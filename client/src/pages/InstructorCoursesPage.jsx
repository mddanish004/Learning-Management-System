import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Layers,
  RefreshCw,
  Edit,
  Trash2,
  MoreVertical,
  X,
  Loader2,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Users,
  FileText,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function InstructorCoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

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
        if (res.status === 401) throw new Error('Please log in to manage your courses')
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

  useEffect(() => {
    if (!openMenuId) return
    const handleClick = () => setOpenMenuId(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [openMenuId])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteResult(null)
    try {
      const token = sessionStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/courses/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setDeleteResult({ error: data.error || 'Failed to delete course' })
        return
      }
      setDeleteResult({ soft_deleted: data.soft_deleted === true })
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    } catch {
      setDeleteResult({ error: 'Network error' })
    } finally {
      setDeleting(false)
    }
  }

  function closeDeleteModal() {
    if (!deleting) {
      setDeleteTarget(null)
      setDeleteResult(null)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const visibleCourses = courses.filter((c) => !c.deleted_at)
  const deletedCourses = courses.filter((c) => c.deleted_at)

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <section className="border-b-2 border-black bg-white py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/instructor"
                className="text-gray-500 hover:text-coral transition-colors"
              >
                <Layers className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl">My Courses</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Edit, manage lessons, or remove courses
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/instructor/courses/new"
              className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 shrink-0"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </Link>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8 px-4 flex-1">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
              <div className="divide-y-2 divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 sm:p-5 flex items-center gap-4 animate-pulse">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 bg-gray-200 rounded" />
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-9 w-20 bg-gray-200 rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
                <RefreshCw className="w-7 h-7 text-coral" />
              </div>
              <h2 className="font-heading font-bold text-xl mb-2">Could not load courses</h2>
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
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <p className="text-sm text-gray-500">
                  {visibleCourses.length} course{visibleCourses.length !== 1 ? 's' : ''}
                  {deletedCourses.length > 0 && ` · ${deletedCourses.length} deleted`}
                </p>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(e) => setIncludeDeleted(e.target.checked)}
                    className="w-4 h-4 border-2 border-black rounded accent-coral cursor-pointer"
                  />
                  <span className="font-heading font-bold text-sm">Include deleted</span>
                </label>
              </div>

              {courses.length === 0 ? (
                <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-12 text-center">
                  <div className="w-14 h-14 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-1">No courses yet</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Create your first course to get started.
                  </p>
                  <Link
                    to="/dashboard/instructor/courses/new"
                    className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Create Course
                  </Link>
                </div>
              ) : (
                <div className="bg-white border-2 border-black shadow-brutal rounded-xl overflow-hidden">
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-black bg-gray-50">
                          <th className="text-left font-heading font-bold text-sm px-4 py-3">
                            Course
                          </th>
                          <th className="text-left font-heading font-bold text-sm px-4 py-3">
                            Price
                          </th>
                          <th className="text-left font-heading font-bold text-sm px-4 py-3">
                            Status
                          </th>
                          <th className="text-left font-heading font-bold text-sm px-4 py-3">
                            Created
                          </th>
                          <th className="w-12 px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => (
                          <tr
                            key={course.id}
                            className={`border-b border-gray-100 hover:bg-gray-50/50 ${
                              course.deleted_at ? 'opacity-60 bg-gray-50' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-heading font-bold truncate max-w-[200px]">
                                {course.title}
                              </p>
                              {course.deleted_at && (
                                <p className="text-xs text-gray-500 mt-0.5">Deleted</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {course.is_free || parseFloat(course.price) === 0 ? (
                                <span className="bg-mint border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  FREE
                                </span>
                              ) : (
                                <span className="bg-sunshine border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  ${course.price}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {course.is_published ? (
                                <span className="bg-mint border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  Published
                                </span>
                              ) : (
                                <span className="bg-gray-200 border border-black px-2 py-0.5 text-xs font-bold rounded">
                                  Draft
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(course.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              {!course.deleted_at && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenMenuId(openMenuId === course.id ? null : course.id)
                                    }}
                                    className="p-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                  {openMenuId === course.id && (
                                    <div
                                      className="absolute right-0 top-full mt-1 bg-white border-2 border-black shadow-brutal rounded-lg py-1 z-10 min-w-[180px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Link
                                        to={`/dashboard/instructor/courses/${course.id}/edit`}
                                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Edit className="w-4 h-4" /> Edit
                                      </Link>
                                      <Link
                                        to={`/dashboard/instructor/courses/${course.id}/lessons`}
                                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Layers className="w-4 h-4" /> Manage Lessons
                                      </Link>
                                      <Link
                                        to={`/dashboard/instructor/courses/${course.id}/analytics`}
                                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <BarChart3 className="w-4 h-4" /> Analytics
                                      </Link>
                                      <Link
                                        to={`/dashboard/instructor/courses/${course.id}/enrollments`}
                                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Users className="w-4 h-4" /> Enrollments
                                      </Link>
                                      <Link
                                        to={`/dashboard/instructor/courses/${course.id}/resources`}
                                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <FileText className="w-4 h-4" /> Resources
                                      </Link>
                                      <button
                                        onClick={() => {
                                          setDeleteTarget(course)
                                          setOpenMenuId(null)
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-coral/10 text-coral w-full font-heading font-bold text-sm cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" /> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden divide-y-2 divide-gray-100">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className={`p-4 ${course.deleted_at ? 'opacity-60 bg-gray-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-heading font-bold truncate">{course.title}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {course.is_free || parseFloat(course.price) === 0 ? (
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
                              {course.deleted_at && (
                                <span className="text-xs text-gray-500">Deleted</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Created {formatDate(course.created_at)}
                            </p>
                          </div>
                          {!course.deleted_at && (
                            <div className="relative shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuId(openMenuId === course.id ? null : course.id)
                                }}
                                className="p-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                {openMenuId === course.id ? (
                                  <X className="w-5 h-5" />
                                ) : (
                                  <MoreVertical className="w-5 h-5" />
                                )}
                              </button>
                              {openMenuId === course.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 bg-white border-2 border-black shadow-brutal rounded-lg py-1 z-20 min-w-[180px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link
                                    to={`/dashboard/instructor/courses/${course.id}/edit`}
                                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Edit className="w-4 h-4" /> Edit
                                  </Link>
                                  <Link
                                    to={`/dashboard/instructor/courses/${course.id}/lessons`}
                                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Layers className="w-4 h-4" /> Manage Lessons
                                  </Link>
                                  <Link
                                    to={`/dashboard/instructor/courses/${course.id}/analytics`}
                                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <BarChart3 className="w-4 h-4" /> Analytics
                                  </Link>
                                  <Link
                                    to={`/dashboard/instructor/courses/${course.id}/enrollments`}
                                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Users className="w-4 h-4" /> Enrollments
                                  </Link>
                                  <Link
                                    to={`/dashboard/instructor/courses/${course.id}/resources`}
                                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-heading font-bold text-sm"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <FileText className="w-4 h-4" /> Resources
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setDeleteTarget(course)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-coral/10 text-coral w-full font-heading font-bold text-sm cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
          />
          <div className="relative bg-white border-2 border-black shadow-brutal-lg rounded-2xl p-8 max-w-sm w-full">
            <button
              onClick={closeDeleteModal}
              disabled={deleting}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="w-14 h-14 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-coral" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-2">Delete course?</h3>
              <p className="text-gray-500 text-sm mb-4">
                &ldquo;{deleteTarget.title}&rdquo; will be soft-deleted and unpublished.
              </p>
              {deleteResult?.error && (
                <p className="text-coral text-sm font-medium mb-4">{deleteResult.error}</p>
              )}
              {deleteResult?.soft_deleted && (
                <p className="text-mint text-sm font-bold mb-4 border-2 border-black bg-mint/30 px-3 py-2 rounded-lg">
                  Course soft-deleted successfully.
                </p>
              )}
              <div className="flex gap-3">
                {deleteResult?.soft_deleted ? (
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 font-heading font-bold py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      onClick={closeDeleteModal}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstructorCoursesPage
