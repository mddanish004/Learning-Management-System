import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BookOpen,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CourseCard from '../components/CourseCard'

function SkeletonCard() {
  return (
    <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
      <div className="bg-gray-100 border-b-2 border-black p-8 flex items-center justify-center">
        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-5 space-y-3">
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse mt-2" />
      </div>
    </div>
  )
}

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

function CourseCatalogPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isFree, setIsFree] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const limit = 9

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      params.set('is_published', 'true')
      if (search) params.set('search', search)
      if (isFree !== '') params.set('is_free', isFree)
      if (sortBy) params.set('sort_by', sortBy)
      if (sortOrder) params.set('sort_order', sortOrder)

      const res = await fetch(apiUrl(`/api/v1/courses?${params}`), { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch courses')

      const data = await res.json()
      setCourses(data.courses || data.data || [])

      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1)
        setTotal(data.pagination.total || 0)
      } else {
        setTotal(data.courses?.length || data.data?.length || 0)
        setTotalPages(1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, isFree, sortBy, sortOrder])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setIsFree('')
    setSortBy('created_at')
    setSortOrder('desc')
    setPage(1)
  }

  const hasActiveFilters =
    search || isFree !== '' || sortBy !== 'created_at' || sortOrder !== 'desc'

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <section className="bg-white border-b-2 border-black py-8 sm:py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">Course Catalog</h1>
              <p className="text-gray-600 max-w-2xl text-sm sm:text-base">
                Explore our collection of courses across various topics. Find the perfect course for
                your learning journey.
              </p>
            </div>
            {!loading && total > 0 && (
              <div className="bg-sunshine border-2 border-black rounded-lg px-4 py-2 shadow-brutal-sm shrink-0">
                <span className="font-heading font-bold text-sm">{total} courses</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-black bg-cream/50 py-5 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search courses by title or keyword..."
                  className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-lg font-body text-sm focus:outline-none focus:shadow-brutal-sm transition-shadow bg-white"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      if (search) {
                        setSearch('')
                        setPage(1)
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="font-heading font-bold px-5 py-3 bg-charcoal text-white border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 shrink-0"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              <div className="flex border-2 border-black rounded-lg overflow-hidden">
                {[
                  { label: 'All', value: '' },
                  { label: 'Free', value: 'true' },
                  { label: 'Paid', value: 'false' },
                ].map((opt, i) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setIsFree(opt.value)
                      setPage(1)
                    }}
                    className={`px-4 py-2.5 font-heading font-bold text-sm transition-colors cursor-pointer ${
                      isFree === opt.value ? 'bg-sunshine text-black' : 'bg-white hover:bg-gray-50'
                    } ${i > 0 ? 'border-l-2 border-black' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-')
                  setSortBy(sb)
                  setSortOrder(so)
                  setPage(1)
                }}
                className="px-4 py-2.5 border-2 border-black rounded-lg font-heading font-bold text-sm bg-white focus:outline-none focus:shadow-brutal-sm transition-shadow cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23000%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-size-[12px] bg-position-[right_12px_center] bg-no-repeat pr-9"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="title-asc">Title A–Z</option>
                <option value="title-desc">Title Z–A</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="updated_at-desc">Recently Updated</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs text-gray-500 font-medium">Filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1.5 bg-skyblue border-2 border-black rounded-md px-2.5 py-1 text-xs font-bold">
                  &ldquo;{search}&rdquo;
                  <button
                    onClick={() => {
                      setSearch('')
                      setSearchInput('')
                      setPage(1)
                    }}
                    className="hover:text-coral transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {isFree !== '' && (
                <span className="inline-flex items-center gap-1.5 bg-mint border-2 border-black rounded-md px-2.5 py-1 text-xs font-bold">
                  {isFree === 'true' ? 'Free Only' : 'Paid Only'}
                  <button
                    onClick={() => {
                      setIsFree('')
                      setPage(1)
                    }}
                    className="hover:text-coral transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(sortBy !== 'created_at' || sortOrder !== 'desc') && (
                <span className="inline-flex items-center gap-1.5 bg-lavender border-2 border-black rounded-md px-2.5 py-1 text-xs font-bold">
                  Custom Sort
                  <button
                    onClick={() => {
                      setSortBy('created_at')
                      setSortOrder('desc')
                      setPage(1)
                    }}
                    className="hover:text-coral transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-coral hover:text-coral-dark underline underline-offset-2 transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 sm:py-10 px-4 flex-1">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-16">
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 max-w-md mx-auto">
                <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
                  <RefreshCw className="w-7 h-7 text-coral" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">Failed to load courses</h3>
                <p className="text-gray-500 text-sm mb-6">{error}</p>
                <button
                  onClick={fetchCourses}
                  className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && courses.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 max-w-md mx-auto">
                <div className="w-16 h-16 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mx-auto mb-5 shadow-brutal-sm">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">No courses found</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {hasActiveFilters
                    ? 'No courses match your current filters. Try adjusting your search or filters.'
                    : 'No courses are available yet. Check back soon!'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-6 font-medium">
                Showing{' '}
                <span className="font-bold text-black">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total || courses.length)}
                </span>{' '}
                {total > 0 && (
                  <>
                    of <span className="font-bold text-black">{total}</span> courses
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={(page - 1) * limit + i} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="font-heading font-bold px-4 py-2.5 border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-brutal-sm disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5">
                    {generatePageNumbers(page, totalPages).map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-1.5 text-gray-400 font-bold select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 font-heading font-bold border-2 border-black rounded-lg transition-all duration-200 cursor-pointer ${
                            page === p
                              ? 'bg-coral text-white shadow-brutal-sm'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>

                  <span className="sm:hidden text-sm font-heading font-bold bg-white border-2 border-black rounded-lg px-4 py-2.5">
                    {page} / {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="font-heading font-bold px-4 py-2.5 border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-brutal-sm disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
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

export default CourseCatalogPage
