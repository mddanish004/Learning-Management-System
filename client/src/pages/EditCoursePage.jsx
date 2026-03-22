import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, X, BookOpen, RefreshCw, Edit } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TITLE_MIN = 3
const TITLE_MAX = 200
const DESC_MAX = 5000
const PRICE_MIN = 0
const PRICE_MAX = 999999.99

function EditCoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_free: true,
    price: '0',
    is_published: false,
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null

  const fetchCourse = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`/api/v1/courses/${id}`, { headers, credentials: 'include' })
      if (!res.ok) {
        if (res.status === 404) throw new Error('Course not found')
        if (res.status === 403) throw new Error('You do not have permission to edit this course')
        throw new Error('Failed to load course')
      }
      const data = await res.json()
      const c = data.course || data
      setCourse(c)
      setFormData({
        title: c.title || '',
        description: c.description || '',
        is_free: c.is_free ?? true,
        price: c.price ?? '0',
        is_published: c.is_published ?? false,
      })
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  function validate() {
    const next = {}

    const title = formData.title.trim()
    if (!title) {
      next.title = 'Title is required'
    } else if (title.length < TITLE_MIN) {
      next.title = `Title must be at least ${TITLE_MIN} characters`
    } else if (title.length > TITLE_MAX) {
      next.title = `Title must be at most ${TITLE_MAX} characters`
    }

    if (formData.description && formData.description.length > DESC_MAX) {
      next.description = `Description must be at most ${DESC_MAX} characters`
    }

    if (!formData.is_free) {
      const num = parseFloat(formData.price)
      if (formData.price === '' || isNaN(num)) {
        next.price = 'Enter a valid price'
      } else if (num < PRICE_MIN || num > PRICE_MAX) {
        next.price = `Price must be between ${PRICE_MIN} and ${PRICE_MAX}`
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (field === 'is_free' && value === true) {
      setFormData((prev) => ({ ...prev, price: '0' }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const token = sessionStorage.getItem('accessToken')
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim() ?? '',
        is_free: formData.is_free,
        is_published: formData.is_published,
      }
      if (!formData.is_free) {
        body.price = formData.price
      }

      const res = await fetch(`/api/v1/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          setServerError('You do not have permission to edit this course.')
          return
        }
        if (res.status === 404) {
          setServerError('Course not found or deleted.')
          return
        }
        if (data.errors && Array.isArray(data.errors)) {
          setServerError(data.errors.join('. '))
        } else if (data.error) {
          setServerError(data.error)
        } else {
          setServerError('Failed to update course')
        }
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard/instructor/courses', { replace: true })
      }, 1800)
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <section className="border-b-2 border-black bg-white py-4 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </section>
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border-2 border-black rounded-2xl p-8 space-y-6">
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-32 w-full bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-1/2 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex gap-3">
                <div className="h-12 flex-1 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-12 flex-1 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-coral/15 border-2 border-coral rounded-full flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8 text-coral" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">
              {loadError === 'Course not found' ? 'Course not found' : 'Cannot load course'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {loadError === 'Course not found'
                ? 'This course may have been removed or the link is incorrect.'
                : loadError}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/instructor/courses"
                className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> My courses
              </Link>
              <button
                onClick={fetchCourse}
                className="font-heading font-bold px-6 py-3 bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-mint border-2 border-black shadow-brutal-lg rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-brutal-sm">
              <Edit className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-bold text-2xl mb-3">Course updated</h2>
            <p className="text-gray-700 mb-6">Redirecting to your courses...</p>
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-coral" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <section className="border-b-2 border-black bg-white py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/instructor/courses"
              className="p-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading font-bold text-xl sm:text-2xl truncate">
                Edit course
              </h1>
              <p className="text-gray-500 text-sm mt-0.5 truncate">
                {course?.title || 'Update course details'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8 px-4 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-6 sm:p-8">
            {serverError && (
              <div className="bg-coral/10 border-2 border-coral rounded-lg p-3 mb-6 text-sm font-medium flex items-start gap-2">
                <X className="w-4 h-4 mt-0.5 shrink-0 text-coral" />
                <span className="text-coral-dark">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-heading font-bold text-sm mb-1.5 block">
                  Course title <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Introduction to Web Development"
                  maxLength={TITLE_MAX + 10}
                  className={`w-full px-4 py-3 border-2 ${
                    errors.title ? 'border-coral' : 'border-black'
                  } rounded-lg font-body text-sm focus:outline-none focus:shadow-brutal-sm transition-shadow bg-white`}
                />
                <div className="flex justify-between mt-1">
                  {errors.title ? (
                    <p className="text-coral text-xs font-medium">{errors.title}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">
                    {formData.title.trim().length}/{TITLE_MAX}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-sm mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="What will students learn?"
                  rows={5}
                  maxLength={DESC_MAX + 100}
                  className={`w-full px-4 py-3 border-2 ${
                    errors.description ? 'border-coral' : 'border-black'
                  } rounded-lg font-body text-sm focus:outline-none focus:shadow-brutal-sm transition-shadow bg-white resize-y min-h-[120px]`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-coral text-xs font-medium">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">
                    {formData.description.length}/{DESC_MAX}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-sm mb-2 block">Pricing</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('is_free', true)}
                    className={`font-heading font-bold px-4 py-2.5 border-2 border-black rounded-lg transition-all duration-200 cursor-pointer ${
                      formData.is_free ? 'bg-mint shadow-brutal-sm' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('is_free', false)}
                    className={`font-heading font-bold px-4 py-2.5 border-2 border-black rounded-lg transition-all duration-200 cursor-pointer ${
                      !formData.is_free ? 'bg-sunshine shadow-brutal-sm' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    Paid
                  </button>
                </div>
                {!formData.is_free && (
                  <div className="mt-3">
                    <label className="font-heading font-bold text-xs text-gray-600 block mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      className={`w-full max-w-[160px] px-4 py-2.5 border-2 ${
                        errors.price ? 'border-coral' : 'border-black'
                      } rounded-lg font-body text-sm focus:outline-none focus:shadow-brutal-sm bg-white`}
                    />
                    {errors.price && (
                      <p className="text-coral text-xs font-medium mt-1">{errors.price}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="font-heading font-bold text-sm mb-2 block">Publish</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('is_published', false)}
                    className={`font-heading font-bold px-4 py-2.5 border-2 border-black rounded-lg transition-all duration-200 cursor-pointer ${
                      !formData.is_published ? 'bg-gray-200 shadow-brutal-sm' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('is_published', true)}
                    className={`font-heading font-bold px-4 py-2.5 border-2 border-black rounded-lg transition-all duration-200 cursor-pointer ${
                      formData.is_published ? 'bg-mint shadow-brutal-sm' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <Link
                  to="/dashboard/instructor/courses"
                  className="font-heading font-bold px-6 py-3 border-2 border-black rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-heading font-bold px-6 py-3 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-brutal disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-5 h-5" /> Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default EditCoursePage
