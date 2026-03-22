import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, X, BookOpen } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TITLE_MIN = 3
const TITLE_MAX = 200
const DESC_MAX = 5000
const PRICE_MIN = 0
const PRICE_MAX = 999999.99

function CreateCoursePage() {
  const navigate = useNavigate()
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
        description: formData.description.trim() || undefined,
        is_free: formData.is_free,
        is_published: formData.is_published,
      }
      if (!formData.is_free) {
        body.price = formData.price
      }

      const res = await fetch('/api/v1/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setServerError(data.errors.join('. '))
        } else if (data.error) {
          setServerError(data.error)
        } else {
          setServerError('Failed to create course')
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

  if (success) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-mint border-2 border-black shadow-brutal-lg rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-brutal-sm">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="font-heading font-bold text-2xl mb-3">Course created</h2>
            <p className="text-gray-700 mb-6">
              Redirecting you to edit your course...
            </p>
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
            <div>
              <h1 className="font-heading font-bold text-xl sm:text-2xl">Create course</h1>
              <p className="text-gray-500 text-sm mt-0.5">Add a new course to your catalog</p>
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
                      <Loader2 className="w-5 h-5 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" /> Create course
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

export default CreateCoursePage
