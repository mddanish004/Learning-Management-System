import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import BrandLogo from './BrandLogo'

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isInstructorOrAdmin = user && (user.role === 'instructor' || user.role === 'admin')
  const isAdmin = user && user.role === 'admin'

  async function handleLogout() {
    await logout()
    setProfileOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <nav className="bg-white border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-cover" />
            <span className="font-heading font-bold text-xl">Penta Academy</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="font-heading font-medium hover:text-coral transition-colors">
              Home
            </Link>
            <Link to="/courses" className="font-heading font-medium hover:text-coral transition-colors">
              Courses
            </Link>
            {user && (
              <Link to="/my-learning" className="font-heading font-medium hover:text-coral transition-colors">
                My Learning
              </Link>
            )}
            {isInstructorOrAdmin && (
              <Link to="/dashboard/instructor" className="font-heading font-medium hover:text-coral transition-colors">
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/tools" className="font-heading font-medium hover:text-coral transition-colors">
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="font-heading font-bold px-4 py-2 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <div className="w-7 h-7 bg-ocean border-2 border-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.role === 'admin' ? 'A' : user.role === 'instructor' ? 'I' : 'L'}
                  </div>
                  <span className="capitalize text-sm">{user.role}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black rounded-xl shadow-brutal-sm z-50 overflow-hidden">
                      {isInstructorOrAdmin && (
                        <Link
                          to="/dashboard/instructor"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2.5 font-heading font-bold text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link
                        to="/my-learning"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2.5 font-heading font-bold text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        My Learning
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/tools"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2.5 font-heading font-bold text-sm hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          Admin Tools
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 font-heading font-bold text-sm text-coral hover:bg-coral/5 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="font-heading font-bold px-5 py-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/auth/register"
                  className="font-heading font-bold px-5 py-2 bg-coral text-white border-2 border-black rounded-lg shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t-2 border-black bg-white">
          <div className="px-4 py-4 flex flex-col gap-3">
            <Link to="/" className="font-heading font-medium py-2" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link to="/courses" className="font-heading font-medium py-2" onClick={() => setMobileOpen(false)}>
              Courses
            </Link>
            {user && (
              <Link to="/my-learning" className="font-heading font-medium py-2" onClick={() => setMobileOpen(false)}>
                My Learning
              </Link>
            )}
            {isInstructorOrAdmin && (
              <Link to="/dashboard/instructor" className="font-heading font-medium py-2" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/tools" className="font-heading font-medium py-2" onClick={() => setMobileOpen(false)}>
                Admin Tools
              </Link>
            )}
            <hr className="border-black" />
            {user ? (
              <button
                onClick={handleLogout}
                className="font-heading font-bold text-center px-5 py-2.5 bg-coral text-white border-2 border-black rounded-lg shadow-brutal-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="font-heading font-bold text-center px-5 py-2.5 border-2 border-black rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/auth/register"
                  className="font-heading font-bold text-center px-5 py-2.5 bg-coral text-white border-2 border-black rounded-lg shadow-brutal-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
