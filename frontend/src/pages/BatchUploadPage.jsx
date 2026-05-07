import React, { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const BatchUploadPage = () => {
  const { user, getToken } = useAuth()
  const [uploadType, setUploadType] = useState('labs')
  console.log("🔥 BATCH UPLOAD COMPONENT LOADED")
  
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Check if user is admin or instructor
  const canUpload = user?.role === 'admin' || user?.role === 'instructor'

  const handleDrag = (e) => {
    console.log('🔥 DRAG EVENT:', e.type)
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    console.log('=== DRAG DROP DEBUG ===')
    console.log('1. Drop event triggered')
    console.log('2. e.dataTransfer.files:', e.dataTransfer.files)
    console.log('3. e.dataTransfer.files.length:', e.dataTransfer.files?.length)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      console.log('4. Files from drag and drop:', files)
      console.log('5. File details:', files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        lastModified: f.lastModified
      })))
      
      // CRITICAL TEST: Try to read one file to verify it's valid
      if (files.length > 0) {
        const testFile = files[0]
        console.log('6. Test file object:', testFile)
        console.log('7. Is File object?', testFile instanceof File)
        console.log('8. File constructor:', testFile.constructor.name)
      }
      
      handleFiles(files)
    } else {
      console.log('9. No files found in drop event')
      console.log('10. e.dataTransfer:', e.dataTransfer)
      toast.error('No files detected in drop')
    }
    console.log('=== END DRAG DROP DEBUG ===')
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files) => {
    console.log('=== HANDLE FILES DEBUG ===')
    console.log('1. Files received:', files)
    console.log('2. Files type:', typeof files)
    console.log('3. Files constructor:', files.constructor.name)
    
    // Filter out 0-byte files and ensure only real File objects
    const validFiles = Array.from(files).filter(file => {
      const isValid = file instanceof File && file.size > 0
      if (!isValid) {
        console.log(`❌ Invalid file: ${file.name} (size: ${file.size}, type: ${typeof file})`)
      }
      return isValid
    })
    
    console.log('4. ValidFiles after filtering:', validFiles)
    console.log('5. ValidFiles length:', validFiles.length)
    
    if (validFiles.length === 0) {
      console.log('6. No valid files found - all files were 0 bytes or invalid')
      toast.error('Please select valid files (non-empty files only)')
      return
    }

    console.log('7. File details being added:', validFiles.map(f => ({ 
      name: f.name, 
      type: f.type, 
      size: f.size,
      isFile: f instanceof File,
      constructor: f.constructor.name 
    })))
    
    console.log('8. Current selectedFiles before adding:', selectedFiles.length)
    setSelectedFiles(prev => {
      const newFiles = [...prev, ...validFiles]
      console.log('9. New selectedFiles count:', newFiles.length)
      return newFiles
    })
    
    console.log('10. About to show success toast')
    toast.success(`Added ${validFiles.length} file(s)`)
    console.log('=== END HANDLE FILES DEBUG ===')
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const processFiles = async () => {
    const uploadPromises = selectedFiles.map(async (file) => {
      try {
        // For JSON files, parse the content
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const text = await file.text()
          const jsonData = JSON.parse(text)
          
          return {
            name: file.name,
            data: jsonData,
            type: uploadType,
            contentType: 'json'
          }
        } else {
          // For non-JSON files, ensure we have a valid File object
          // Sometimes drag & drop creates different object types
          const fileObj = file instanceof File ? file : new File([file], file.name, {
            type: file.type || 'application/octet-stream'
          })
          
          return {
            name: file.name,
            data: fileObj,
            type: uploadType,
            contentType: 'file',
            size: file.size || fileObj.size,
            mimeType: file.type || fileObj.type
          }
        }
      } catch (error) {
        // For any errors, treat as file upload
        const fileObj = file instanceof File ? file : new File([file], file.name, {
          type: file.type || 'application/octet-stream'
        })
        
        return {
          name: file.name,
          data: fileObj,
          type: uploadType,
          contentType: 'file',
          size: file.size || fileObj.size,
          mimeType: file.type || fileObj.type
        }
      }
    })

    return Promise.all(uploadPromises)
  }

  const handleUpload = async () => {
    console.log("🔥 UPLOAD BUTTON CLICKED - selectedFiles:", selectedFiles.length)
    try {
      if (!canUpload) {
        toast.error('Only admin and instructor users can upload content')
        return
      }
      
      setIsUploading(true)
      const token = getToken()
      
      const allResults = {
        successful: [],
        failed: [],
        total: selectedFiles.length
      }

      // Use bulk upload for all files at once
      console.log(`Processing ${selectedFiles.length} files with bulk upload`)
      
      const formData = new FormData()
      formData.append('type', uploadType)
      formData.append('category', uploadType)
      
      // Add all files to FormData with 'files' field name
      selectedFiles.forEach((file, index) => {
        console.log(`Adding file ${index + 1}: ${file.name} (${file.size} bytes)`)
        formData.append('files', file)
      })
      
      console.log("🔥 Sending bulk upload request...");
      console.log(`Token exists:`, !!token)
      console.log(`Total files in FormData:`, selectedFiles.length)

      const response = await fetch("http://localhost:5001/api/upload/bulk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}` 
        },
        body: formData
      });

      console.log("🔥 Response received:", response.status);

      const data = await response.json();
      console.log("🔥 Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      console.log(`Bulk upload success:`, data)
      
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
      
      // Update UI state BEFORE returning
      setResults(allResults)
      setSelectedFiles([])
      
      if (allResults.failed.length === 0) {
        toast.success(`Successfully uploaded ${allResults.successful.length} files!`)
      } else {
        toast.error(`Upload completed: ${allResults.successful.length} successful, ${allResults.failed.length} failed`)
      }
      
      return allResults
    } catch (error) {
      console.error("❌ Upload failed:", error);
      toast.error("Upload failed: " + error.message);
      throw error;
    } finally {
      setIsUploading(false)
    }
  }

  const loadSampleData = () => {
    const sampleData = uploadType === 'curriculum' ? [
      {
        title: "Sample Curriculum",
        description: "A sample curriculum for testing",
        category: "networking-fundamentals",
        level: "beginner",
        estimatedDuration: 120,
        tags: ["sample", "test"],
        modules: [
          {
            id: "module-1",
            title: "Introduction",
            description: "Basic introduction",
            order: 1,
            content: "# Introduction\n\nThis is a sample module.",
            type: "text",
            duration: 30,
            objectives: ["Learn basics"],
            resources: [],
            isRequired: true
          }
        ]
      }
    ] : [
      {
        title: "Sample Lab",
        description: "A sample lab for testing",
        category: "routing",
        difficulty: "beginner",
        duration: 30,
        objectives: ["Configure basic routing"],
        prerequisites: [],
        topology: {
          type: "star",
          devices: [
            {
              id: "router1",
              name: "Router 1",
              type: "router",
              vendor: "cisco",
              interfaces: [
                {
                  name: "GigabitEthernet0/0",
                  ipAddress: "192.168.1.1",
                  subnetMask: "255.255.255.0",
                  status: "up"
                }
              ],
              configuration: ""
            }
          ],
          connections: []
        },
        tasks: [
          {
            id: "task1",
            title: "Configure Interface",
            description: "Configure router interface",
            type: "configuration",
            points: 20,
            commands: [
              {
                command: "show ip interface brief",
                expectedOutput: "192.168.1.1",
                validationType: "contains"
              }
            ],
            hints: [
              {
                level: 1,
                text: "Use interface configuration mode"
              }
            ]
          }
        ],
        faults: [],
        solution: {
          steps: [
            {
              step: 1,
              description: "Configure interface",
              commands: ["interface GigabitEthernet0/0", "ip address 192.168.1.1 255.255.255.0"],
              verification: "Interface configured"
            }
          ],
          explanation: "Basic interface configuration"
        },
        tags: ["sample", "basic"],
        isActive: true
      }
    ]

    // Create blob and file
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
    const file = new File([blob], `sample-${uploadType}.json`, { type: 'application/json' })
    setSelectedFiles([file])
    toast('Sample data loaded')
  }

  if (!canUpload) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-error-400 mb-4">Access Denied</h1>
            <p className="text-dark-muted">Only admin and instructor users can upload content.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Batch Upload Center</h1>
        
        {/* Upload Type Selection */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Content Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setUploadType('labs')}
              className={`p-6 rounded-lg border-2 transition-all ${
                uploadType === 'labs'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-border hover:border-primary-500/50'
              }`}
            >
              <div className="text-3xl mb-2">🔬</div>
              <h3 className="font-semibold mb-2">Labs</h3>
              <p className="text-sm text-dark-muted">Upload hands-on lab exercises that students can access from the Labs page</p>
            </button>
            
            <button
              onClick={() => setUploadType('curriculum')}
              className={`p-6 rounded-lg border-2 transition-all ${
                uploadType === 'curriculum'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-border hover:border-primary-500/50'
              }`}
            >
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold mb-2">Curriculum</h3>
              <p className="text-sm text-dark-muted">Upload learning materials and courses for the Curriculum section</p>
            </button>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upload Files</h2>
            <button
              onClick={loadSampleData}
              className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
            >
              Load Sample Data
            </button>
          </div>
          
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-500/5'
                : 'border-dark-border hover:border-primary-500/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium mb-2">
              Drag & Drop files here
            </p>
            <p className="text-sm text-dark-muted mb-4">
              Upload any file type - documents, images, videos, and more
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Browse Files
            </button>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-dark-bg p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-dark-muted">
                          {(file.size / 1024).toFixed(1)} KB • {uploadType}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-error-400 hover:text-error-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              console.log("🔥 STEP 1 BUTTON CLICKED");

              const fn = handleUpload;

              console.log("🔥 TYPE:", typeof fn);
              console.log("🔥 IS FUNCTION:", fn instanceof Function);

              if (!fn) {
                console.log("❌ handleUpload is NULL/UNDEFINED");
                return;
              }

              try {
                console.log("🔥 CALLING FUNCTION...");
                fn();
              } catch (err) {
                console.error("💥 FUNCTION CRASHED:", err);
              }
            }}
            disabled={isUploading || selectedFiles.length === 0}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              isUploading || selectedFiles.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-dark-bg p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary-400">{results.successful.length}</div>
                <div className="text-sm text-dark-muted">Successful</div>
              </div>
              <div className="bg-dark-bg p-4 rounded-lg">
                <div className="text-2xl font-bold text-error-400">{results.failed.length}</div>
                <div className="text-sm text-dark-muted">Failed</div>
              </div>
              <div className="bg-dark-bg p-4 rounded-lg">
                <div className="text-2xl font-bold text-dark-text">{results.total}</div>
                <div className="text-sm text-dark-muted">Total</div>
              </div>
            </div>

            {results.successful.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-success-400">✅ Successfully Uploaded</h3>
                <div className="space-y-2">
                  {results.successful.map((item, index) => (
                    <div key={index} className="bg-dark-bg p-3 rounded border border-success-500/20">
                      <span className="text-sm">#{item.index + 1} - {item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.failed.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-error-400">❌ Failed Uploads</h3>
                <div className="space-y-2">
                  {results.failed.map((item, index) => (
                    <div key={index} className="bg-dark-bg p-3 rounded border border-error-500/20">
                      <div className="text-sm text-error-400">#{item.index + 1} - {item.title}</div>
                      <div className="text-xs text-dark-muted mt-1">{item.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Format Guide */}
        <div className="mt-8 bg-dark-surface border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Format Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2 text-primary-400">Labs Format</h3>
              <pre className="bg-dark-bg p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "title": "Lab Title",
    "description": "Lab description",
    "category": "routing",
    "difficulty": "beginner",
    "duration": 30,
    "objectives": ["Objective 1"],
    "topology": {...},
    "tasks": [...],
    "tags": ["tag1"],
    "isActive": true
  }
]`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-primary-400">Curriculum Format</h3>
              <pre className="bg-dark-bg p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "title": "Curriculum Title",
    "description": "Description",
    "category": "networking-fundamentals",
    "level": "beginner",
    "estimatedDuration": 480,
    "tags": ["tag1"],
    "modules": [...]
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatchUploadPage
