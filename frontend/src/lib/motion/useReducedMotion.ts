import { useEffect, useState } from 'react'
import { useReducedMotion as useMotionReducedMotion } from 'motion/react'

/**
 * Hook to detect whether the user has requested reduced motion.
 * Respects OS preferences and provides a reactive boolean.
 */
export const useReducedMotion = (): boolean => {
  const motionPrefers = useMotionReducedMotion()
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return Boolean(motionPrefers ?? prefersReduced)
}
