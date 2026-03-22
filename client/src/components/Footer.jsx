import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

function Footer() {
  return (
    <footer className="bg-charcoal text-white border-t-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BrandLogo className="w-10 h-10 rounded-lg border-2 border-white/30 shadow-brutal-sm" />
              <span className="font-heading font-bold text-xl">Penta Academy</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering learners and instructors worldwide with accessible, AI-enhanced education.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            <Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              About us
            </Link>
            <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Contact
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Penta Academy.{' '}
            <a
              href="https://www.mddanish.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
            >
              Developed by Md Danish Ansari
            </a>
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
