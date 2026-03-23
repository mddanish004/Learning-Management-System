import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Download,
  Loader2,
  AlertTriangle,
  BookOpen,
  File,
  RefreshCw,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function getFileIcon(fileType) {
  if (fileType === 'application/pdf') return 'bg-coral'
  if (fileType?.includes('wordprocessingml')) return 'bg-ocean'
  if (fileType === 'application/msword') return 'bg-ocean'
  return 'bg-lavender'
}

function getFileExtension(fileName) {
  if (!fileName) return ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function CourseResourcesPage() {
  const { id: courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [courseError, setCourseError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadError, setDownloadError] = useState('')

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchData = useCallback(async () => {
    setLoading(true)
    setCourseError(null)
    try {
      const courseHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(apiUrl(`/api/v1/courses/${courseId}`), { headers: courseHeaders, credentials: 'include' })
      if (!res.ok) {
        if (res.status === 404) throw new Error('Course not found')
        throw new Error('Failed to load course')
      }
      const data = await res.json()
      setCourse(data.course || data)

      if (token) {
        try {
          const resResources = await fetch(apiUrl(`/api/v1/resources/course/${courseId}`), {
            headers: courseHeaders,
            credentials: 'include',
          })
          if (resResources.ok) {
            const resData = await resResources.json()
            setResources(resData.resources || [])
          }
        } catch {
          setResources([])
        }
      }
    } catch (err) {
      setCourseError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDownload(resourceId) {
    if (!token) {
      setDownloadError('Please log in to download resources')
      return
    }
    setDownloadingId(resourceId)
    setDownloadError('')
    try {
      const res = await fetch(apiUrl(`/api/v1/resources/${resourceId}/download`), {
        headers: authHeaders,
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.download_url) {
        window.open(data.download_url, '_blank')
      } else if (res.status === 404) {
        setDownloadError('Resource not found')
      } else if (res.status === 403) {
        setDownloadError('You must be enrolled to download resources')
      } else {
        setDownloadError(data.error || 'Failed to get download link')
      }
    } catch {
      setDownloadError('Network error. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="bg-white border-2 border-black rounded-2xl p-6 space-y-4">
            <div className="h-7 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 border-2 border-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (courseError) {
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
                type="button"
                onClick={fetchData}
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
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to={`/courses/${courseId}`}
              className="p-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-lg sm:text-xl truncate">
                Course Resources
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">
                {course?.title || 'Course'}
              </p>
            </div>
          </div>
          <Link
            to={`/learn/courses/${courseId}`}
            className="font-heading font-bold px-4 py-2 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 text-sm inline-flex items-center gap-2 shrink-0"
          >
            <BookOpen className="w-4 h-4" /> Learn
          </Link>
        </div>
      </div>

      <section className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {downloadError && (
            <div className="bg-coral/10 border-2 border-coral rounded-xl p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
              <span className="text-coral-dark">{downloadError}</span>
            </div>
          )}

          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b-2 border-black flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg">Downloadable files</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {resources.length} resource{resources.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                <FileText className="w-4 h-4" />
                <span>PDF, DOC, DOCX</span>
              </div>
            </div>

            {resources.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-lavender border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
                  <File className="w-8 h-8" />
                </div>
                <p className="font-heading font-bold text-lg mb-1">No resources</p>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  No downloadable resources have been added to this course yet.
                </p>
              </div>
            ) : (
              <div className="divide-y-2 divide-gray-100">
                {resources.map((resource) => {
                  const ext = getFileExtension(resource.file_name)
                  const iconBg = getFileIcon(resource.file_type)
                  const isDownloading = downloadingId === resource.id

                  return (
                    <div
                      key={resource.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4"
                    >
                      <div
                        className={`w-12 h-12 ${iconBg} border-2 border-black rounded-xl flex items-center justify-center shadow-brutal-sm shrink-0`}
                      >
                        <span className="font-heading font-bold text-xs text-white">
                          {ext}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-sm sm:text-base truncate">
                          {resource.file_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          <span>{formatFileSize(resource.file_size)}</span>
                          {resource.created_at && (
                            <>
                              <span className="hidden sm:inline">·</span>
                              <span>{formatDate(resource.created_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownload(resource.id)}
                        disabled={isDownloading}
                        className="font-heading font-bold px-4 py-2 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 text-sm disabled:opacity-70 shrink-0"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isDownloading ? 'Loading...' : 'Download'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to={`/courses/${courseId}`}
              className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm"
            >
              <BookOpen className="w-4 h-4" /> Course detail
            </Link>
            <Link
              to={`/learn/courses/${courseId}`}
              className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 text-sm"
            >
              Course player
            </Link>
            <Link
              to={`/progress/${courseId}`}
              className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm"
            >
              Progress
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default CourseResourcesPage
