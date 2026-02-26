import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Menu, X } from 'lucide-react'

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-coral border-2 border-black rounded-lg shadow-brutal-sm flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">BrightLearn</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="font-heading font-medium hover:text-coral transition-colors">
              Home
            </Link>
            <Link to="/courses" className="font-heading font-medium hover:text-coral transition-colors">
              Courses
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
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
            <Link
              to="/"
              className="font-heading font-medium py-2"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/courses"
              className="font-heading font-medium py-2"
              onClick={() => setMobileOpen(false)}
            >
              Courses
            </Link>
            <hr className="border-black" />
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
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
