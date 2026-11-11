import React, { useState, useRef } from 'react'
import { apiClient } from '../../../lib/api/client'
import { appToast } from '../../../lib/toast'
import {
  Upload,
  Image as ImageIcon,
  Link,
  X,
  Loader2,
} from 'lucide-react'

interface BrandAssetUploaderProps {
  label: string
  description?: string
  value: string
  onChange: (url: string) => void
  assetType?: 'primary_logo' | 'dark_logo' | 'favicon' | 'general'
  accept?: string
  previewAspect?: 'square' | 'wide'
}

export const BrandAssetUploader: React.FC<BrandAssetUploaderProps> = ({
  label,
  description,
  value,
  onChange,
  assetType = 'general',
  accept = '.svg,.png,.jpg,.jpeg,.webp,.ico',
  previewAspect = 'wide',
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showManualInput, setShowManualInput] = useState(!value || value.startsWith('http'))
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileUpload = async (file: File) => {
    // Validation
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      appToast.error('File exceeds maximum upload size (10MB).')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('asset_type', assetType)

      const response = await apiClient.post<{
        success: boolean
        data: {
          url: string
          filename: string
          mime: string
          size: number
        }
      }>('/control-plane/cms/assets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const newUrl = response.data.url
      onChange(newUrl)
      appToast.success(`${label} uploaded and validated successfully.`)
    } catch (err) {
      console.error('Asset upload error:', err)
      appToast.error((err as Error).message || 'Failed to upload asset.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const isSvg = value?.toLowerCase().endsWith('.svg')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-foreground-secondary">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-[11px] font-mono text-brand-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <Link className="w-3 h-3" />
          <span>{showManualInput ? 'Hide URL field' : 'Edit URL directly'}</span>
        </button>
      </div>

      {description && (
        <p className="text-[11px] text-foreground-muted">{description}</p>
      )}

      {/* Upload & Preview Card */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border border-dashed transition-all p-3 flex flex-col sm:flex-row items-center gap-4 ${
          isDragOver
            ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20'
            : 'border-border bg-background hover:border-brand-accent/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0])
            }
          }}
        />

        {/* Visual Preview Box with Transparency Checkerboard */}
        <div
          className={`shrink-0 rounded-lg border border-border flex items-center justify-center p-2 relative overflow-hidden ${
            previewAspect === 'square' ? 'w-16 h-16' : 'w-28 h-16'
          }`}
          style={{
            backgroundImage: `radial-gradient(var(--border) 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
            backgroundColor: 'var(--surface)',
          }}
        >
          {value ? (
            <img
              src={value}
              alt={label}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // Graceful fallback for broken or local path preview
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-foreground-muted" />
          )}

          {isSvg && (
            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-background-subtle border border-border text-foreground-muted">
              SVG
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-brand-accent/60 text-foreground text-xs font-semibold shadow-2xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-accent" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Choose File</span>
                </>
              )}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-foreground-muted hover:text-status-danger text-xs transition-colors cursor-pointer"
                title="Clear Asset"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-foreground-muted mt-1.5 truncate">
            {isUploading
              ? 'Sanitizing XML and storing asset...'
              : value
              ? value
              : 'Drag and drop SVG or PNG file here, or click to browse.'}
          </div>
        </div>
      </div>

      {/* Optional Manual URL Input */}
      {showManualInput && (
        <div className="pt-1">
          <input
            type="text"
            placeholder="e.g. /brand/logo.svg or https://cdn.yoursite.com/logo.svg"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
          />
        </div>
      )}
    </div>
  )
}
