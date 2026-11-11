import React, { createContext, useContext, useEffect, useRef } from 'react'
import Lenis from 'lenis'

interface SmoothScrollContextType {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, options?: Record<string, any>) => void
  start: () => void
  stop: () => void
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
  start: () => {},
  stop: () => {},
})

export const useSmoothScroll = () => useContext(SmoothScrollContext)

interface SmoothScrollProviderProps {
  children: React.ReactNode
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Check if reduced motion is requested by user
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      return
    }

    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      allowNestedScroll: true,
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      prevent: (node) => {
        if (!node || !(node instanceof HTMLElement)) return false
        // Allow native scrolling on any container marked with data-lenis-prevent or having scrollable overflow
        if (
          node.hasAttribute('data-lenis-prevent') ||
          node.closest?.('[data-lenis-prevent]') ||
          node.closest?.('[data-radix-scroll-area-viewport]') ||
          node.closest?.('#main-content')
        ) {
          return true
        }
        return false
      },
    })

    lenisRef.current = lenis

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  const scrollTo = (target: string | number | HTMLElement, options?: Record<string, any>) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options)
    } else if (typeof target === 'string') {
      const el = document.querySelector(target)
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const start = () => {
    lenisRef.current?.start()
    document.documentElement.classList.add('lenis')
  }

  const stop = () => {
    lenisRef.current?.stop()
    document.documentElement.classList.remove('lenis')
  }

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisRef.current, scrollTo, start, stop }}>
      {children}
    </SmoothScrollContext.Provider>
  )
}
