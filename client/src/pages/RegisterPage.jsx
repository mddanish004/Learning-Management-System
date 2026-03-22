import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../hooks/useAuth'

const PASSWORD_CHECKS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

const STRENGTH_COLORS = ['bg-gray-200', 'bg-coral', 'bg-sunshine', 'bg-ocean', 'bg-mint']
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'learner',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordStrength = PASSWORD_CHECKS.filter((c) => c.test(formData.password)).length

  function validateForm() {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!['learner', 'instructor'].includes(formData.role)) {
      newErrors.role = 'Invalid role selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          setServerError(data.errors.join(', '))
        } else if (data.error) {
          setServerError(data.error)
        } else {
          setServerError('Registration failed. Please try again.')
        }
        return
      }

      if (data.accessToken) {
        login(data.accessToken)
        navigate(formData.role === 'instructor' ? '/dashboard/instructor' : '/courses')
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/auth/login'), 2500)
    } catch {
      setServerError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-mint border-2 border-black shadow-brutal-lg rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-brutal-sm">
              <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
            </div>
            <h2 className="font-heading font-bold text-2xl mb-3">Account Created!</h2>
            <p className="text-gray-700 mb-6">
              Your account has been created successfully. Redirecting you to login...
            </p>
            <Link
              to="/auth/login"
              className="font-heading font-bold px-6 py-3 bg-charcoal text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 inline-flex items-center gap-2"
            >
              Go to Login <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="flex min-h-[calc(100vh-64px)]">
        <div className="hidden lg:flex lg:w-1/2 bg-ocean relative overflow-hidden items-center justify-center p-12 border-r-2 border-black">
          <div className="absolute top-8 left-8 w-20 h-20 bg-sunshine border-2 border-black rounded-full shadow-brutal-sm" />
          <div className="absolute bottom-12 right-12 w-16 h-16 bg-blush border-2 border-black rounded-lg rotate-12 shadow-brutal-sm" />
          <div className="absolute top-1/3 right-8 w-12 h-12 bg-mint border-2 border-black rounded-full" />
          <div className="absolute bottom-1/4 left-16 w-10 h-10 bg-lavender border-2 border-black rounded-lg -rotate-6" />

          <div className="relative z-10 max-w-md text-center">
            <div className="w-20 h-20 bg-white border-2 border-black rounded-2xl shadow-brutal flex items-center justify-center mx-auto mb-8 p-1.5">
              <BrandLogo className="w-full h-full rounded-xl object-cover" />
            </div>
            <h2 className="font-heading font-bold text-3xl text-white mb-4">
              Join Penta Academy Today
            </h2>
            <p className="text-white/90 text-lg mb-10 leading-relaxed">
              Start your learning journey with thousands of courses, AI-powered quizzes, and a
              supportive community.
            </p>

            <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 text-left">
              <p className="text-gray-700 mb-4 italic leading-relaxed">
                &ldquo;Penta Academy transformed my career. The AI quizzes helped me truly understand
                the material, not just memorize it.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lavender border-2 border-black rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0">
                  AK
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">Amara Khan</p>
                  <p className="text-xs text-gray-500">Frontend Developer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 bg-white border-2 border-black rounded-xl shadow-brutal-sm flex items-center justify-center mx-auto mb-4 p-1">
                <BrandLogo className="w-full h-full rounded-lg object-cover" />
              </div>
              <h1 className="font-heading font-bold text-2xl">Join Penta Academy</h1>
              <p className="text-gray-500 text-sm mt-1">Create your account to get started</p>
            </div>

            <div className="bg-white border-2 border-black shadow-brutal-lg rounded-2xl p-6 sm:p-8">
              <div className="mb-6 hidden lg:block">
                <h2 className="font-heading font-bold text-2xl mb-1">Create your account</h2>
                <p className="text-gray-500 text-sm">Fill in your details to get started</p>
              </div>

              {serverError && (
                <div className="bg-coral/10 border-2 border-coral rounded-lg p-3 mb-5 text-sm font-medium flex items-start gap-2">
                  <X className="w-4 h-4 mt-0.5 shrink-0 text-coral" />
                  <span className="text-coral-dark">{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-heading font-bold text-sm mb-1.5 block">
                    Full Name <span className="text-coral">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 border-2 ${
                      errors.name ? 'border-coral' : 'border-black'
                    } rounded-lg font-body text-sm focus:outline-none focus:shadow-brutal-sm transition-shadow bg-white`}
                  />
                  {errors.name && (
                    <p className="text-coral text-xs mt-1.5 font-medium">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="font-heading font-bold text-sm mb-1.5 block">
                    Email Address <span className="text-coral">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 border-2 ${
                      errors.email ? 'border-coral' : 'border-black'
                    } rounded-lg font-body text-sm focus:outline-none focus:shadow-brutal-sm transition-shadow bg-white`}
                  />
                  {errors.email && (
                    <p className="text-coral text-xs mt-1.5 font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="font-heading font-bold text-sm mb-1.5 block">
                    Password <span className="text-coral">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`w-full px-4 py-3 pr-12 border-2 ${
                        errors.password ? 'border-coral' : 'border-black'
                      } rounded-lg font-body text-sm focus:outline-none focus:shadow-brutal-sm transition-shadow bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-coral text-xs mt-1.5 font-medium">{errors.password}</p>
                  )}

                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full ${
                                passwordStrength >= level
                                  ? STRENGTH_COLORS[passwordStrength]
                                  : 'bg-gray-200'
                              } transition-colors`}
                            />
                          ))}
                        </div>
                        {passwordStrength > 0 && (
                          <span
                            className={`text-xs font-bold ${
                              passwordStrength <= 1
                                ? 'text-coral'
                                : passwordStrength === 2
                                  ? 'text-yellow-600'
                                  : passwordStrength === 3
                                    ? 'text-ocean'
                                    : 'text-green-600'
                            }`}
                          >
                            {STRENGTH_LABELS[passwordStrength]}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {PASSWORD_CHECKS.map((check) => (
                          <span
                            key={check.label}
                            className={`text-[11px] flex items-center gap-1 ${
                              check.test(formData.password) ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            <Check className="w-3 h-3 shrink-0" />
                            {check.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-heading font-bold text-sm mb-2 block">
                    I want to <span className="text-coral">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('role', 'learner')}
                      className={`flex flex-col items-center gap-2 p-4 border-2 border-black rounded-xl transition-all duration-200 cursor-pointer ${
                        formData.role === 'learner'
                          ? 'bg-mint shadow-brutal-sm'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <BrandLogo className="w-6 h-6 rounded-md object-cover border border-black/10" />
                      <span className="font-heading font-bold text-sm">Learn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('role', 'instructor')}
                      className={`flex flex-col items-center gap-2 p-4 border-2 border-black rounded-xl transition-all duration-200 cursor-pointer ${
                        formData.role === 'instructor'
                          ? 'bg-lavender shadow-brutal-sm'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <BookOpen className="w-6 h-6" />
                      <span className="font-heading font-bold text-sm">Teach</span>
                    </button>
                  </div>
                  {errors.role && (
                    <p className="text-coral text-xs mt-1.5 font-medium">{errors.role}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-heading font-bold py-3.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-brutal disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="font-heading font-bold text-ocean hover:text-ocean-dark underline underline-offset-2 transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
