import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiClient } from '../../lib/api/client'
import { Logo } from '../../components/brand/Logo'
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react'

export const MasterControlLoginPage: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/master-control/white-label'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If already authenticated as platform admin, seamlessly redirect
  useEffect(() => {
    if (isAuthenticated && user?.is_platform_admin) {
      navigate(redirectUrl, { replace: true })
    }
  }, [isAuthenticated, user, redirectUrl, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const response = await apiClient.post<{
        success: boolean
        data: {
          token: string
          user: {
            id: string
            name: string
            email: string
          }
        }
      }>('/auth/login', { email, password })

      const token = response.data.token

      // Verify the user profile returned has is_platform_admin capability
      const meResponse = await apiClient.get<{
        success: boolean
        data: {
          user: {
            id: string
            name: string
            email: string
            is_platform_admin: boolean
          }
        }
      }>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!meResponse.data.user.is_platform_admin) {
        // Disallow standard tenant accounts from holding session in Master Control
        logout()
        setErrorMsg('Access Denied: This account lacks Platform Administrator (is_platform_admin) authorization.')
        setIsSubmitting(false)
        return
      }

      // Persist auth context
      await login(token)
      navigate(redirectUrl, { replace: true })
    } catch (err) {
      const message = (err as Error).message || 'Invalid administrator credentials.'
      setErrorMsg(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      {/* Background Structural Architectural Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(to right, var(--border-strong) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size="lg" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-accent/30 bg-brand-accent/10 text-brand-accent text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sovereign Control Plane</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Platform Admin Center
          </h1>
          <p className="text-xs text-foreground-secondary mt-1">
            Authenticate to govern workspaces, AI pipelines, CMS blocks, and multi-tenant security.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-8 rounded-2xl border border-border bg-surface shadow-xl">
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl border border-status-danger/30 bg-status-danger/10 text-status-danger text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-foreground-secondary uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-foreground-muted" />
                <input
                  type="email"
                  required
                  placeholder="admin@autocanvas.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-foreground-secondary uppercase tracking-wider mb-1.5">
                Passphrase / Master Key
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-foreground-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-2.5 text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-bold tracking-wide hover:opacity-90 active:scale-98 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Verifying Sovereign Credentials...' : 'Authenticate Admin Session'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Security Guarantee */}
          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-status-success" />
              AES-256 Vault Session
            </span>
            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="hover:text-brand-accent transition-colors underline cursor-pointer"
            >
              Return to Workspace
            </button>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center mt-6 text-[11px] font-mono text-foreground-muted">
          AutoCanvas Governance Engine · DevCenterPoint
        </div>
      </div>
    </div>
  )
}

