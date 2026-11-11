import { useLayoutEffect, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSmoothScroll } from '../scroll/SmoothScrollProvider'
import { useReducedMotion } from './useReducedMotion'

// Ensure GSAP plugins are registered safely once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// React 19 isomorphic effect hook
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Robust GSAP React Hook with deterministic context cleanup,
 * Lenis smooth-scroll synchronization, and reduced-motion bypass.
 */
export const useGsap = (
  callback: (ctx: gsap.Context) => void,
  dependencies: React.DependencyList = []
) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { lenis } = useSmoothScroll()
  const prefersReducedMotion = useReducedMotion()

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return

    // Synchronize Lenis with GSAP ScrollTrigger if active
    let cleanupLenis: (() => void) | undefined
    if (lenis) {
      const handleScroll = () => ScrollTrigger.update()
      lenis.on('scroll', handleScroll)
      cleanupLenis = () => {
        lenis.off('scroll', handleScroll)
      }
    }

    // Isolate all GSAP selectors and timelines within this context
    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        // If reduced motion is requested, run callback with instant durations
        gsap.globalTimeline.timeScale(100)
        callback(ctx)
        gsap.globalTimeline.timeScale(1)
      } else {
        callback(ctx)
      }
    }, containerRef)

    return () => {
      if (cleanupLenis) cleanupLenis()
      ctx.revert() // Reverts all inline styles and kills ScrollTriggers created in context
    }
  }, [lenis, prefersReducedMotion, ...dependencies])

  return containerRef
}

export { gsap, ScrollTrigger }
