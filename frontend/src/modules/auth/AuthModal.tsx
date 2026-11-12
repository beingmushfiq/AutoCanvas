import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { modalBackdropVariants, modalCardVariants } from '../../lib/motion/variants'
import { apiClient } from '../../lib/api/client'
import { useAuth } from './AuthContext'
import { Logo } from '../../components/brand/Logo'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Mail, User, Building2, AlertCircle, ArrowRight, CheckCircle2, X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register' | 'forgot'
  onRegisterSuccess?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onRegisterSuccess,
}) => {
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync mode when initialMode changes
  useEffect(() => {
    setMode(initialMode)
    setError(null)
    setSuccessMessage(null)
  }, [initialMode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const response = await apiClient.post<{
          success: boolean
          data: { token: string }
        }>('/auth/login', { email, password })

        await login(response.data.token)
        onClose()
      } else if (mode === 'register') {
        const response = await apiClient.post<{
          success: boolean
          data: { token: string }
        }>('/auth/register', {
          name,
          email,
          password,
          organization_name: orgName || undefined,
        })

        await login(response.data.token)
        if (onRegisterSuccess) {
          onRegisterSuccess()
        }
        onClose()
      } else {
        // Password Reset Request
        const response = await apiClient.post<{
          success: boolean
          message: string
        }>('/auth/forgot-password', { email })

        setSuccessMessage(response.message || 'Password reset instructions have been dispatched to your email.')
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred during authentication')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError(null)
    try {
      const response = await apiClient.get<{
        success: boolean
        data: { redirect_url: string }
      }>('/auth/google/redirect')

      if (response.data?.redirect_url) {
        window.location.href = response.data.redirect_url
      } else {
        window.location.href = '/api/v1/auth/google/redirect'
      }
    } catch (err) {
      setError((err as Error).message || 'Unable to connect to Google Sign-In service.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            variants={modalCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden relative z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute right-4 top-4 p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="p-6 border-b border-border text-center">
              <div className="flex justify-center mb-3">
                <Logo size="md" />
              </div>
              <h3 id="auth-modal-title" className="text-base font-bold text-foreground tracking-tight">
                {mode === 'login' && 'Sign in to AutoCanvas'}
                {mode === 'register' && 'Create your Organization'}
                {mode === 'forgot' && 'Reset your password'}
              </h3>
              <p className="text-xs text-foreground-secondary mt-1">
                {mode === 'login' && 'Access your autonomous brand operations dashboard'}
                {mode === 'register' && 'Begin your 14-day autonomous operations trial'}
                {mode === 'forgot' && 'Enter your email to receive a secure recovery link'}
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-status-danger-bg border border-status-danger/30 flex items-center gap-2 text-status-danger text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-status-success-bg border border-status-success/30 flex items-center gap-2 text-status-success text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-foreground-muted absolute left-3 top-2.5 z-10 pointer-events-none" />
                      <Input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alice Johnson"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Company / Organization Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-foreground-muted absolute left-3 top-2.5 z-10 pointer-events-none" />
                      <Input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Acme Global Media"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-foreground-muted absolute left-3 top-2.5 z-10 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@acme.com"
                    className="pl-9"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(null); setSuccessMessage(null) }}
                        className="text-[11px] text-brand-accent hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <PasswordInput
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    showLeftIcon={true}
                  />
                </div>
              )}

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot' && 'Send Recovery Email'}
              </Button>

              {/* Social Login Divider & Google Button */}
              {mode !== 'forgot' && (
                <>
                  <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-border"></div>
                    <span className="shrink mx-3 text-[11px] text-foreground-muted font-medium uppercase tracking-wider">
                      or continue with
                    </span>
                    <div className="grow border-t border-border"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-subtle text-foreground text-xs font-semibold transition-colors cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                  </button>
                </>
              )}
            </form>

            {/* Modal Footer / Mode Toggles */}
            <div className="p-4 bg-background-subtle border-t border-border text-center text-xs text-foreground-secondary">
              {mode === 'login' && (
                <p>
                  Don't have an organization account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); setSuccessMessage(null) }}
                    className="font-semibold text-brand-accent hover:underline ml-1 cursor-pointer"
                  >
                    Register
                  </button>
                </p>
              )}
              {mode === 'register' && (
                <p>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setSuccessMessage(null) }}
                    className="font-semibold text-brand-accent hover:underline ml-1 cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
              {mode === 'forgot' && (
                <p>
                  Remember your credentials?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setSuccessMessage(null) }}
                    className="font-semibold text-brand-accent hover:underline ml-1 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
