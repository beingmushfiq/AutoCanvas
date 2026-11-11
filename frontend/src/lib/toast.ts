import React from 'react'
import { toast } from 'sonner'
import type { ExternalToast } from 'sonner'
import { telemetry } from './state/telemetry'

export interface AppToastAction {
  label: string
  onClick: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

export interface AppToastOptions {
  description?: string
  action?: AppToastAction
  cancel?: AppToastAction
  duration?: number
  id?: string | number
}

const resolveAction = (act?: AppToastAction) => {
  if (!act) return undefined
  return {
    label: act.label,
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => act.onClick(e),
  }
}

/**
 * System-Wide Studio Toast Notification Utility
 * Provides typed, telemetry-integrated toast notifications matching AutoCanvas design tokens.
 */
export const appToast = {
  success: (message: string, options?: AppToastOptions) => {
    telemetry.addBreadcrumb({
      category: 'ui.action',
      message: `Toast success: ${message}`,
      data: options?.description ? { description: options.description } : undefined,
    })
    return toast.success(message, {
      description: options?.description,
      action: resolveAction(options?.action),
      cancel: resolveAction(options?.cancel),
      duration: options?.duration ?? 4000,
      id: options?.id,
    })
  },

  error: (message: string, options?: AppToastOptions) => {
    telemetry.captureException(new Error(message), {
      category: 'Toast Notification',
      description: options?.description,
    })
    return toast.error(message, {
      description: options?.description,
      action: resolveAction(options?.action),
      cancel: resolveAction(options?.cancel),
      duration: options?.duration ?? 6000,
      id: options?.id,
    })
  },

  warning: (message: string, options?: AppToastOptions) => {
    telemetry.addBreadcrumb({
      category: 'ui.action',
      message: `Toast warning: ${message}`,
      data: options?.description ? { description: options.description } : undefined,
    })
    return toast.warning(message, {
      description: options?.description,
      action: resolveAction(options?.action),
      cancel: resolveAction(options?.cancel),
      duration: options?.duration ?? 5000,
      id: options?.id,
    })
  },

  info: (message: string, options?: AppToastOptions) => {
    telemetry.addBreadcrumb({
      category: 'ui.action',
      message: `Toast info: ${message}`,
      data: options?.description ? { description: options.description } : undefined,
    })
    return toast.info(message, {
      description: options?.description,
      action: resolveAction(options?.action),
      cancel: resolveAction(options?.cancel),
      duration: options?.duration ?? 4000,
      id: options?.id,
    })
  },

  promise: toast.promise,
  dismiss: toast.dismiss,
  custom: toast.custom,
}

export { toast }
export type { ExternalToast }
