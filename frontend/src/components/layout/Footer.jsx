import React from 'react'
import { 
  AcademicCapIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { name: 'About', href: '/about', icon: AcademicCapIcon },
    { name: 'Documentation', href: '/docs', icon: BookOpenIcon },
    { name: 'Support', href: '/support', icon: ChatBubbleLeftRightIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

  return (
    <footer className="bg-dark-surface border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-400">MatLabx</h3>
                <p className="text-sm text-dark-muted mt-1">
                  Intelligent Network Simulation Platform
                </p>
              </div>
            </div>
            <p className="text-sm text-dark-muted">
              Empowering the next generation of network engineers through hands-on learning and real-world simulation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-dark-text mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="flex items-center space-x-2 text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-dark-text mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/tutorials"
                  className="text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
                >
                  Video Tutorials
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
                >
                  Blog & Articles
                </a>
              </li>
              <li>
                <a
                  href="/community"
                  className="text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
                >
                  Community Forum
                </a>
              </li>
              <li>
                <a
                  href="/certification"
                  className="text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
                >
                  Certification Prep
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-dark-text mb-4">Stay Updated</h4>
            <p className="text-sm text-dark-muted mb-4">
              Get the latest updates and new lab releases delivered to your inbox.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full btn-primary text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-dark-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-dark-muted">
              © {currentYear} MatLabx. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a
                href="/privacy"
                className="text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="/contact"
                className="text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
