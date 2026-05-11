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
  CheckCircleIcon,
  PlayIcon,
  StopIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import Phase3LabInterface from '../components/Phase3LabInterface'
import '../styles/Phase3Labs.css'

const Phase3LabsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [selectedLab, setSelectedLab] = useState(null)

  const categories = ['all', 'routing', 'switching', 'security', 'troubleshooting', 'network-design', 'wireless']
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced']
  const sortOptions = ['popular', 'newest', 'highest-rated', 'duration']

  const { data: labs, isLoading, error } = useQuery(
    ['phase3-labs', searchTerm, selectedCategory, selectedDifficulty, sortBy],
    async () => {
      const response = await fetch('/api/phase3-labs/labs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      return response.json()
    },
    {
      keepPreviousData: true,
    }
  )

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-100/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-100/20'
      case 'advanced': return 'text-red-400 bg-red-100/20'
      default: return 'text-gray-400 bg-gray-100/20'
    }
  }

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'badge-success'
      case 'intermediate': return 'badge-warning'
      case 'advanced': return 'badge-error'
      default: return 'badge-gray'
    }
  }

  const filteredLabs = labs?.data?.filter(lab => {
    const matchesSearch = lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      lab.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || lab.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || lab.difficulty === selectedDifficulty
    return matchesSearch && matchesCategory && matchesDifficulty
  }) || []

  const sortedLabs = filteredLabs.sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt)
      case 'highest-rated': return b.rating - a.rating
      case 'duration': return a.duration - b.duration
      default: return b.popularity - a.popularity
    }
  })

  if (selectedLab) {
    return <Phase3LabInterface 
      labId={selectedLab.id} 
      labConfig={selectedLab} 
      onBack={() => setSelectedLab(null)} 
    />
  }

  return (
    <div className="phase3-labs">
      {/* Hero Section */}
      <div className="labs-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="hero-title">
              <ServerStackIcon className="w-16 h-16" />
              Phase 3 - Intelligent Labs
            </h1>
            <p className="hero-description">
              Advanced labs with automatic validation and real-time monitoring
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">3</span>
                <span className="stat-label">Available Labs</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">3</span>
                <span className="stat-label">Lab Types</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">∞</span>
                <span className="stat-label">Scalable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="search-bar">
              <MagnifyingGlassIcon className="w-5 h-5" />
              <input
                type="text"
                placeholder="Search intelligent labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filters */}
            <div className="filter-controls">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
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
                className="filter-select"
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
                className="filter-select"
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
      </div>

      {/* Labs Grid */}
      <div className="labs-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading intelligent labs...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <ExclamationTriangleIcon className="w-12 h-12" />
              <p>Failed to load labs. Please try again.</p>
            </div>
          ) : sortedLabs.length === 0 ? (
            <div className="no-results">
              <FunnelIcon className="w-12 h-12" />
              <h3>No labs found</h3>
              <p>Try adjusting your filters or search terms to find what you're looking for.</p>
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSelectedDifficulty('all')
                }}
                className="btn btn-primary"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="labs-container">
              {sortedLabs.map((lab) => (
                <div key={lab.id} className="lab-card" onClick={() => setSelectedLab(lab)}>
                  <div className="lab-header">
                    <div className="lab-title">
                      <h3>{lab.title}</h3>
                      <div className="lab-meta">
                        <span className={`difficulty ${getDifficultyBadge(lab.difficulty)}`}>
                          {lab.difficulty.charAt(0).toUpperCase() + lab.difficulty.slice(1)}
                        </span>
                        <span className="category">{lab.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lab-content">
                    <p className="lab-description">{lab.description}</p>
                    
                    <div className="lab-details">
                      <div className="detail-item">
                        <ClockIcon className="w-4 h-4" />
                        <span>{lab.duration} minutes</span>
                      </div>
                      <div className="detail-item">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{lab.maxScore} points</span>
                      </div>
                      <div className="detail-item">
                        <StarIcon className="w-4 h-4" />
                        <span>{lab.difficulty}</span>
                      </div>
                    </div>

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
                  </div>

                  <div className="lab-actions">
                    <button className="btn btn-primary">
                      <PlayIcon className="w-4 h-4" />
                      Start Lab
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Phase3LabsPage
