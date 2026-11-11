import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { telemetry } from './telemetry'

export interface ErrorStateProps {
  title?: string
  message?: string
  error?: Error | unknown
  errorCode?: string
  onRetry?: () => void
  onBack?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something unexpected occurred',
  message = 'We encountered an error loading this resource. Your data is safe, and we have recorded this incident.',
  error,
  errorCode = 'ERR_STUDIO_OP_FAILED',
  onRetry,
  onBack,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const errorString = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const stackString = error instanceof Error ? error.stack : ''

  const handleRetry = async () => {
    if (!onRetry || retrying) return
    setRetrying(true)
    telemetry.addBreadcrumb({
      category: 'ui.action',
      message: `User triggered retry on error card: ${errorCode}`,
    })
    try {
      await onRetry()
    } finally {
      setTimeout(() => setRetrying(false), 500)
    }
  }

  const handleCopy = () => {
    const payload = JSON.stringify(
      {
        code: errorCode,
        message: errorString,
        stack: stackString,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
    navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-status-danger/30 bg-surface shadow-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-status-danger-bg border border-status-danger/30 flex items-center justify-center text-status-danger mb-4 shadow-2xs">
        <AlertTriangle className="w-6 h-6 text-status-danger" aria-hidden="true" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-danger-bg border border-status-danger/20 text-status-danger text-[10px] font-mono font-semibold uppercase mb-2">
        <span>{errorCode}</span>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight max-w-md">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-foreground-secondary max-w-md mt-1.5 leading-relaxed">
        {message}
      </p>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-brand-accent ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{retrying ? 'Retrying...' : 'Retry Operation'}</span>
          </button>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-border bg-background-subtle text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Return to Dashboard
          </button>
        )}
      </div>

      {/* Technical Diagnostic Details Accordion */}
      {(errorString || stackString) && (
        <div className="mt-6 w-full max-w-lg text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono text-foreground-muted hover:text-foreground transition-colors rounded-lg hover:bg-background-subtle"
          >
            <span>Technical Diagnostic Data</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 rounded-xl border border-border bg-background-subtle font-mono text-[11px] text-foreground-secondary space-y-2">
              <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                <span className="text-[10px] text-foreground-muted">Details</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] hover:text-foreground text-foreground-muted"
                >
                  {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              {errorString && <div className="text-status-danger break-words">{errorString}</div>}
              {stackString && (
                <pre className="max-h-36 overflow-auto text-[10px] text-foreground-muted whitespace-pre-wrap">
                  {stackString}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

