import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CreateLabModal = ({ show, onClose, onLabCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'routing',
    difficulty: 'beginner',
    duration: 60,
    tags: [],
    objectives: [],
    prerequisites: []
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ['routing', 'switching', 'security', 'troubleshooting', 'network-design', 'wireless']
  const difficulties = ['beginner', 'intermediate', 'advanced']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Lab created successfully!')
        onLabCreated(data.data)
        onClose()
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'routing',
          difficulty: 'beginner',
          duration: 60,
          tags: [],
          objectives: [],
          prerequisites: []
        })
      } else {
        toast.error(data.message || 'Failed to create lab')
      }
    } catch (error) {
      console.error('Create lab error:', error)
      toast.error('Failed to create lab')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  const handleObjectivesChange = (e) => {
    const objectives = e.target.value.split('\n').map(obj => obj.trim()).filter(obj => obj)
    setFormData(prev => ({
      ...prev,
      objectives
    }))
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-surface rounded-xl border border-dark-border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-dark-border">
          <h2 className="text-xl font-semibold text-dark-text">Create New Lab</h2>
          <button
            onClick={onClose}
            className="text-dark-muted hover:text-dark-text transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Lab Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter lab title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Describe what students will learn in this lab"
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Difficulty *
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              min="15"
              max="480"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Estimated completion time"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter tags separated by commas (e.g., routing, protocols, simulation)"
            />
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Learning Objectives
            </label>
            <textarea
              value={formData.objectives.join('\n')}
              onChange={handleObjectivesChange}
              rows={3}
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Enter learning objectives (one per line)"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateLabModal
