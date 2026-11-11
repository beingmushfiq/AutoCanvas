import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { useNetworkStatus } from './useNetworkStatus'

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus()
  const [showRestored, setShowRestored] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestored(true)
      const timer = setTimeout(() => {
        setShowRestored(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  const handleManualCheck = () => {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
    }, 600)
  }

  if (isOnline && !showRestored) {
    return null
  }

  return (
    <aside
      aria-label="Network Status Announcement"
      className="sticky top-0 z-50 w-full transition-all duration-300 select-none animate-in fade-in"
    >
      {!isOnline ? (
        <div
          role="status"
          aria-live="assertive"
          className="flex items-center justify-between px-4 py-2 bg-status-warning-bg border-b border-border text-foreground text-xs font-medium shadow-sm"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent" />
            </span>
            <WifiOff className="w-3.5 h-3.5 text-brand-accent shrink-0" aria-hidden="true" />
            <span className="truncate">
              <strong className="font-semibold">Working Offline:</strong> Showing cached studio data. Content publishing will queue until reconnected.
            </span>
          </div>

          <button
            type="button"
            onClick={handleManualCheck}
            disabled={checking}
            aria-label="Retry connection check"
            className="ml-4 shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface text-[11px] font-semibold text-foreground hover:bg-surface-raised transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <RefreshCw className={`w-3 h-3 text-brand-accent ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{checking ? 'Checking...' : 'Check Connection'}</span>
          </button>
        </div>
      ) : showRestored ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 px-4 py-1.5 bg-status-success-bg border-b border-border text-foreground text-xs font-medium"
        >
          <Wifi className="w-3.5 h-3.5 text-status-success shrink-0" aria-hidden="true" />
          <span>Connection restored. Studio sync active.</span>
        </div>
      ) : null}
    </aside>
  )
}
