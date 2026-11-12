import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Logo } from '../../components/brand/Logo'
import { AlertCircle, ArrowRight } from 'lucide-react'

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      setErrorMessage(decodeURIComponent(error))
      return
    }

    if (!token) {
      setErrorMessage('No authentication token received from identity provider.')
      return
    }

    const processAuth = async () => {
      try {
        await login(token)
        // Clean URL to prevent token leakage in history/referrers
        window.history.replaceState({}, document.title, '/workspace/overview')
        navigate('/workspace/overview', { replace: true })
      } catch (err) {
        setErrorMessage((err as Error).message || 'Failed to initialize session from identity token.')
      }
    }

    processAuth()
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-border bg-surface shadow-2xl space-y-6">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        {errorMessage ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-status-danger-bg border border-status-danger/30 flex items-start gap-2.5 text-status-danger text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>Back to Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Authenticating Sovereign Identity...
            </h2>
            <p className="text-xs text-foreground-secondary">
              Bootstrapping organization context and establishing secure session.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

