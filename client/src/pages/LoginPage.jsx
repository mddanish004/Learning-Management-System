import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  ArrowRight,
  X,
  Loader2,
  BookOpen,
  Brain,
  BarChart3,
  Award,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  { icon: BookOpen, label: 'Expert-led video courses' },
  { icon: Brain, label: 'AI-powered quizzes' },
  { icon: BarChart3, label: 'Progress tracking' },
  { icon: Award, label: 'Completion certificates' },
]

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validateForm() {
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setServerError('Invalid email or password. Please try again.')
        } else if (data.errors) {
          setServerError(data.errors.join(', '))
        } else if (data.error) {
          setServerError(data.error)
        } else {
          setServerError('Login failed. Please try again.')
        }
        return
      }

      if (data.accessToken) {
        login(data.accessToken)
      }

      let role = 'learner'
      try {
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]))
        role = payload.role || 'learner'
      } catch {
        role = 'learner'
      }

      const from = location.state?.from
      if (from) {
        navigate(from)
      } else if (role === 'instructor' || role === 'admin') {
        navigate('/dashboard/instructor')
      } else {
        navigate('/courses')
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function clearFieldError(field) {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="flex min-h-[calc(100vh-64px)]">
        <div className="hidden lg:flex lg:w-1/2 bg-coral relative overflow-hidden items-center justify-center p-12 border-r-2 border-black">
          <div className="absolute top-10 right-10 w-24 h-24 bg-sunshine border-2 border-black rounded-lg rotate-12 shadow-brutal-sm" />
          <div className="absolute bottom-10 left-10 w-20 h-20 bg-ocean border-2 border-black rounded-full shadow-brutal-sm" />
          <div className="absolute top-1/4 left-12 w-14 h-14 bg-mint border-2 border-black rounded-full" />
          <div className="absolute bottom-1/3 right-16 w-10 h-10 bg-lavender border-2 border-black rounded-lg -rotate-12" />

          <div className="relative z-10 max-w-md text-center">
            <div className="w-20 h-20 bg-white border-2 border-black rounded-2xl shadow-brutal flex items-center justify-center mx-auto mb-8 p-1.5">
              <BrandLogo className="w-full h-full rounded-xl object-cover" />
            </div>
            <h2 className="font-heading font-bold text-3xl text-white mb-4">
              Welcome Back!
            </h2>
            <p className="text-white/90 text-lg mb-10 leading-relaxed">
              Continue your learning journey right where you left off. Your courses and progress are
              waiting for you.
            </p>

            <div className="bg-white border-2 border-black shadow-brutal rounded-xl p-6 text-left">
              <p className="font-heading font-bold text-sm mb-4">What&apos;s waiting for you:</p>
              <ul className="space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-sunshine border-2 border-black rounded-lg flex items-center justify-center shrink-0 shadow-brutal-sm">
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{feature.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 bg-white border-2 border-black rounded-xl shadow-brutal-sm flex items-center justify-center mx-auto mb-4 p-1">
                <BrandLogo className="w-full h-full rounded-lg object-cover" />
              </div>
              <h1 className="font-heading font-bold text-2xl">Welcome Back</h1>
              <p className="text-gray-500 text-sm mt-1">Log in to continue learning</p>
            </div>

            <div className="bg-white border-2 border-black shadow-brutal-lg rounded-2xl p-6 sm:p-8">
              <div className="mb-6 hidden lg:block">
                <h2 className="font-heading font-bold text-2xl mb-1">Log in to your account</h2>
                <p className="text-gray-500 text-sm">Enter your credentials to continue</p>
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
                    Email Address <span className="text-coral">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearFieldError('email')
                    }}
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-heading font-bold text-sm">
                      Password <span className="text-coral">*</span>
                    </label>
                    <span className="text-xs text-gray-400 cursor-default">Forgot password?</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        clearFieldError('password')
                      }}
                      placeholder="Enter your password"
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
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-heading font-bold py-3.5 bg-coral text-white border-2 border-black rounded-xl shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-brutal disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Log In <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 font-medium">
                    New to Penta Academy?
                  </span>
                </div>
              </div>

              <Link
                to="/auth/register"
                className="w-full font-heading font-bold py-3 bg-white text-charcoal border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center gap-2"
              >
                Create an Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              By logging in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
