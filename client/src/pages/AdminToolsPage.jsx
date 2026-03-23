import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { apiUrl } from '../lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function AdminToolsPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null

  function validate() {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Name is required'
    else if (formData.name.trim().length > 255) errs.name = 'Name must be 255 characters or fewer'
    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    setSuccess('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    if (!token) {
      setServerError('You must be logged in as an admin.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/auth/register/admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          setServerError('Session expired. Please log in again.')
          return
        }
        if (res.status === 403) {
          setServerError('Access denied. Only admins can create admin accounts.')
          return
        }
        const errJson = await res.json().catch(() => ({}))
        if (errJson.errors && Array.isArray(errJson.errors)) {
          setServerError(errJson.errors.map((e) => e.message || e).join(', '))
        } else {
          setServerError(errJson.error || errJson.message || 'Failed to create admin account')
        }
        return
      }

      setSuccess(`Admin account for "${formData.name.trim()}" created successfully.`)
      setFormData({ name: '', email: '', password: '' })
      setErrors({})
    } catch (err) {
      setServerError(err.message || 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    if (serverError) setServerError('')
    if (success) setSuccess('')
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-ocean/15 border-2 border-ocean rounded-full flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-8 h-8 text-ocean" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Admin sign-in required</h2>
            <p className="text-gray-500 text-sm mb-6">You must be logged in with an admin account to access this page.</p>
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

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="bg-white border-b-2 border-black py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Link
            to="/"
            className="p-2 border-2 border-black rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-lg sm:text-xl truncate">Admin Tools</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Manage administrative accounts</p>
          </div>
        </div>
      </div>

      <section className="flex-1 flex items-start justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="bg-white border-2 border-black shadow-brutal rounded-2xl overflow-hidden">
            <div className="bg-charcoal px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-white text-lg">Create admin account</h2>
                <p className="text-gray-300 text-xs">New admin will have full platform access</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {serverError && (
                <div className="bg-coral/10 border-2 border-coral rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-coral mt-0.5 shrink-0" />
                  <span className="text-sm text-coral font-heading">{serverError}</span>
                </div>
              )}

              {success && (
                <div className="bg-mint/20 border-2 border-mint rounded-xl px-4 py-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
                  <span className="text-sm text-green-700 font-heading">{success}</span>
                </div>
              )}

              <div>
                <label htmlFor="admin-name" className="block font-heading font-bold text-sm mb-1.5">
                  Full name
                </label>
                <input
                  id="admin-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Jane Doe"
                  className={`w-full px-4 py-2.5 border-2 rounded-xl font-body text-sm outline-none transition-colors ${
                    errors.name ? 'border-coral bg-coral/5' : 'border-black focus:border-ocean'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-coral font-heading mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="admin-email" className="block font-heading font-bold text-sm mb-1.5">
                  Email address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="admin@example.com"
                  className={`w-full px-4 py-2.5 border-2 rounded-xl font-body text-sm outline-none transition-colors ${
                    errors.email ? 'border-coral bg-coral/5' : 'border-black focus:border-ocean'
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-coral font-heading mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="admin-password" className="block font-heading font-bold text-sm mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Strong password"
                    className={`w-full px-4 py-2.5 pr-12 border-2 rounded-xl font-body text-sm outline-none transition-colors ${
                      errors.password ? 'border-coral bg-coral/5' : 'border-black focus:border-ocean'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-coral font-heading mt-1">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full font-heading font-bold px-6 py-3 bg-ocean text-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create admin account</>
                )}
              </button>
            </form>
          </div>

          <div className="bg-sunshine/30 border-2 border-sunshine rounded-xl px-5 py-4">
            <h3 className="font-heading font-bold text-sm mb-1">Important</h3>
            <ul className="text-xs text-gray-700 space-y-1 font-body">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-sunshine shrink-0" />
                Admin accounts have full platform access including user management.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-sunshine shrink-0" />
                Only existing admins can create new admin accounts.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-sunshine shrink-0" />
                Share credentials securely with the new administrator.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default AdminToolsPage
