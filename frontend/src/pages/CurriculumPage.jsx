import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  MagnifyingGlassIcon,
  DocumentIcon,
  FunnelIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

const CurriculumPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewModal, setViewModal] = useState({ isOpen: false, content: '', title: '', loading: false })
  
  const categories = ['all', 'networking-fundamentals', 'routing', 'switching', 'security', 'troubleshooting', 'network-design', 'wireless']
  const levels = ['all', 'beginner', 'intermediate', 'advanced']
  const sortOptions = ['newest', 'oldest', 'title', 'difficulty']

  const { data: curriculum, isLoading, error } = useQuery(
    ['curriculum', searchTerm, selectedCategory, selectedLevel, sortBy],
    async () => {
      const response = await fetch(`http://localhost:5001/api/curriculum?search=${searchTerm}&category=${selectedCategory}&level=${selectedLevel}&sort=${sortBy}`)
      if (!response.ok) {
        throw new Error('Failed to fetch curriculum')
      }
      return response.json()
    },
    {
      keepPreviousData: true,
    }
  )

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'text-success-400 bg-success-100/20'
      case 'intermediate': return 'text-warning-400 bg-warning-100/20'
      case 'advanced': return 'text-error-400 bg-error-100/20'
      default: return 'text-dark-muted bg-dark-card'
    }
  }

  const getLevelBadge = (level) => {
    switch (level) {
      case 'beginner': return 'badge-success'
      case 'intermediate': return 'badge-warning'
      case 'advanced': return 'badge-error'
      default: return ''
    }
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase()
    switch (extension) {
      case 'pdf':
        return <span className="text-red-400">📄</span>
      case 'doc':
      case 'docx':
        return <span className="text-blue-400">📝</span>
      case 'ppt':
      case 'pptx':
        return <span className="text-orange-400">📊</span>
      case 'txt':
        return <span className="text-gray-400">📃</span>
      default:
        return <DocumentIcon className="w-5 h-5 text-primary-400" />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async (curriculumId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/curriculum/${curriculumId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'curriculum-document'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Download failed')
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleViewDocument = async (curriculumId) => {
    try {
      const curriculumItem = curriculum?.data?.find(item => item.id === curriculumId)
      if (!curriculumItem) return
      
      setViewModal({ isOpen: true, content: '', title: curriculumItem.title, loading: true })
      
      const response = await fetch(`http://localhost:5001/api/curriculum/${curriculumId}/view`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch document content')
      }
      
      const data = await response.json()
      
      if (data.success && data.data?.content) {
        setViewModal({ 
          isOpen: true, 
          content: data.data.content, 
          title: curriculumItem.title, 
          loading: false 
        })
      } else {
        setViewModal({ 
          isOpen: true, 
          content: 'No content available for this document.', 
          title: curriculumItem.title, 
          loading: false 
        })
      }
    } catch (error) {
      console.error('Failed to load document:', error)
      setViewModal({ 
        isOpen: true, 
        content: 'Failed to load document. Please try again.', 
        title: 'Error', 
        loading: false 
      })
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
          <div className="text-error-400 text-xl mb-4">Error loading curriculum</div>
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
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-dark-text">
                Comprehensive Curriculum
              </h1>
              <p className="text-dark-muted">From basic concepts to advanced enterprise networking</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search curriculum..."
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
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted pointer-events-none" />
                </div>

                {/* Level Filter */}
                <div className="relative">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="appearance-none bg-dark-card border border-dark-border rounded-lg px-4 py-2 pr-8 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
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
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title</option>
                    <option value="difficulty">Difficulty</option>
                  </select>
                  <BookOpenIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {curriculum?.data?.length > 0 ? (
          <>
            {/* Results count */}
            <div className="mb-6 text-dark-muted">
              Found {curriculum.data.length} curriculum documents matching your criteria
            </div>

            {/* Curriculum Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {curriculum.data.map((item) => (
                <div key={item.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:scale-105">
                  {/* Document Header */}
                  <div className="p-6 border-b border-dark-border">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getLevelBadge(item.level)}`}>
                        {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                      </span>
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 text-warning-400 mr-1" />
                        <span className="text-sm text-warning-400 font-medium">{item.rating || 4.5}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      {getFileIcon(item.fileName || item.title)}
                      <h3 className="text-lg font-semibold text-dark-text ml-3 line-clamp-1">
                        {item.title}
                      </h3>
                    </div>
                    
                    <p className="text-dark-muted text-sm line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  </div>

                  {/* Document Details */}
                  <div className="p-6 space-y-4">
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-dark-muted">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span>{item.estimatedDuration || 60} min</span>
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        <span>{item.enrolledCount || 0} enrolled</span>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center justify-between text-sm text-dark-muted">
                      <span>{formatFileSize(item.fileSize || 0)}</span>
                      <span className="text-xs px-2 py-1 bg-dark-card rounded">
                        {(item.fileName || item.title).split('.').pop().toUpperCase()}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags?.slice(0, 3).map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full border border-primary-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDownload(item.id)}
                        className="flex-1 btn-secondary text-center flex items-center gap-2"
                      >
                        <DocumentIcon className="w-4 h-4" />
                        Download
                      </button>
                      <button 
                        onClick={() => handleViewDocument(item.id)}
                        className="flex-1 btn-primary text-center flex items-center gap-2"
                      >
                        <BookOpenIcon className="w-4 h-4" />
                        View Document
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
              No curriculum documents found
            </h3>
            <p className="text-dark-muted mb-6">
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSelectedLevel('all')
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Document View Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5" />
                {viewModal.title}
              </h2>
              <button
                onClick={() => setViewModal({ isOpen: false, content: '', title: '', loading: false })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {viewModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">Loading document...</span>
                </div>
              ) : (
                <div 
                  className="document-content"
                  dangerouslySetInnerHTML={{ __html: viewModal.content }}
                />
              )}
            </div>
          </div>
        </div>
      )}

          </div>
      )
}

export default CurriculumPage
