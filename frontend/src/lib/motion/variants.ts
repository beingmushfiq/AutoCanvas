import type { Variants } from 'motion/react'
import { DURATION, EASING, SPRINGS, MOTION_ENABLED } from './tokens'

/**
 * Reusable Motion Variants for AutoCanvas
 * Studio / Editorial Kinetic Style
 */

// Route & Tab Page Transitions
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: MOTION_ENABLED ? 8 : 0,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.studio,
    },
  },
  exit: {
    opacity: 0,
    y: MOTION_ENABLED ? -6 : 0,
    transition: {
      duration: DURATION.fast * 0.75,
      ease: EASING.easeIn,
    },
  },
}

// Modal Backdrop Overlay
export const modalBackdropVariants: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: {
      duration: DURATION.normal,
      ease: EASING.studio,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    },
  },
}

// Modal Dialog Card (Scale & Slide Pop)
export const modalCardVariants: Variants = {
  initial: {
    opacity: 0,
    scale: MOTION_ENABLED ? 0.96 : 1,
    y: MOTION_ENABLED ? 12 : 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRINGS.modal,
  },
  exit: {
    opacity: 0,
    scale: MOTION_ENABLED ? 0.96 : 1,
    y: MOTION_ENABLED ? 8 : 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    },
  },
}

// Mobile Navigation Drawer (Left Slide)
export const drawerLeftVariants: Variants = {
  initial: {
    x: '-100%',
  },
  animate: {
    x: 0,
    transition: SPRINGS.snappy,
  },
  exit: {
    x: '-100%',
    transition: {
      duration: DURATION.fast,
      ease: EASING.studio,
    },
  },
}

// Command Palette (⌘K) Dialog
export const commandPaletteVariants: Variants = {
  initial: {
    opacity: 0,
    scale: MOTION_ENABLED ? 0.97 : 1,
    y: MOTION_ENABLED ? -14 : 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRINGS.modal,
  },
  exit: {
    opacity: 0,
    scale: MOTION_ENABLED ? 0.97 : 1,
    y: MOTION_ENABLED ? -10 : 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    },
  },
}

// Staggered Container for Lists and Grids
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
}

// Staggered Child Item
export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: MOTION_ENABLED ? 10 : 0,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.studio,
    },
  },
}

// Micro-interaction helpers
export const tapFeedback = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 },
}

export const cardHover = {
  whileHover: {
    y: -2,
    transition: { duration: 0.2, ease: EASING.studio },
  },
}
