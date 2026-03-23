import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  BookOpen,
  Users,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function CheckoutPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [courseError, setCourseError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null

  const fetchCourse = useCallback(async () => {
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
      const c = data.course || data
      setCourse(c)
      if (c.is_enrolled) setAlreadyEnrolled(true)
    } catch (err) {
      setCourseError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, token])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  async function handleCheckout() {
    if (!token) {
      navigate('/auth/login')
      return
    }

    setSubmitting(true)
    setPaymentError('')

    try {
      const returnUrl = `${window.location.origin}/checkout/result?courseId=${courseId}`

      const res = await fetch(apiUrl('/api/v1/payments/order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          course_id: courseId,
          quantity: 1,
          return_url: returnUrl,
        }),
        credentials: 'include',
      })

      const data = await res.json()

      if (res.status === 409) {
        setAlreadyEnrolled(true)
        return
      }

      if (res.status === 400) {
        setPaymentError(data.error || 'This course is not available for purchase')
        return
      }

      if (res.status === 401) {
        navigate('/auth/login')
        return
      }

      if (res.status === 404) {
        setPaymentError(data.error || 'Course or user not found')
        return
      }

      if (!res.ok) {
        setPaymentError(data.error || 'Failed to create checkout session')
        return
      }

      if (data.order?.checkout_url) {
        window.location.href = data.order.checkout_url
      } else {
        setPaymentError('No checkout URL received. Please try again.')
      }
    } catch {
      setPaymentError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isFree = course?.is_free || parseFloat(course?.price) === 0
  const instructorName = course?.instructor?.name || 'Instructor'

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3 bg-white border-2 border-black rounded-2xl p-6 space-y-4">
              <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-2 pt-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="md:col-span-2 bg-white border-2 border-black rounded-2xl p-6 space-y-4">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
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
                onClick={fetchCourse}
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
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 font-heading font-bold text-sm text-gray-600 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to course
          </Link>
        </div>
      </div>

      <section className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-6">Checkout</h1>

          {alreadyEnrolled ? (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 bg-mint border-2 border-black rounded-full flex items-center justify-center mb-5 shadow-brutal-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="font-heading font-bold text-xl mb-2">Already enrolled</h2>
                <p className="text-gray-600 text-sm mb-6 max-w-sm">
                  You already have access to this course. No payment needed.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to={`/learn/courses/${courseId}`}
                    className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                  >
                    Start Learning
                  </Link>
                  <Link
                    to={`/progress/${courseId}`}
                    className="font-heading font-bold px-6 py-3 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                  >
                    View Progress
                  </Link>
                </div>
              </div>
            </div>
          ) : isFree ? (
            <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 bg-sunshine border-2 border-black rounded-full flex items-center justify-center mb-5 shadow-brutal-sm">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h2 className="font-heading font-bold text-xl mb-2">This course is free</h2>
                <p className="text-gray-600 text-sm mb-6 max-w-sm">
                  No payment required. Head to the course page to enroll for free.
                </p>
                <Link
                  to={`/courses/${courseId}`}
                  className="font-heading font-bold px-6 py-3 bg-mint text-black border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
                >
                  Go to course
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-3 space-y-6">
                <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
                  <div className="bg-ocean border-b-2 border-black p-5 sm:p-6">
                    <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
                      Order summary
                    </h2>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-lavender border-2 border-black rounded-xl flex items-center justify-center shadow-brutal-sm shrink-0">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-bold text-base sm:text-lg line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">By {instructorName}</p>
                        {course.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-5 border-t-2 border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="w-4 h-4" /> Course
                        </span>
                        <span className="font-heading font-bold">${course.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" /> Quantity
                        </span>
                        <span className="font-heading font-bold">1</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t-2 border-black">
                        <span className="font-heading font-bold text-lg">Total</span>
                        <span className="font-heading font-bold text-2xl">${course.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-black shadow-brutal-sm rounded-2xl p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-mint border-2 border-black rounded-xl flex items-center justify-center shrink-0 shadow-brutal-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm">Secure payment</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Your payment is processed securely through Dodo Payments. You will be
                        redirected to a secure checkout page to complete your purchase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="bg-white border-2 border-black shadow-brutal-md rounded-2xl p-5 sm:p-6 md:sticky md:top-24 space-y-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-heading tracking-wider mb-1">
                      Amount due
                    </p>
                    <p className="font-heading font-bold text-3xl">${course.price}</p>
                  </div>

                  {paymentError && (
                    <div className="bg-coral/10 border-2 border-coral rounded-xl p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
                      <span className="text-coral-dark text-xs">{paymentError}</span>
                    </div>
                  )}

                  {!token ? (
                    <Link
                      to="/auth/login"
                      className="w-full font-heading font-bold py-3.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
                    >
                      Log in to purchase
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={submitting}
                      className="w-full font-heading font-bold py-3.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:opacity-70"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                      {submitting ? 'Redirecting...' : 'Pay now'}
                    </button>
                  )}

                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    By clicking Pay now you agree to be redirected to Dodo Payments to complete
                    the transaction. Enrollment is activated automatically after payment.
                  </p>

                  <div className="border-t-2 border-gray-100 pt-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-mint" />
                      <span>Instant access after payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-mint" />
                      <span>Lifetime course access</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-mint" />
                      <span>Certificate on completion</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default CheckoutPage
