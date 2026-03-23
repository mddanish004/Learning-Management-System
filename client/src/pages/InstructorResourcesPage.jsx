import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FolderOpen,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const EXTENSION_TO_MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
const LIMIT = 10

function getExtension(name) {
  if (!name) return ''
  const parts = name.toLowerCase().trim().split('.')
  return parts.length >= 2 ? parts.pop() : ''
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function fileIcon(fileType) {
  if (fileType && fileType.includes('pdf')) return { color: 'bg-coral', label: 'PDF' }
  if (fileType && fileType.includes('wordprocessingml')) return { color: 'bg-ocean', label: 'DOCX' }
  if (fileType && fileType.includes('msword')) return { color: 'bg-skyblue', label: 'DOC' }
  return { color: 'bg-lavender', label: 'FILE' }
}

function InstructorResourcesPage() {
  const { id: courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [resources, setResources] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileValidationError, setFileValidationError] = useState('')
  const fileInputRef = useRef(null)

  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadError, setDownloadError] = useState('')

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null

  const fetchResources = useCallback(async () => {
    if (!token) {
      setError('auth')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      const res = await fetch(apiUrl(`/api/v1/instructor/courses/${courseId}/resources?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) { setError('auth'); return }
        if (res.status === 403) { setError('forbidden'); return }
        if (res.status === 404) { setError('Course not found or you do not own it'); return }
        throw new Error('Failed to load resources')
      }
      const json = await res.json()
      setCourse(json.course)
      setResources(json.resources || [])
      setPagination(json.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, token, page])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  function validateFile(file) {
    if (!file) return 'Please select a file'
    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) return 'Only PDF, DOC, and DOCX files are allowed'
    if (file.size > MAX_FILE_SIZE) return 'Maximum file size is 10 MB'
    if (file.size <= 0) return 'File appears to be empty'
    return ''
  }

  function handleFileSelect(e) {
    setUploadError('')
    setUploadSuccess('')
    setFileValidationError('')
    const file = e.target.files?.[0] || null
    if (!file) {
      setSelectedFile(null)
      return
    }
    const validationErr = validateFile(file)
    if (validationErr) {
      setFileValidationError(validationErr)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setSelectedFile(file)
  }

  function clearFile() {
    setSelectedFile(null)
    setFileValidationError('')
    setUploadError('')
    setUploadSuccess('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (!selectedFile || uploading) return
    const ext = getExtension(selectedFile.name)
    const mimeType = EXTENSION_TO_MIME[ext]
    if (!mimeType) {
      setUploadError('Invalid file type')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch(apiUrl(`/api/v1/instructor/courses/${courseId}/resources/upload`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        if (res.status === 500 && (errJson.error || '').toLowerCase().includes('s3')) {
          setUploadError('Storage (S3) is not configured on the server. Please contact the administrator.')
        } else if (errJson.errors && errJson.errors.length > 0) {
          setUploadError(errJson.errors.join(', '))
        } else {
          setUploadError(errJson.error || 'Upload failed')
        }
        return
      }

      setUploadSuccess(`"${selectedFile.name}" uploaded successfully`)
      clearFile()
      setPage(1)
      await fetchResources()
    } catch (err) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(resourceId) {
    if (downloadingId) return
    setDownloadingId(resourceId)
    setDownloadError('')
    try {
      const res = await fetch(
        apiUrl(`/api/v1/instructor/courses/${courseId}/resources/${resourceId}/download`),
        { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }
      )
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        if (res.status === 500 && (errJson.error || '').toLowerCase().includes('s3')) {
          setDownloadError('Storage (S3) is not configured on the server. Please contact the administrator.')
        } else {
          setDownloadError(errJson.error || 'Download failed')
        }
        return
      }
      const json = await res.json()
      if (json.download_url) {
        window.open(json.download_url, '_blank')
      }
    } catch (err) {
      setDownloadError(err.message || 'Download failed')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(resourceId) {
    if (deletingId) return
    setDeletingId(resourceId)
    setDeleteError('')
    try {
      const res = await fetch(
        apiUrl(`/api/v1/instructor/courses/${courseId}/resources/${resourceId}`),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      )
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        if (res.status === 500 && (errJson.error || '').toLowerCase().includes('s3')) {
          setDeleteError('Storage (S3) is not configured on the server. Please contact the administrator.')
        } else {
          setDeleteError(errJson.error || 'Delete failed')
        }
        return
      }
      if (resources.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        await fetchResources()
      }
    } catch (err) {
      setDeleteError(err.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  if (error === 'auth') {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-ocean/15 border-2 border-ocean rounded-full flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-ocean" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Sign in required</h2>
            <p className="text-gray-500 text-sm mb-6">Log in as an instructor to manage resources.</p>
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
            <h2 className="font-heading font-bold text-xl mb-2">Cannot load resources</h2>
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
                onClick={fetchResources}
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
                Course Resources
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">
                {loading && !course ? 'Loading...' : course?.title || 'Course'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/instructor/courses/${courseId}/analytics`}
              className="font-heading font-bold px-3 py-1.5 text-sm text-ocean hover:text-ocean/70 transition-colors inline-flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>
            <Link
              to={`/dashboard/instructor/courses/${courseId}/lessons`}
              className="font-heading font-bold px-3 py-1.5 text-sm text-ocean hover:text-ocean/70 transition-colors"
            >
              Lessons
            </Link>
          </div>
        </div>
      </div>

      <section className="flex-1 py-6 sm:py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-5 sm:p-6">
            <h2 className="font-heading font-bold text-lg mb-1">Upload resource</h2>
            <p className="text-sm text-gray-500 mb-4">
              PDF, DOC, DOCX — max 10 MB
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex-1 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-black file:text-sm file:font-heading file:font-bold file:bg-sunshine file:text-black file:cursor-pointer file:shadow-brutal-sm file:hover:shadow-none file:hover:translate-x-px file:hover:translate-y-px file:transition-all file:duration-200"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-cream border-2 border-black rounded-xl px-3 py-2 flex items-center gap-2 max-w-xs">
                    <File className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatBytes(selectedFile.size)}</span>
                    <button type="button" onClick={clearFile} className="shrink-0 hover:text-coral transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="font-heading font-bold px-5 py-2 bg-mint text-black border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-2 text-sm shrink-0"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {fileValidationError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-coral font-heading">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {fileValidationError}
              </div>
            )}
            {uploadError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-coral font-heading">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700 font-heading">
                <CheckCircle className="w-4 h-4 shrink-0" /> {uploadSuccess}
              </div>
            )}
          </div>

          {(deleteError || downloadError) && (
            <div className="bg-coral/10 border-2 border-coral rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-coral font-heading">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {deleteError || downloadError}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border-2 border-black rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-lavender/30 border-2 border-lavender rounded-full flex items-center justify-center mx-auto mb-5">
                <FolderOpen className="w-8 h-8 text-lavender" />
              </div>
              <h2 className="font-heading font-bold text-xl mb-2">No resources yet</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Upload PDF, DOC, or DOCX files for your learners. They will appear here once uploaded.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg">
                  Resources
                  {pagination && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({pagination.total})
                    </span>
                  )}
                </h2>
              </div>

              <div className="space-y-3">
                {resources.map((resource) => {
                  const fi = fileIcon(resource.file_type)
                  const isDeleting = deletingId === resource.id
                  const isDownloading = downloadingId === resource.id

                  return (
                    <div
                      key={resource.id}
                      className="bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:px-5">
                        <div className={`w-10 h-10 ${fi.color} border-2 border-black rounded-lg flex items-center justify-center shrink-0`}>
                          <span className="font-heading font-bold text-xs text-white">{fi.label}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm truncate">{resource.file_name}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                            <span>{formatBytes(resource.file_size)}</span>
                            <span>{formatDate(resource.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0">
                          <button
                            type="button"
                            onClick={() => handleDownload(resource.id, resource.file_name)}
                            disabled={isDownloading}
                            className="font-heading font-bold px-3 py-1.5 text-sm bg-ocean text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1.5"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(resource.id)}
                            disabled={isDeleting}
                            className="font-heading font-bold px-3 py-1.5 text-sm bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1.5"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </button>
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

export default InstructorResourcesPage
