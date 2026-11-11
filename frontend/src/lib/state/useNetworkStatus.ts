import { useState, useEffect } from 'react'
import { telemetry } from './telemetry'

export interface NetworkStatus {
  isOnline: boolean
  lastChangedAt: string | null
  wasOffline: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  })
  const [wasOffline, setWasOffline] = useState<boolean>(false)
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastChangedAt(new Date().toISOString())
      telemetry.addBreadcrumb({
        category: 'network',
        message: 'Network connectivity restored (online)',
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      setLastChangedAt(new Date().toISOString())
      telemetry.addBreadcrumb({
        category: 'network',
        message: 'Network connectivity lost (offline)',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastChangedAt, wasOffline }
}
