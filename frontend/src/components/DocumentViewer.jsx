import React, { useState, useEffect } from 'react'

const DocumentViewer = ({ content, title, fileName, onClose }) => {
  const [isPdf, setIsPdf] = useState(false)

  useEffect(() => {
    // Check if content contains PDF indicators or if filename is PDF
    const isPdfFile = fileName?.toLowerCase().includes('.pdf') || 
                       content?.includes('document type (.pdf)') ||
                       content?.includes('cannot be displayed inline')
    setIsPdf(isPdfFile)
  }, [content, fileName])

  const handleZoomIn = () => {
    const content = document.querySelector('#document-content')
    if (content) {
      const currentZoom = parseFloat(content.style.fontSize || '16')
      content.style.fontSize = Math.min(24, currentZoom + 2) + 'px'
    }
  }

  const handleZoomOut = () => {
    const content = document.querySelector('#document-content')
    if (content) {
      const currentZoom = parseFloat(content.style.fontSize || '16')
      content.style.fontSize = Math.max(12, currentZoom - 2) + 'px'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1200px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {title}
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {fileName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              Print
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '40px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#1f2937'
          }}>
            {/* Document Title */}
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '24px',
              textAlign: 'center',
              fontFamily: 'Georgia, serif'
            }}>
              {title}
            </h1>

            {/* Document Content */}
            {isPdf ? (
              // PDF Viewer using iframe
              <div style={{
                height: 'calc(100vh - 200px)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#6b7280',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  <p>This PDF document is being displayed below.</p>
                  <p>You can scroll, zoom, and navigate through the document.</p>
                </div>
                <iframe
                  src={`data:application/pdf;base64,${content}`}
                  style={{
                    flex: 1,
                    width: '100%',
                    height: '100%',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  title={title}
                />
              </div>
            ) : (
              // HTML Document Viewer
              <div 
                id="document-content"
                style={{
                  padding: '20px',
                  lineHeight: '1.6',
                  fontFamily: 'Georgia, serif',
                  fontSize: '16px',
                  color: '#1f2937'
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}

            {/* Document Footer */}
            <div style={{
              marginTop: '60px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              <p>Document generated from {fileName}</p>
              <p>Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Zoom:
            </span>
            <button
              onClick={() => {
                const content = document.querySelector('#document-content')
                if (content) {
                  const currentZoom = parseFloat(content.style.fontSize || '16')
                  content.style.fontSize = Math.max(12, currentZoom - 2) + 'px'
                }
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#e5e7eb',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              A-
            </button>
            <button
              onClick={() => {
                const content = document.querySelector('#document-content')
                if (content) {
                  const currentZoom = parseFloat(content.style.fontSize || '16')
                  content.style.fontSize = Math.min(24, currentZoom + 2) + 'px'
                }
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#e5e7eb',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              A+
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                const content = document.querySelector('#document-content')
                if (content) {
                  content.style.fontFamily = content.style.fontFamily === 'monospace' ? 'Georgia, serif' : 'monospace'
                }
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#e5e7eb',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Font
            </button>
            <button
              onClick={() => {
                window.getSelection().selectAllChildren(document.querySelector('#document-content'))
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#e5e7eb',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer
