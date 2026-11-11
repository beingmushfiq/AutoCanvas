import { useEffect } from 'react'

export function usePwaManifest(scope: 'landing' | 'app' | 'master'): void {
  useEffect(() => {
    // 1. Dynamic manifest switcher
    const manifestLink = document.getElementById('app-manifest-link') as HTMLLinkElement | null
    if (manifestLink) {
      let targetManifest = '/manifest-landing.json'
      if (scope === 'app') {
        targetManifest = '/manifest-app.json'
      } else if (scope === 'master') {
        targetManifest = '/manifest-master.json'
      }
      manifestLink.href = targetManifest
    }

    // 2. Register service worker in production/supported environments
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('AutoCanvas PWA service worker registration failed:', err)
      })
    }
  }, [scope])
}

