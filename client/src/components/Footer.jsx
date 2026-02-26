import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-charcoal text-white border-t-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-coral border-2 border-white/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">BrightLearn</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering learners and instructors worldwide with accessible, AI-enhanced education.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/courses" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link to="/auth/register" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Become an Instructor
                </Link>
              </li>
              <li>
                <span className="text-gray-600 text-sm">Pricing (Coming Soon)</span>
              </li>
              <li>
                <span className="text-gray-600 text-sm">AI Quizzes</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              <li><span className="text-gray-400 text-sm">About Us</span></li>
              <li><span className="text-gray-400 text-sm">Contact</span></li>
              <li><span className="text-gray-400 text-sm">Careers</span></li>
              <li><span className="text-gray-400 text-sm">Blog</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              <li><span className="text-gray-400 text-sm">Terms of Service</span></li>
              <li><span className="text-gray-400 text-sm">Privacy Policy</span></li>
              <li><span className="text-gray-400 text-sm">Cookie Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 BrightLearn. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs">
            Built with passion for education
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
