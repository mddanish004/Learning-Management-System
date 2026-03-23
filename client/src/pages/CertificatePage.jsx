import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import BrandLogo from '../components/BrandLogo'
import Footer from '../components/Footer'

function CertificatePage() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const courseHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      const courseRes = await fetch(apiUrl(`/api/v1/courses/${courseId}`), { headers: courseHeaders, credentials: 'include' })
      if (!courseRes.ok) {
        if (courseRes.status === 404) throw new Error('Course not found')
        throw new Error('Failed to load course')
      }
      const courseData = await courseRes.json()
      setCourse(courseData.course || courseData)

      if (!token) {
        setError('auth')
        return
      }

      const [progressRes, certRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/progress/${courseId}`), { headers: authHeaders, credentials: 'include' }),
        fetch(apiUrl(`/api/v1/certificates/course/${courseId}`), { headers: authHeaders, credentials: 'include' }),
      ])

      if (progressRes.ok) {
        const progressData = await progressRes.json()
        setProgress(progressData)
      } else if (progressRes.status === 403) {
        setError('not_enrolled')
        return
      }

      if (certRes.ok) {
        const certData = await certRes.json()
        if (certData.certificate) setCertificate(certData.certificate)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, token, authHeaders])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch(apiUrl(`/api/v1/certificates/generate/${courseId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setCertificate(data.certificate)
      } else if (res.status === 400) {
        setGenerateError(data.error || 'Course must be 100% complete')
        if (data.progress) {
          setProgress((prev) => ({
            ...prev,
            completion_percentage: data.progress.completion_percentage,
            completed_lessons: data.progress.completed_lessons,
            total_lessons: data.progress.total_lessons,
          }))
        }
      } else if (res.status === 403) {
        setGenerateError('You must be enrolled to generate a certificate')
      } else if (res.status === 500) {
        const msg = data.error || ''
        if (msg.toLowerCase().includes('s3')) {
          setGenerateError('Storage is not configured on the server. Please contact the administrator.')
        } else {
          setGenerateError(msg || 'Server error generating certificate')
        }
      } else {
        setGenerateError(data.error || 'Failed to generate certificate')
      }
    } catch {
      setGenerateError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownload() {
    if (!certificate?.id) return
    setDownloading(true)
    setDownloadError('')
    try {
      const res = await fetch(apiUrl(`/api/v1/certificates/${certificate.id}/download`), {
        headers: authHeaders,
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.download_url) {
        window.open(data.download_url, '_blank')
      } else if (res.status === 500 && (data.error || '').toLowerCase().includes('s3')) {
        setDownloadError('Storage is not configured on the server. Please contact the administrator.')
      } else {
        setDownloadError(data.error || 'Failed to get download link')
      }
    } catch {
      setDownloadError('Network error. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const completionPct = progress?.completion_percentage ?? 0
  const isComplete = completionPct >= 100
  const courseName = course?.title || 'Course'

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatFileSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="bg-white border-2 border-black rounded-2xl p-8 space-y-5">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (error === 'auth') {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-ocean/15 border-2 border-ocean rounded-full flex items-center justify-center mx-auto mb-5">
              <Award className="w-8 h-8 text-ocean" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Sign in required</h2>
            <p className="text-gray-500 text-sm mb-6">Log in to access your certificate.</p>
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

  if (error === 'not_enrolled') {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mx-auto mb-5 shadow-brutal-sm">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Enrollment required</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enroll in this course and complete all lessons to earn a certificate.
            </p>
            <Link
              to={`/courses/${courseId}`}
              className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Go to course
            </Link>
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
              <BookOpen className="w-8 h-8 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Cannot load certificate</h2>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
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
        <div className="max-w-3xl mx-auto">
          <Link
            to={`/progress/${courseId}`}
            className="inline-flex items-center gap-2 font-heading font-bold text-sm text-gray-600 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to progress
          </Link>
        </div>
      </div>

      <section className="flex-1 py-8 sm:py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          <div className="bg-cream border-2 border-black shadow-brutal-md rounded-2xl overflow-hidden">
            <div className="bg-coral text-white border-b-2 border-black p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="text-center sm:text-left flex-1">
                  <div className="w-20 h-20 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto sm:mx-0 mb-4 shadow-brutal-sm">
                    <Award className="w-10 h-10 text-charcoal" />
                  </div>
                  <p className="font-heading font-bold text-xs uppercase tracking-widest text-white/90 mb-2">Penta Academy</p>
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-1">Certificate of Completion</h1>
                  <p className="text-sm text-white/95 font-medium">{courseName}</p>
                </div>
                <div className="w-28 bg-sunshine border-2 border-black rounded-xl p-3 shadow-brutal-sm text-center mx-auto sm:mx-0 sm:shrink-0">
                  <BrandLogo className="w-14 h-14 rounded-lg object-cover mx-auto border border-black/10" />
                  <p className="font-heading font-bold text-[10px] text-charcoal mt-2 leading-tight">VERIFIED</p>
                  <p className="text-[9px] text-gray-800 leading-tight">Penta Academy</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-white">
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-heading font-bold">Course completion</span>
                  <span className="font-heading font-bold">{completionPct}%</span>
                </div>
                <div className="h-4 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-mint' : 'bg-sunshine'
                    }`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
                  <span>
                    {progress?.completed_lessons ?? 0} of {progress?.total_lessons ?? 0} lessons
                  </span>
                  {isComplete && (
                    <span className="inline-flex items-center gap-1 text-mint font-heading font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </span>
                  )}
                </div>
              </div>

              {!isComplete && (
                <div className="bg-peach/30 border-2 border-black rounded-xl p-4 sm:p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-peach border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-brutal-sm">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm mb-1">Keep going!</h3>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        Complete all lessons to unlock your certificate.
                        You&apos;re {completionPct}% there.
                      </p>
                      <Link
                        to={`/learn/courses/${courseId}`}
                        className="inline-block mt-3 font-heading font-bold text-sm text-ocean hover:underline"
                      >
                        Continue learning →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {isComplete && !certificate && (
                <div className="bg-mint/20 border-2 border-black rounded-xl p-4 sm:p-5 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-mint border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-brutal-sm">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm">Ready to generate</h3>
                        <p className="text-xs text-gray-600">
                          You&apos;ve completed all lessons. Generate your certificate now.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-70 shrink-0"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                      {generating ? 'Generating...' : 'Generate certificate'}
                    </button>
                  </div>
                  {generateError && (
                    <div className="mt-3 bg-coral/10 border-2 border-coral rounded-xl p-3 flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
                      <span className="text-coral-dark">{generateError}</span>
                    </div>
                  )}
                </div>
              )}

              {certificate && (
                <div className="bg-mint/25 border-2 border-black rounded-xl p-5 sm:p-6 mb-6 shadow-brutal-sm">
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-28 shrink-0 mx-auto sm:mx-0 bg-sunshine border-2 border-black rounded-xl p-3 shadow-brutal-sm flex flex-col items-center justify-center text-center">
                      <BrandLogo className="w-14 h-14 rounded-lg object-cover border border-black/10" />
                      <p className="font-heading font-bold text-xs text-charcoal mt-2">VERIFIED</p>
                      <p className="text-[10px] text-gray-800 leading-tight mt-0.5">Penta Academy</p>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-heading font-bold text-lg mb-1">
                        Certificate ready
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">Issued by Penta Academy</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        {certificate.issued_at && (
                          <p>Issued: {formatDate(certificate.issued_at)}</p>
                        )}
                        {certificate.file_name && (
                          <p>File: {certificate.file_name}</p>
                        )}
                        {certificate.file_size && (
                          <p>Size: {formatFileSize(certificate.file_size)}</p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={handleDownload}
                          disabled={downloading}
                          className="font-heading font-bold px-5 py-2.5 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-70"
                        >
                          {downloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {downloading ? 'Preparing...' : 'Download PDF'}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={generating}
                          className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 disabled:opacity-70 text-sm"
                        >
                          {generating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Regenerate
                        </button>
                      </div>
                      {downloadError && (
                        <div className="mt-3 bg-coral/10 border-2 border-coral rounded-xl p-3 flex items-start gap-2 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
                          <span className="text-coral-dark">{downloadError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Link
                  to={`/learn/courses/${courseId}`}
                  className="font-heading font-bold px-5 py-2.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 text-sm"
                >
                  <BookOpen className="w-4 h-4" /> Course player
                </Link>
                <Link
                  to={`/progress/${courseId}`}
                  className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <BarChart3 className="w-4 h-4" /> Progress
                </Link>
                <Link
                  to="/my-learning"
                  className="font-heading font-bold px-5 py-2.5 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2 text-sm"
                >
                  My Learning
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default CertificatePage
