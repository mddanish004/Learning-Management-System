import { Mail, Linkedin, Github } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function XLogo({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const LINKS = [
  {
    label: 'Email',
    href: 'mailto:m.danishansari400@gmail.com',
    display: 'm.danishansari400@gmail.com',
    icon: Mail,
    external: false,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mddanish004/',
    display: 'linkedin.com/in/mddanish004',
    icon: Linkedin,
    external: true,
  },
  {
    label: 'X',
    href: 'https://x.com/DanishonX',
    display: 'x.com/DanishonX',
    icon: XLogo,
    external: true,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/mddanish004',
    display: 'github.com/mddanish004',
    icon: Github,
    external: true,
  },
]

function ContactPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-8 md:mb-10">
          Contact the Developer:
        </h1>

        <ul className="space-y-4">
          {LINKS.map((item) => {
            const Icon = item.icon
            const linkProps = item.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {}
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  {...linkProps}
                  className="flex items-start sm:items-center gap-4 p-4 sm:p-5 bg-white border-2 border-black rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-200 group"
                >
                  <div className="w-12 h-12 shrink-0 bg-sunshine border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-sm">
                    <Icon className="w-6 h-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-heading font-bold text-sm text-gray-500 mb-0.5">{item.label}</p>
                    <p className="font-heading font-bold text-base sm:text-lg text-gray-900 break-all sm:break-normal group-hover:text-coral transition-colors">
                      {item.display}
                    </p>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </main>
      <Footer />
    </div>
  )
}

export default ContactPage
