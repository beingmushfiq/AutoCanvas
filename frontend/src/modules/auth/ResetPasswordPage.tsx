import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '../../lib/api/client'
import { Logo } from '../../components/brand/Logo'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Button } from '../../components/ui/button'
import { AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isMatching = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const isLongEnough = password.length >= 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token || !email) {
      setError('Invalid password reset link. Please request a new recovery link.')
      return
    }

    if (!isLongEnough) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setIsSubmitting(true)

    try {
      await apiClient.post('/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: confirmPassword,
      })

      setIsSuccess(true)
    } catch (err) {
      setError((err as Error).message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-surface shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="md" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Reset Account Password
          </h1>
          <p className="text-xs text-foreground-secondary mt-1">
            Choose a strong, unique password to secure your sovereign workspace.
          </p>
        </div>

        {/* Missing Parameters Guard */}
        {(!token || !email) && !isSuccess ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-status-danger-bg border border-status-danger/30 flex items-start gap-2.5 text-status-danger text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Invalid Password Recovery Link</p>
                <p className="mt-0.5 text-foreground-secondary">
                  The password reset token or account email is missing from this URL.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Return to Sign In
            </Button>
          </div>
        ) : isSuccess ? (
          /* Success Screen */
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-status-success-bg border border-status-success/30 flex items-center justify-center mx-auto text-status-success">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">Password Successfully Updated</h2>
              <p className="text-xs text-foreground-secondary">
                Your credentials have been updated and any previous sessions were securely invalidated.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => navigate('/')}
              className="w-full mt-4"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Sign In with New Password
            </Button>
          </div>
        ) : (
          /* Reset Password Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-status-danger-bg border border-status-danger/30 flex items-center gap-2 text-status-danger text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-background-subtle border border-border text-xs text-foreground-secondary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-accent shrink-0" />
              <span>Resetting password for: <strong className="text-foreground">{email}</strong></span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                New Password
              </label>
              <PasswordInput
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                showLeftIcon={true}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Confirm New Password
              </label>
              <PasswordInput
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                showLeftIcon={true}
              />
            </div>

            {/* Password Validation Hints */}
            <div className="space-y-1 pt-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${isLongEnough ? 'text-status-success' : 'text-foreground-muted'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>Minimum 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isMatching ? 'text-status-success' : 'text-foreground-muted'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>Passwords match</span>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Update Password & Sign In
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

