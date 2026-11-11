/**
 * AutoCanvas Centralized Motion Tokens & Physics
 * Studio / Editorial Kinetic Design System
 */

export const MOTION_ENABLED = true

export const DURATION = {
  instant: 0.1,
  fast: 0.18,
  normal: 0.25,
  smooth: 0.4,
  slow: 0.6,
  cinematic: 0.85,
} as const

export const EASING = {
  // Editorial Kinetic Signature Ease (Snappy start, velvety deceleration)
  studio: [0.16, 1, 0.3, 1] as const,
  // Gentle entrance for content reveals
  easeOut: [0, 0, 0.2, 1] as const,
  // Symmetric ease for reversible interactions
  easeInOut: [0.4, 0, 0.2, 1] as const,
  // Anticipatory exit
  easeIn: [0.4, 0, 1, 1] as const,
} as const

export const SPRINGS = {
  // Snappy layout and drawer spring
  snappy: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
    mass: 0.9,
  },
  // Tactile modal and dialog pop
  modal: {
    type: 'spring' as const,
    stiffness: 320,
    damping: 28,
  },
  // Gentle hover and tab transitions
  gentle: {
    type: 'spring' as const,
    stiffness: 220,
    damping: 24,
  },
  // Bouncy micro-interaction feedback
  bouncy: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 18,
  },
} as const
