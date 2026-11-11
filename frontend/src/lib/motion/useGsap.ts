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

export interface UseGsapOptions {
  scope?: React.RefObject<Element | null> | Element | null
  dependencies?: React.DependencyList
}

/**
 * Robust GSAP React Hook with deterministic context cleanup,
 * Lenis smooth-scroll synchronization, and reduced-motion bypass.
 */
export const useGsap = <T extends HTMLElement = HTMLDivElement>(
  callback: (ctx: gsap.Context) => void,
  dependenciesOrOptions: React.DependencyList | UseGsapOptions = []
) => {
  const containerRef = useRef<T | null>(null)
  const { lenis } = useSmoothScroll()
  const prefersReducedMotion = useReducedMotion()

  const options: UseGsapOptions = Array.isArray(dependenciesOrOptions)
    ? { dependencies: dependenciesOrOptions }
    : (dependenciesOrOptions as UseGsapOptions)

  const dependencies = options.dependencies || []

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

    // Determine resolved DOM element scope safely (never pass a bare React ref object to GSAP)
    const resolvedScope =
      options.scope && 'current' in options.scope
        ? options.scope.current || undefined
        : options.scope instanceof Element
          ? options.scope
          : containerRef.current || undefined

    // Isolate all GSAP selectors and timelines within this context
    const ctx = gsap.context((self) => {
      if (prefersReducedMotion) {
        // If reduced motion is requested, reveal any opacity-0 elements immediately
        if (resolvedScope instanceof Element) {
          const hiddenElements = resolvedScope.querySelectorAll('.opacity-0')
          hiddenElements.forEach((el) => {
            ;(el as HTMLElement).style.opacity = '1'
            ;(el as HTMLElement).style.transform = 'none'
          })
        }
        const prevScale = gsap.globalTimeline.timeScale()
        gsap.globalTimeline.timeScale(100)
        try {
          callback(self)
        } finally {
          gsap.globalTimeline.timeScale(prevScale)
        }
      } else {
        callback(self)
      }
    }, resolvedScope)

    return () => {
      if (cleanupLenis) cleanupLenis()
      ctx.revert() // Reverts all inline styles and kills ScrollTriggers created in context
    }
  }, [lenis, prefersReducedMotion, ...dependencies])

  return containerRef
}

export { gsap, ScrollTrigger }

