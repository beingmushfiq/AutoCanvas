import React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { HugeiconsIconProps } from '@hugeicons/react'

export type HugeIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

export interface HugeIconComponentProps extends Omit<HugeiconsIconProps, 'size'> {
  size?: HugeIconSize
}

/**
 * Standardized HugeIcon wrapper for AutoCanvas
 * Ensures consistent stroke weight, standardized sizing tokens, and accessible SVG attributes.
 */
export const HugeIcon: React.FC<HugeIconComponentProps> = ({
  icon,
  size = 'md',
  strokeWidth = 1.5,
  className = '',
  'aria-hidden': ariaHidden = true,
  ...props
}) => {
  const resolvedSize = typeof size === 'number' ? size : SIZE_MAP[size] ?? 20

  return (
    <HugeiconsIcon
      icon={icon}
      size={resolvedSize}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={ariaHidden}
      {...props}
    />
  )
}
