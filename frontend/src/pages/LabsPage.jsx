import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  ComputerDesktopIcon,
  ServerStackIcon,
  ExclamationTriangleIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

const LabsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('popular')

  const categories = ['all', 'routing', 'switching', 'security', 'troubleshooting', 'network-design', 'wireless']
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced']
  const sortOptions = ['popular', 'newest', 'highest-rated', 'duration']

  // Remove API call since we display labs directly in the component
  const [labs, setLabs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-success-400 bg-success-100/20'
      case 'intermediate': return 'text-warning-400 bg-warning-100/20'
      case 'advanced': return 'text-error-400 bg-error-100/20'
      default: return 'text-dark-muted bg-dark-card'
    }
  }

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'badge-success'
      case 'intermediate': return 'badge-warning'
      case 'advanced': return 'badge-error'
      default: return ''
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-error-400 text-xl mb-4">Error loading labs</div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <h1 className="text-3xl font-bold text-dark-text">
              Network Labs
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search labs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted" />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none bg-dark-card border border-dark-border rounded-lg px-4 py-2 pr-8 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted pointer-events-none" />
                </div>

                {/* Difficulty Filter */}
                <div className="relative">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="appearance-none bg-dark-card border border-dark-border rounded-lg px-4 py-2 pr-8 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </option>
                    ))}
                  </select>
                  <AdjustmentsHorizontalIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted pointer-events-none" />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-dark-card border border-dark-border rounded-lg px-4 py-2 pr-8 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest First</option>
                    <option value="highest-rated">Highest Rated</option>
                    <option value="duration">Shortest Duration</option>
                  </select>
                  <BookOpenIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 1 Terminal Test */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 border border-primary-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <ComputerDesktopIcon className="w-8 h-8 text-primary-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Phase 1 Terminal Test</h2>
                <p className="text-primary-200">Test Docker connection and real FRRouting container terminal</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/terminal-test'}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors duration-200 flex items-center space-x-2"
            >
              <ServerStackIcon className="w-5 h-5" />
              <span>Test Connection</span>
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ServerStackIcon className="w-5 h-5 text-primary-300" />
                <span className="text-white font-semibold">Docker Connection</span>
              </div>
              <p className="text-primary-200 text-sm">Test connectivity to Docker containers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ComputerDesktopIcon className="w-5 h-5 text-primary-300" />
                <span className="text-white font-semibold">Real Terminal</span>
              </div>
              <p className="text-primary-200 text-sm">Execute commands in FRRouting containers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-primary-300" />
                <span className="text-white font-semibold">Network Commands</span>
              </div>
              <p className="text-primary-200 text-sm">Test ping, ip addr, vtysh commands</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpenIcon className="w-5 h-5 text-primary-300" />
                <span className="text-white font-semibold">Phase 2 Labs</span>
              </div>
              <p className="text-primary-200 text-sm">Multi-device network simulations</p>
              <button 
                onClick={() => window.location.href = '/phase2-labs'}
                className="mt-2 w-full bg-primary-500 hover:bg-primary-600 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                Try Phase 2
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ServerStackIcon className="w-5 h-5 text-primary-300" />
                <span className="text-white font-semibold">Phase 3 Labs</span>
              </div>
              <p className="text-primary-200 text-sm">Intelligent labs with automatic validation</p>
              <button 
                onClick={() => window.location.href = '/phase3-labs'}
                className="mt-2 w-full bg-primary-500 hover:bg-primary-600 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                Try Phase 3
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-dark-text"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-dark-text"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-dark-text"
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Labs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {labs?.length > 0 ? (
          <>
            {/* Results count */}
            <div className="mb-6 text-dark-muted">
              Found {labs.length} labs matching your criteria
            </div>

            {/* Labs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab) => (
                <div key={lab.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:scale-105">
                  {/* Lab Header */}
                  <div className="p-6 border-b border-dark-border">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDifficultyBadge(lab.difficulty)}`}>
                        {lab.difficulty.charAt(0).toUpperCase() + lab.difficulty.slice(1)}
                      </span>
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 text-warning-400 mr-1" />
                        <span className="text-sm text-warning-400 font-medium">{lab.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-dark-text mb-2 line-clamp-1">
                      {lab.title}
                    </h3>

                    <p className="text-dark-muted text-sm line-clamp-2 mb-4">
                      {lab.description}
                    </p>

                    <div className="lab-details">
                      <div className="detail-item">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span>{lab.duration} minutes</span>
                      </div>
                      <div className="detail-item">
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        <span>{lab.deviceCount || 3} devices</span>
                      </div>
                      <div className="detail-item">
                        <StarIcon className="w-4 h-4 mr-2" />
                        <span className="text-sm text-warning-400 font-medium">{lab.rating}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {lab.tags?.slice(0, 3).map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full border border-primary-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Objectives Preview */}
                    <div className="lab-objectives-preview">
                      <h4>Learning Objectives:</h4>
                      <ul>
                        {lab.objectives.slice(0, 3).map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                        {lab.objectives.length > 3 && (
                          <li className="more">+{lab.objectives.length - 3} more...</li>
                        )}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="lab-actions">
                      <button className="btn btn-primary">
                        <PlayIcon className="w-4 h-4" />
                        Start Lab
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center">
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-hover transition-colors duration-200">
                  Previous
                </button>
                <span className="text-dark-muted">
                  Page 1 of 5
                </span>
                <button className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-hover transition-colors duration-200">
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpenIcon className="w-16 h-16 text-dark-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark-text mb-2">
              No labs found
            </h3>
            <p className="text-dark-muted mb-6">
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSelectedDifficulty('all')
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}
        </div>
      </div>
    </>
  )
}

export default LabsPage
