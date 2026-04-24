import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Home', href: '/', icon: AcademicCapIcon },
    { name: 'Labs', href: '/labs', icon: BookOpenIcon },
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  ]

  const isActiveLink = (href) => {
    return location.pathname === href
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-dark-surface/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              MatLabx
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveLink(link.href)
                      ? 'text-primary-400 bg-primary-500/10'
                      : 'text-dark-muted hover:text-primary-400 hover:bg-primary-500/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden lg:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search labs..."
                  className="w-64 bg-dark-surface border border-dark-border rounded-lg pl-10 pr-4 py-2 text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted" />
              </div>
            </div>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-card transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-dark-text">
                    {user?.username || 'User'}
                  </span>
                </button>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-dark-card transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <UserIcon className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-dark-text hover:bg-dark-card transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ChartBarIcon className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      <hr className="border-dark-border" />
                      <button
                        onClick={() => {
                          logout()
                          setIsMenuOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-error-400 hover:bg-dark-card transition-colors duration-200"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="btn-primary text-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-dark-card transition-colors duration-200"
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-6 h-0.5 bg-dark-text"></div>
              <div className="w-6 h-0.5 bg-dark-text"></div>
              <div className="w-6 h-0.5 bg-dark-text"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-surface border-t border-dark-border">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveLink(link.href)
                      ? 'text-primary-400 bg-primary-500/10'
                      : 'text-dark-muted hover:text-primary-400 hover:bg-primary-500/5'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
