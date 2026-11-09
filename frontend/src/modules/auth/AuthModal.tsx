import React, { useState } from 'react'
import { apiClient } from '../../lib/api/client'
import { useAuth } from './AuthContext'
import { Lock, Mail, User, Building2, AlertCircle, ArrowRight } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const response = await apiClient.post<{
          success: boolean
          data: { token: string }
        }>('/auth/login', { email, password })

        await login(response.data.token)
        onClose()
      } else {
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
        onClose()
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred during authentication')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#EAECF0] text-center">
          <div className="w-10 h-10 rounded-xl bg-[#6257E8] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
            A
          </div>
          <h3 className="mt-3 text-lg font-bold text-[#101828]">
            {mode === 'login' ? 'Sign in to AutoCanvas' : 'Create your Organization'}
          </h3>
          <p className="text-xs text-[#667085] mt-1">
            {mode === 'login'
              ? 'Access your autonomous brand operations dashboard'
              : 'Begin your 14-day full autonomous operations trial'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#98A2B3] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Johnson"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D0D5DD] focus:outline-hidden focus:border-[#6257E8] focus:ring-1 focus:ring-[#6257E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Company / Organization Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#98A2B3] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Global Media"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D0D5DD] focus:outline-hidden focus:border-[#6257E8] focus:ring-1 focus:ring-[#6257E8]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#98A2B3] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@acme.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D0D5DD] focus:outline-hidden focus:border-[#6257E8] focus:ring-1 focus:ring-[#6257E8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#344054] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#98A2B3] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D0D5DD] focus:outline-hidden focus:border-[#6257E8] focus:ring-1 focus:ring-[#6257E8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5246D6] transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="p-4 bg-[#F9FAFB] border-t border-[#EAECF0] text-center text-xs text-[#667085]">
          {mode === 'login' ? (
            <p>
              Don't have an organization account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null) }}
                className="font-semibold text-[#6257E8] hover:underline"
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null) }}
                className="font-semibold text-[#6257E8] hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

