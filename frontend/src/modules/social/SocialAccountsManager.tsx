import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Share2,
  PlusCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Lock,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'
import { apiClient } from '../../lib/api/client'
import { useAuth } from '../auth/AuthContext'
import { appToast } from '../../lib/toast'

export interface SocialAccountItem {
  id: string
  organization_id: string
  workspace_id?: string | null
  brand_id?: string | null
  platform: 'facebook' | 'instagram' | 'linkedin'
  provider_id: string
  account_name: string
  account_type: 'page' | 'profile' | 'business'
  avatar_url?: string | null
  connection_status: 'connected' | 'expired' | 'revoked' | 'rate_limited'
  is_active: boolean
  expires_at?: string | null
  is_expired: boolean
  is_expiring_soon: boolean
  scopes?: string[] | null
  last_synced_at?: string | null
}

const PLATFORM_CONFIG = {
  facebook: {
    name: 'Facebook Pages',
    color: 'text-status-info',
    bgColor: 'bg-status-info/10',
    borderColor: 'border-status-info/30',
    description: 'Auto-publish to Facebook Pages, upload photos, and monitor engagement.',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
  },
  instagram: {
    name: 'Instagram Professional',
    color: 'text-brand-accent',
    bgColor: 'bg-brand-accent/10',
    borderColor: 'border-brand-accent/30',
    description: 'Containerized media publishing for Instagram Professional & Business profiles.',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
  },
  linkedin: {
    name: 'LinkedIn Organization & Profile',
    color: 'text-status-info',
    bgColor: 'bg-status-info/10',
    borderColor: 'border-status-info/30',
    description: 'Post thought leadership articles, multi-image updates, and UGC posts.',
    scopes: ['openid', 'profile', 'w_member_social'],
  },
}

const DEMO_ACCOUNTS: SocialAccountItem[] = [
  {
    id: 'mock-fb-1',
    organization_id: 'org-demo',
    platform: 'facebook',
    provider_id: '1092837465',
    account_name: 'AutoCanvas Global Official',
    account_type: 'page',
    avatar_url: null,
    connection_status: 'connected',
    is_active: true,
    expires_at: new Date(Date.now() + 86400000 * 58).toISOString(),
    is_expired: false,
    is_expiring_soon: false,
    scopes: ['pages_show_list', 'pages_manage_posts'],
    last_synced_at: new Date().toISOString(),
  },
  {
    id: 'mock-li-1',
    organization_id: 'org-demo',
    platform: 'linkedin',
    provider_id: 'urn:li:person:987654',
    account_name: 'Lead Architect Profile',
    account_type: 'profile',
    avatar_url: null,
    connection_status: 'connected',
    is_active: true,
    expires_at: new Date(Date.now() + 86400000 * 42).toISOString(),
    is_expired: false,
    is_expiring_soon: false,
    scopes: ['openid', 'profile', 'w_member_social'],
    last_synced_at: new Date().toISOString(),
  },
]

export const SocialAccountsManager: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [accounts, setAccounts] = useState<SocialAccountItem[]>(DEMO_ACCOUNTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const connected = searchParams.get('connected')
    const errorParam = searchParams.get('error')

    if (connected) {
      const accountName = searchParams.get('account') || 'social'
      appToast.success(`Successfully connected ${connected} account!`, {
        description: `Connected to ${decodeURIComponent(accountName)}`,
      })
      setSearchParams({})
    } else if (errorParam) {
      appToast.error('Connection failed', {
        description: decodeURIComponent(errorParam),
      })
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // Fetch accounts on load
  const fetchAccounts = async () => {
    if (!isAuthenticated) {
      setAccounts(DEMO_ACCOUNTS)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: SocialAccountItem[] }>('/social/connectors')
      if (res.data && res.data.length > 0) {
        setAccounts(res.data)
      } else {
        setAccounts(DEMO_ACCOUNTS)
      }
    } catch (err: any) {
      const isUnauth = err?.message?.toLowerCase().includes('unauthenticated') || err?.status === 401
      if (!isUnauth) {
        setError(err?.message || 'Failed to load social accounts.')
      }
      setAccounts(DEMO_ACCOUNTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [isAuthenticated])

  // Initiate OAuth flow
  const handleConnect = async (platform: 'facebook' | 'instagram' | 'linkedin') => {
    if (!isAuthenticated) {
      setConnectModalOpen(false)
      window.dispatchEvent(new CustomEvent('autocanvas:open-auth', { detail: { mode: 'login' } }))
      return
    }

    try {
      setProcessingId(platform)
      const res = await apiClient.get<{ success: boolean; data: { authorization_url: string } }>(
        `/social/connectors/${platform}/oauth-url`
      )
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url
      }
    } catch (err: any) {
      setError(`Failed to generate ${platform} OAuth URL: ` + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  // Refresh token
  const handleRefresh = async (account: SocialAccountItem) => {
    if (!isAuthenticated || account.id.startsWith('mock-')) {
      setProcessingId(account.id)
      await new Promise((r) => setTimeout(r, 600))
      appToast.success(`Token refreshed for ${account.account_name} (Demo Mode)`)
      setActionSuccess(`Token for ${account.account_name} refreshed successfully (Demo Mode).`)
      setProcessingId(null)
      return
    }

    try {
      setProcessingId(account.id)
      await apiClient.post(`/social/connectors/${account.id}/refresh`)
      appToast.success(`Token for ${account.account_name} refreshed successfully.`)
      setActionSuccess(`Token for ${account.account_name} refreshed successfully.`)
      fetchAccounts()
    } catch (err: any) {
      appToast.error('Token refresh failed', { description: err.message })
      setError(`Refresh failed: ` + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  // Test connection
  const handleTest = async (account: SocialAccountItem) => {
    if (!isAuthenticated || account.id.startsWith('mock-')) {
      setProcessingId(account.id)
      await new Promise((r) => setTimeout(r, 600))
      appToast.success(`Connection verified: ${account.account_name}`, {
        description: 'Account connector active and responsive.',
      })
      setActionSuccess(`Connection test passed! ${account.account_name} is active and verified in Demo Mode.`)
      setProcessingId(null)
      return
    }

    try {
      setProcessingId(account.id)
      const res = await apiClient.post<{ success: boolean; data: { is_valid: boolean } }>(
        `/social/connectors/${account.id}/test`
      )
      if (res.data?.is_valid) {
        appToast.success(`Connection verified: ${account.account_name}`, {
          description: 'Account connector active and responsive.',
        })
        setActionSuccess(`Connection test passed! ${account.account_name} is active and verified.`)
      } else {
        appToast.error('Connection test failed', {
          description: 'Token is expired or unauthorized.',
        })
        setError(`Connection test failed: token is expired or unauthorized.`)
      }
      fetchAccounts()
    } catch (err: any) {
      appToast.error('Connection test failed', { description: err.message })
      setError(`Connection test failed: ` + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  // Disconnect
  const handleDisconnect = async (account: SocialAccountItem) => {
    if (!confirm(`Are you sure you want to disconnect ${account.account_name}? Scheduled posts for this account will fail.`)) {
      return
    }

    if (!isAuthenticated || account.id.startsWith('mock-')) {
      setAccounts((prev) => prev.filter((a) => a.id !== account.id))
      appToast.info(`Disconnected ${account.account_name} (Demo Mode)`)
      setActionSuccess(`Disconnected ${account.account_name} (Demo Mode).`)
      return
    }

    try {
      setProcessingId(account.id)
      await apiClient.delete(`/social/connectors/${account.id}`)
      appToast.info(`Disconnected ${account.account_name}`)
      setActionSuccess(`Disconnected ${account.account_name}.`)
      fetchAccounts()
    } catch (err: any) {
      appToast.error('Disconnect failed', { description: err.message })
      setError(`Disconnect failed: ` + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const getDaysUntilExpiry = (expiresAt?: string | null) => {
    if (!expiresAt) return null
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-surface border border-border">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">Social Platform Connectors</h2>
            <Badge variant="outline" className="border-border text-foreground-secondary text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-status-success" />
              AES-256-GCM Encrypted
            </Badge>
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            Connect and authenticate your official social accounts for autonomous publishing, rate-limit governance, and containerized media dispatch.
          </p>
        </div>

        <Button
          onClick={() => setConnectModalOpen(true)}
          className="bg-interactive-primary text-interactive-primary-fg hover:opacity-90 flex items-center gap-2 shrink-0 shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-brand-accent" />
          <span>Connect Channel</span>
        </Button>
      </div>

      {/* Polite Guest Preview Banner */}
      {!isAuthenticated && (
        <div
          role="region"
          aria-label="Guest Workspace Notice"
          className="p-4 rounded-xl border border-border bg-surface-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm shadow-2xs animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-background-subtle border border-border flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-brand-accent" aria-hidden="true" />
            </div>
            <div>
              <div className="font-semibold text-foreground flex items-center gap-2">
                <span>Guest Preview Mode</span>
                <span className="px-1.5 py-0.5 rounded-full bg-brand-accent-subtle text-foreground text-[9px] font-mono font-bold">
                  Demo
                </span>
              </div>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Displaying simulated social connectors. You can test and inspect tokens in demo mode, or sign in to link official live OAuth accounts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('autocanvas:open-auth', { detail: { mode: 'login' } }))
            }}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
          >
            <span>Sign In to Connect</span>
          </button>
        </div>
      )}

      {/* Action Banners */}
      {actionSuccess && (
        <div
          role="status"
          className="p-4 rounded-xl border border-status-success/30 bg-status-success/10 text-status-success flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs hover:underline text-foreground-secondary"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-status-danger/30 bg-status-danger/10 text-status-danger flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs hover:underline text-foreground-secondary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-6 w-24 bg-surface-muted rounded-md" />
              <div className="h-12 w-full bg-surface-muted rounded-md" />
              <div className="h-8 w-1/2 bg-surface-muted rounded-md" />
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No Social Channels Connected"
          description="Connect your Facebook Page, Instagram Professional account, or LinkedIn profile to start publishing autonomous content."
          action={{
            label: 'Connect Channel',
            onClick: () => setConnectModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const config = PLATFORM_CONFIG[account.platform] || PLATFORM_CONFIG.facebook
            const daysLeft = getDaysUntilExpiry(account.expires_at)

            return (
              <Card
                key={account.id}
                className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-5 shadow-2xs hover:border-brand-accent/40 transition-colors"
              >
                <div className="space-y-4">
                  {/* Platform & Status Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                      {config.name}
                    </span>

                    {account.connection_status === 'connected' && !account.is_expired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success/10 text-status-success border border-status-success/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                        Connected
                      </span>
                    ) : account.is_expiring_soon ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-warning/10 text-status-warning border border-status-warning/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                        Expiring Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-danger/10 text-status-danger border border-status-danger/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-danger" />
                        Expired
                      </span>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-surface-muted flex items-center justify-center font-bold text-foreground overflow-hidden border border-border shrink-0">
                      {account.avatar_url ? (
                        <img src={account.avatar_url} alt={account.account_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{account.account_name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate" title={account.account_name}>
                        {account.account_name}
                      </h3>
                      <p className="text-xs text-foreground-secondary truncate">
                        ID: {account.provider_id} • <span className="capitalize">{account.account_type}</span>
                      </p>
                    </div>
                  </div>

                  {/* Token Status & Expiry */}
                  <div className="p-3 rounded-xl bg-surface-muted border border-border/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-foreground-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Token Validity:
                      </span>
                      <span className="font-medium text-foreground">
                        {daysLeft !== null ? `${daysLeft} days remaining` : 'Permanent Page Token'}
                      </span>
                    </div>
                    {account.last_synced_at && (
                      <div className="text-foreground-secondary text-[11px]">
                        Last verified: {new Date(account.last_synced_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(account)}
                      disabled={processingId === account.id}
                      className="text-xs h-8 px-2.5 border-border text-foreground hover:bg-surface-muted"
                      title="Test API token permissions"
                    >
                      <Radio className={`w-3.5 h-3.5 mr-1 ${processingId === account.id ? 'animate-spin' : ''}`} />
                      Test
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefresh(account)}
                      disabled={processingId === account.id}
                      className="text-xs h-8 px-2.5 border-border text-foreground hover:bg-surface-muted"
                      title="Refresh token"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${processingId === account.id ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account)}
                    disabled={processingId === account.id}
                    className="text-xs h-8 px-2 text-status-danger hover:bg-status-danger/10"
                    title="Disconnect account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Connect Channel Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-channel-title"
            className="w-full max-w-xl rounded-2xl bg-surface border border-border p-6 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 id="connect-channel-title" className="text-lg font-bold text-foreground">
                  Connect Social Channel
                </h3>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Select an authorized social media network to initiate official OAuth2 consent.
                </p>
              </div>
              <button
                onClick={() => setConnectModalOpen(false)}
                aria-label="Close dialog"
                className="text-foreground-secondary hover:text-foreground text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {(['facebook', 'instagram', 'linkedin'] as const).map((platform) => {
                const conf = PLATFORM_CONFIG[platform]
                const isConnecting = processingId === platform

                return (
                  <div
                    key={platform}
                    className="p-4 rounded-xl border border-border hover:border-brand-accent/50 bg-surface flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{conf.name}</span>
                        <Badge variant="outline" className="text-[10px] py-0 border-border text-foreground-secondary">
                          Official API
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-secondary">{conf.description}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-foreground-secondary">Scopes:</span>
                        {conf.scopes.slice(0, 2).map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-surface-muted font-mono text-foreground-secondary">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleConnect(platform)}
                      disabled={isConnecting}
                      className="bg-interactive-primary text-interactive-primary-fg hover:opacity-90 text-xs shrink-0 flex items-center gap-1.5"
                    >
                      {isConnecting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-accent" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                      <span>Connect</span>
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted text-xs text-foreground-secondary flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
              <span>
                AutoCanvas uses official OAuth2 authorization. Your access tokens are envelope-encrypted with AES-256-GCM and never shared. You can revoke access at any time.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setConnectModalOpen(false)}
                className="border-border text-foreground text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
