import React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ViewSkeleton } from '../../components/ui/skeletons/ViewSkeleton'
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react'

interface MasterControlGuardProps {
  children?: React.ReactNode
}

/**
 * Sovereign Route Guard for the Master Control Plane.
 * Prevents unauthorized or unauthenticated access from ever mounting internal admin views.
 */
export const MasterControlGuard: React.FC<MasterControlGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // 1. While authentication status is resolving, preserve layout with matching skeleton
  if (isLoading) {
    return <ViewSkeleton type="master-control" />
  }

  // 2. If unauthenticated, redirect to Sovereign Login with return redirect parameter
  if (!isAuthenticated || !user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/master-control/login?redirect=${redirectUrl}`} replace />
  }

  // 3. If authenticated but lacks platform superadmin privileges, display strict 403 barrier
  if (!user.is_platform_admin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        {/* Subtle structural grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-4"
          style={{
            backgroundImage: `linear-gradient(var(--border-strong) 1px, transparent 1px), linear-gradient(to right, var(--border-strong) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-status-danger/30 bg-surface shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-status-danger/10 border border-status-danger/25 text-status-danger flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-danger/10 text-status-danger text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
              <Lock className="w-3 h-3" />
              <span>Sovereign Access Denied (403)</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Administrator Privileges Required
            </h1>
            <p className="text-xs text-foreground-secondary mt-2 leading-relaxed">
              The Master Control Plane is restricted to authorized platform administrators (<span className="font-mono text-status-danger">is_platform_admin</span>).
              Your current account does not hold platform governance rights.
            </p>
          </div>

          {/* Active Identity Card */}
          <div className="p-3.5 rounded-xl border border-border bg-background-subtle text-left flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-foreground-muted uppercase">Signed in as:</div>
              <div className="text-xs font-semibold text-foreground">{user.name}</div>
              <div className="text-[11px] font-mono text-foreground-secondary">{user.email}</div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-foreground-muted/10 text-foreground-muted text-[10px] font-mono font-bold">
              TENANT USER
            </span>
          </div>

          {/* Remediation Actions */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                logout()
                navigate(`/master-control/login?redirect=${encodeURIComponent(location.pathname)}`)
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign In with Platform Admin Account</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold hover:bg-surface-raised active:scale-98 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Workspace</span>
            </button>
          </div>

          <div className="pt-2 text-[10px] font-mono text-foreground-muted">
            AutoCanvas Platform Governance Engine · DevCenterPoint
          </div>
        </div>
      </div>
    )
  }

  // 4. Authenticated platform administrator: mount control plane
  return <>{children}</>
}
