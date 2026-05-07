import React, { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, DocumentIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const CreateCurriculumPage = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [results, setResults] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(file => 
      file.type.includes('document') || 
      file.type.includes('pdf') || 
      file.type.includes('word') || 
      file.type.includes('text') || 
      file.type.includes('presentation') ||
      file.name.match(/\.(doc|docx|pdf|txt|ppt|pptx)$/i)
    )

    if (validFiles.length === 0) {
      toast.error('Please select valid document files (PDF, Word, PowerPoint, Text)')
      return
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    toast.success(`Added ${validFiles.length} document(s)`)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = (e) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one document')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const token = getToken()
      const allResults = {
        successful: [],
        failed: [],
        total: selectedFiles.length
      }

      // Upload all files in one request
      const formData = new FormData()
      formData.append('type', 'curriculum')
      formData.append('category', 'comprehensive')
      
      // Add all files with 'files' field name
      selectedFiles.forEach((file, index) => {
        formData.append('files', file)
      })

      console.log("🔥 Sending curriculum upload request...")
      console.log(`Token exists:`, !!token)
      console.log(`Total files in FormData:`, selectedFiles.length)

      const response = await fetch("http://localhost:5001/api/upload/bulk", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      console.log("🔥 Response received:", response.status)

      const data = await response.json()
      console.log("🔥 Response data:", data)

      if (!response.ok) {
        throw new Error(data.message || "Upload failed")
      }

      console.log(`Curriculum upload success:`, data)
      
      // Convert bulk result to expected format
      const bulkData = data.data || { successful: [], failed: [], total: 0 }
      
      bulkData.successful.forEach(file => {
        allResults.successful.push({
          success: true,
          title: file.originalName,
          id: file.filename
        })
      })
      
      bulkData.failed.forEach(file => {
        allResults.failed.push({
          success: false,
          title: file.originalName,
          error: file.error
        })
      })
      
      // Update UI state
      setResults(allResults)
      setSelectedFiles([])
      
      // Invalidate curriculum query to refresh the list
      queryClient.invalidateQueries(['curriculum'])
      
      if (allResults.failed.length === 0) {
        toast.success(`Successfully uploaded ${allResults.successful.length} curriculum documents!`)
      } else {
        toast.error(`Upload completed: ${allResults.successful.length} successful, ${allResults.failed.length} failed`)
      }
      
      return allResults
    } catch (error) {
      console.error("❌ Upload failed:", error)
      toast.error("Upload failed: " + error.message)
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-dark-muted hover:text-dark-text transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-dark-text">Add Curriculum Documents</h1>
              <p className="text-dark-muted">Upload comprehensive curriculum materials for students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Area */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-border hover:border-primary-500/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CloudArrowUpIcon className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-text mb-2">
                Drop curriculum documents here
              </h3>
              <p className="text-dark-muted mb-4">
                Supports PDF, Word, PowerPoint, and text files
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="curriculum-file-input"
              />
              <label
                htmlFor="curriculum-file-input"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
              >
                <DocumentIcon className="w-4 h-4 mr-2" />
                Browse Files
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">
                Selected Documents ({selectedFiles.length})
              </h3>
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-card border border-dark-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="w-5 h-5 text-primary-400" />
                      <div>
                        <p className="text-sm font-medium text-dark-text">{file.name}</p>
                        <p className="text-xs text-dark-muted">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-error-400 hover:text-error-300 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Uploading...</h3>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-dark-muted mt-2">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Upload Results</h3>
              <div className="space-y-3">
                {results.successful.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-success-500/10 border border-success-500/30 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-success-400 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-dark-text">{result.title}</p>
                      <p className="text-xs text-success-400">Uploaded successfully</p>
                    </div>
                  </div>
                ))}
                {results.failed.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-error-500/10 border border-error-500/30 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-error-400 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-dark-text">{result.title}</p>
                      <p className="text-xs text-error-400">{result.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Document${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCurriculumPage
