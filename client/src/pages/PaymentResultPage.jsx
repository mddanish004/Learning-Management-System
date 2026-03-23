import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  BarChart3,
  RefreshCw,
  BookOpen,
  ArrowLeft,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const STATUS = {
  CHECKING: 'checking',
  ENROLLED: 'enrolled',
  PENDING: 'pending',
  FAILED: 'failed',
}

const MAX_POLLS = 12
const POLL_INTERVAL = 5000

function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const courseId = searchParams.get('courseId')
  const [status, setStatus] = useState(STATUS.CHECKING)
  const [course, setCourse] = useState(null)
  const [pollCount, setPollCount] = useState(0)
  const [manualChecking, setManualChecking] = useState(false)
  const timerRef = useRef(null)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  const fetchCourse = useCallback(async () => {
    if (!courseId) return
    try {
      const courseHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(apiUrl(`/api/v1/courses/${courseId}`), { headers: courseHeaders, credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCourse(data.course || data)
      }
    } catch {
      /* ignore */
    }
  }, [courseId, token])

  const checkEnrollment = useCallback(async () => {
    if (!token || !courseId) {
      setStatus(STATUS.FAILED)
      return false
    }
    try {
      const res = await fetch(apiUrl(`/api/v1/payments/verify/${courseId}`), {
        headers: authHeaders,
        credentials: 'include',
      })
      if (!res.ok) {
        return false
      }
      const data = await res.json()
      if (data.enrolled) {
        setStatus(STATUS.ENROLLED)
        return true
      }
      if (data.status === 'failed' || data.status === 'cancelled') {
        setStatus(STATUS.FAILED)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [token, courseId, authHeaders])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCourse()
    })
  }, [fetchCourse])

  useEffect(() => {
    if (!courseId || !token) {
      queueMicrotask(() => setStatus(STATUS.FAILED))
      return
    }

    let cancelled = false
    let count = 0

    async function poll() {
      if (cancelled) return
      const found = await checkEnrollment()
      if (cancelled) return
      if (found) return

      count += 1
      setPollCount(count)

      if (count >= MAX_POLLS) {
        setStatus(STATUS.PENDING)
        return
      }

      timerRef.current = setTimeout(poll, POLL_INTERVAL)
    }

    queueMicrotask(() => {
      void poll()
    })

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [courseId, token, checkEnrollment])

  async function handleManualCheck() {
    setManualChecking(true)
    const found = await checkEnrollment()
    if (!found) {
      setStatus(STATUS.PENDING)
    }
    setManualChecking(false)
  }

  const courseName = course?.title || 'your course'

  const STEPS = [
    {
      key: 'payment',
      label: 'Payment processed',
      description: 'Your payment was submitted to the provider.',
    },
    {
      key: 'enrollment',
      label: 'Enrollment activation',
      description:
        status === STATUS.ENROLLED
          ? 'Your enrollment is active.'
          : status === STATUS.CHECKING
            ? 'Waiting for confirmation...'
            : 'Enrollment may still be processing.',
    },
    {
      key: 'access',
      label: 'Course access',
      description:
        status === STATUS.ENROLLED
          ? 'You can start learning now.'
          : 'Available once enrollment is confirmed.',
    },
  ]

  function stepStatus(key) {
    if (key === 'payment') return 'done'
    if (key === 'enrollment') {
      if (status === STATUS.ENROLLED) return 'done'
      if (status === STATUS.CHECKING) return 'active'
      return 'waiting'
    }
    if (key === 'access') {
      if (status === STATUS.ENROLLED) return 'done'
      return 'waiting'
    }
    return 'waiting'
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="bg-white border-b-2 border-black py-3 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 font-heading font-bold text-sm text-gray-600 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to courses
          </Link>
        </div>
      </div>

      <section className="flex-1 py-8 sm:py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-6 sm:p-8 text-center">
            {status === STATUS.CHECKING && (
              <>
                <div className="w-20 h-20 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mx-auto mb-5 shadow-brutal-sm">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2">
                  Confirming your payment
                </h1>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                  We&apos;re verifying your enrollment for <span className="font-bold">{courseName}</span>.
                  This usually takes a few seconds.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Check {pollCount}/{MAX_POLLS}</span>
                </div>
              </>
            )}

            {status === STATUS.ENROLLED && (
              <>
                <div className="w-20 h-20 bg-mint border-2 border-black rounded-full flex items-center justify-center mx-auto mb-5 shadow-brutal-sm">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2">
                  You&apos;re all set!
                </h1>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                  Payment confirmed and you&apos;re now enrolled in <span className="font-bold">{courseName}</span>.
                  Start learning right away.
                </p>
              </>
            )}

            {status === STATUS.PENDING && (
              <>
                <div className="w-20 h-20 bg-peach border-2 border-black rounded-full flex items-center justify-center mx-auto mb-5 shadow-brutal-sm">
                  <Clock className="w-10 h-10" />
                </div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2">
                  Still processing
                </h1>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                  Your payment for <span className="font-bold">{courseName}</span> is being processed.
                  Enrollment is usually activated within a few minutes.
                </p>
              </>
            )}

            {status === STATUS.FAILED && (
              <>
                <div className="w-20 h-20 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5 shadow-brutal-sm">
                  <XCircle className="w-10 h-10 text-coral" />
                </div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                  {!token
                    ? 'You need to be logged in to verify enrollment.'
                    : !courseId
                      ? 'No course information was provided. Please return to the course page.'
                      : 'We couldn\u2019t verify your enrollment. Please try again or contact support.'}
                </p>
              </>
            )}
          </div>

          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b-2 border-black">
              <h2 className="font-heading font-bold text-lg">Status timeline</h2>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-0">
                {STEPS.map((step, i) => {
                  const s = stepStatus(step.key)
                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full border-2 border-black flex items-center justify-center shrink-0 shadow-brutal-sm ${
                            s === 'done'
                              ? 'bg-mint'
                              : s === 'active'
                                ? 'bg-sunshine'
                                : 'bg-gray-100'
                          }`}
                        >
                          {s === 'done' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : s === 'active' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 min-h-[32px] ${
                              s === 'done' ? 'bg-black' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className="font-heading font-bold text-sm sm:text-base">{step.label}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-black shadow-brutal-sm rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {status === STATUS.ENROLLED && courseId && (
                <>
                  <Link
                    to={`/learn/courses/${courseId}`}
                    className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Learning
                  </Link>
                  <Link
                    to={`/progress/${courseId}`}
                    className="font-heading font-bold px-6 py-3 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" /> View Progress
                  </Link>
                </>
              )}

              {(status === STATUS.PENDING || status === STATUS.CHECKING) && (
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={manualChecking}
                  className="font-heading font-bold px-6 py-3 bg-ocean text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-70"
                >
                  {manualChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Check enrollment status
                </button>
              )}

              {status === STATUS.FAILED && (
                <>
                  {!token ? (
                    <Link
                      to="/auth/login"
                      className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                    >
                      Log in
                    </Link>
                  ) : courseId ? (
                    <button
                      type="button"
                      onClick={handleManualCheck}
                      disabled={manualChecking}
                      className="font-heading font-bold px-6 py-3 bg-ocean text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-70"
                    >
                      {manualChecking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Retry check
                    </button>
                  ) : null}
                </>
              )}

              <Link
                to={courseId ? `/courses/${courseId}` : '/courses'}
                className="font-heading font-bold px-6 py-3 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> {courseId ? 'Course page' : 'Browse courses'}
              </Link>

              <Link
                to="/my-learning"
                className="font-heading font-bold px-6 py-3 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                My Learning
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default PaymentResultPage
