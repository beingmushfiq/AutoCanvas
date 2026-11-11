/**
 * AutoCanvas Telemetry & Error Tracking Ledger
 * Centralized client-side observability, breadcrumb recording, and exception capturing.
 * Designed to seamlessly interface with Sentry/OpenTelemetry or run standalone.
 */

export type TelemetrySeverity = 'error' | 'warn' | 'info' | 'debug'

export interface TelemetryBreadcrumb {
  timestamp: string
  category: 'ui.action' | 'navigation' | 'api' | 'network' | 'lifecycle'
  message: string
  data?: Record<string, unknown>
}

export interface TelemetryErrorEvent {
  id: string
  timestamp: string
  message: string
  name: string
  stack?: string
  severity: TelemetrySeverity
  context?: Record<string, unknown>
  breadcrumbs: TelemetryBreadcrumb[]
}

class TelemetryLedger {
  private breadcrumbs: TelemetryBreadcrumb[] = []
  private readonly maxBreadcrumbs = 25
  private readonly storageKey = 'autocanvas_telemetry_ledger'

  constructor() {
    this.addBreadcrumb({
      category: 'lifecycle',
      message: 'Telemetry ledger initialized',
    })
  }

  /**
   * Record a user action or lifecycle breadcrumb
   */
  public addBreadcrumb(crumb: Omit<TelemetryBreadcrumb, 'timestamp'>): void {
    const fullCrumb: TelemetryBreadcrumb = {
      ...crumb,
      timestamp: new Date().toISOString(),
    }
    this.breadcrumbs.push(fullCrumb)
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  /**
   * Capture an unhandled exception or caught operational error
   */
  public captureException(
    error: unknown,
    context?: Record<string, unknown>
  ): TelemetryErrorEvent {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    const eventId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // Sanitize context to prevent credential leakage
    const sanitizedContext = this.sanitizeContext(context)

    const event: TelemetryErrorEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      name: errorObj.name || 'Error',
      message: errorObj.message || 'Unknown runtime error',
      stack: errorObj.stack,
      severity: 'error',
      context: sanitizedContext,
      breadcrumbs: [...this.breadcrumbs],
    }

    // Persist to session buffer
    this.persistEvent(event)

    // Log structured diagnostic to console in development
    if (import.meta.env.DEV) {
      console.groupCollapsed(`[Telemetry] Captured ${event.name}: ${event.message}`)
      console.error(errorObj)
      console.log('Context:', sanitizedContext)
      console.log('Breadcrumbs:', event.breadcrumbs)
      console.groupEnd()
    }

    return event
  }

  /**
   * Track slow API requests (>2000ms) or connectivity issues
   */
  public trackPerformance(endpoint: string, durationMs: number): void {
    if (durationMs > 2000) {
      this.addBreadcrumb({
        category: 'api',
        message: `Slow API call: ${endpoint} took ${durationMs}ms`,
        data: { endpoint, durationMs },
      })
      if (import.meta.env.DEV) {
        console.warn(`[Telemetry API Warn] ${endpoint} took ${durationMs}ms`)
      }
    }
  }

  /**
   * Get all recorded errors from current session
   */
  public getStoredErrors(): TelemetryErrorEvent[] {
    try {
      const stored = sessionStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Clear error ledger
   */
  public clear(): void {
    this.breadcrumbs = []
    try {
      sessionStorage.removeItem(this.storageKey)
    } catch {
      // Ignore session storage errors
    }
  }

  private persistEvent(event: TelemetryErrorEvent): void {
    try {
      const existing = this.getStoredErrors()
      const updated = [event, ...existing].slice(0, 20)
      sessionStorage.setItem(this.storageKey, JSON.stringify(updated))
    } catch {
      // Storage might be unavailable or full; fail silently
    }
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined
    const sanitized: Record<string, unknown> = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'api_key', 'key']

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value as Record<string, unknown>)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
}

export const telemetry = new TelemetryLedger()

