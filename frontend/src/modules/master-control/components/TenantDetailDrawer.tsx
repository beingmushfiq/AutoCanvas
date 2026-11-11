import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { apiClient } from '../../../lib/api/client'
import { appToast } from '../../../lib/toast'
import type { PlanItem } from './RegisterTenantModal'
import {
  Building2,
  X,
  CreditCard,
  Users,
  Layers,
  ShieldAlert,
  Lock,
  Plus,
  Loader2,
  Trash2,
  Save,
} from 'lucide-react'

interface TenantDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string | null
  onRefreshList: () => void
  onOpenSuspendModal: (org: any) => void
  plans: PlanItem[]
}

export const TenantDetailDrawer: React.FC<TenantDetailDrawerProps> = ({
  isOpen,
  onClose,
  tenantId,
  onRefreshList,
  onOpenSuspendModal,
  plans,
}) => {
  const [activeSubtab, setActiveSubtab] = useState<'overview' | 'workspaces' | 'members' | 'plan' | 'danger'>('overview')
  const [org, setOrg] = useState<any>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [selectedPlanId, setSelectedPlanId] = useState('')

  // New Workspace state
  const [showAddWorkspace, setShowAddWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false)

  // Delete confirmation
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchTenantDetails = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>(`/control-plane/organizations/${id}`)
      const data = response.data
      setOrg(data)
      setName(data.name || '')
      setSlug(data.slug || '')
      setBillingEmail(data.billing_email || '')
      setTimezone(data.timezone || 'UTC')
      setSelectedPlanId(data.subscription?.plan?.id || '')
      setWorkspaces(data.workspaces || [])
    } catch (err) {
      console.error('Failed to load organization details:', err)
      appToast.error('Failed to load organization details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchTenantDetails(tenantId)
      setActiveSubtab('overview')
      setShowAddWorkspace(false)
      setDeleteConfirmationText('')
    }
  }, [isOpen, tenantId])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setIsSaving(true)

    try {
      const response = await apiClient.put<{ success: boolean; data: any }>(`/control-plane/organizations/${tenantId}`, {
        name,
        slug,
        billing_email: billingEmail,
        timezone,
        plan_id: selectedPlanId || undefined,
      })
      setOrg(response.data)
      appToast.success('Organization profile updated.')
      onRefreshList()
    } catch (err) {
      console.error('Failed to update tenant profile:', err)
      appToast.error((err as Error).message || 'Failed to update tenant profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !newWorkspaceName.trim()) return
    setIsAddingWorkspace(true)

    try {
      await apiClient.post(`/control-plane/organizations/${tenantId}/workspaces`, {
        name: newWorkspaceName.trim(),
      })
      appToast.success(`Workspace '${newWorkspaceName}' created.`)
      setNewWorkspaceName('')
      setShowAddWorkspace(false)
      fetchTenantDetails(tenantId)
      onRefreshList()
    } catch (err) {
      console.error('Failed to add workspace:', err)
      appToast.error((err as Error).message || 'Failed to add workspace.')
    } finally {
      setIsAddingWorkspace(false)
    }
  }

  const handleImpersonate = async () => {
    if (!tenantId) return
    try {
      const response = await apiClient.post<{
        success: boolean
        data: { token: string }
      }>(`/control-plane/organizations/${tenantId}/impersonate`)
      const token = response.data.token
      localStorage.setItem('autocanvas_impersonation_token', token)
      appToast.success(`Signed in as ${org?.name} (15m scoped session).`)
      window.open('/workspace', '_blank')
    } catch (err) {
      console.error('Impersonation failed:', err)
      appToast.error('Impersonation request failed.')
    }
  }

  const handleDeleteTenant = async () => {
    if (!tenantId || deleteConfirmationText !== org?.name) return
    setIsDeleting(true)

    try {
      await apiClient.delete(`/control-plane/organizations/${tenantId}`)
      appToast.success(`Organization '${org.name}' has been soft-deleted.`)
      onRefreshList()
      onClose()
    } catch (err) {
      console.error('Failed to delete tenant:', err)
      appToast.error((err as Error).message || 'Failed to delete organization.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Sliding Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-2xl bg-surface border-l border-border h-full shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-start justify-between bg-surface-raised/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent flex items-center justify-center font-bold text-lg">
                  {org?.name ? org.name.charAt(0).toUpperCase() : <Building2 className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground">
                      {org?.name || 'Organization Details'}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        org?.status === 'active'
                          ? 'bg-status-success/15 text-status-success'
                          : 'bg-status-danger/15 text-status-danger'
                      }`}
                    >
                      {org?.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-foreground-muted mt-0.5">
                    {org?.slug} · ID: {org?.id?.substring(0, 14)}...
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImpersonate}
                  title="Sign In as Tenant"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-accent/40 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Impersonate</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center border-b border-border px-6 gap-2 bg-background-subtle/50 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Profile', icon: Building2 },
                { id: 'workspaces', label: `Workspaces (${workspaces.length})`, icon: Layers },
                { id: 'members', label: `Team Members (${org?.members_count ?? 1})`, icon: Users },
                { id: 'plan', label: 'Plan & Quotas', icon: CreditCard },
                { id: 'danger', label: 'Governance & Safety', icon: ShieldAlert },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeSubtab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSubtab(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-brand-accent text-brand-accent'
                        : 'border-transparent text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-foreground-muted text-xs gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
                  <span>Loading organization details...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & PROFILE */}
                  {activeSubtab === 'overview' && (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-background-subtle text-xs">
                        <div>
                          <div className="text-[11px] font-mono text-foreground-muted">CREATED AT</div>
                          <div className="font-semibold text-foreground mt-0.5">
                            {org?.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-mono text-foreground-muted">CURRENT PLAN</div>
                          <div className="font-semibold text-brand-accent mt-0.5">
                            {org?.subscription?.plan?.name || 'Pro Tier'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">
                          Slug
                        </label>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-foreground-secondary mb-1">
                            Billing Email
                          </label>
                          <input
                            type="email"
                            value={billingEmail}
                            onChange={(e) => setBillingEmail(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground-secondary mb-1">
                            Timezone
                          </label>
                          <input
                            type="text"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: WORKSPACES */}
                  {activeSubtab === 'workspaces' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground-secondary">
                          Workspaces subdivide brands and campaigns inside this tenant organization.
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddWorkspace(!showAddWorkspace)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-accent/30 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Workspace</span>
                        </button>
                      </div>

                      {showAddWorkspace && (
                        <form onSubmit={handleAddWorkspace} className="p-4 rounded-xl border border-brand-accent/30 bg-brand-accent/5 space-y-3">
                          <div className="text-xs font-bold text-foreground">Provision Additional Workspace</div>
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Workspace Name (e.g. EU Brand Operations)"
                              value={newWorkspaceName}
                              onChange={(e) => setNewWorkspaceName(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddWorkspace(false)}
                              className="px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isAddingWorkspace || !newWorkspaceName.trim()}
                              className="px-4 py-1.5 rounded-lg bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                            >
                              {isAddingWorkspace ? 'Creating...' : 'Create Workspace'}
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-background">
                        {workspaces.map((ws) => (
                          <div key={ws.id} className="p-4 flex items-center justify-between hover:bg-surface-raised transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-foreground">{ws.name}</span>
                                {ws.is_default && (
                                  <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-foreground-muted mt-0.5">
                                slug: {ws.slug} · {ws.brands_count ?? 0} Brands active
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-foreground-muted">
                              {new Date(ws.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MEMBERS */}
                  {activeSubtab === 'members' && (
                    <div className="space-y-4">
                      <div className="text-xs text-foreground-secondary">
                        Team members and role privileges bound to this organization:
                      </div>

                      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-background">
                        {org?.members?.map((m: any) => (
                          <div key={m.id} className="p-4 flex items-center justify-between hover:bg-surface-raised transition-colors">
                            <div>
                              <div className="font-semibold text-xs text-foreground">
                                {m.user?.name || 'Unnamed Member'}
                              </div>
                              <div className="text-[11px] font-mono text-foreground-muted mt-0.5">
                                {m.user?.email}
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-background-subtle border border-border text-foreground-secondary uppercase">
                              {m.role || 'MEMBER'}
                            </span>
                          </div>
                        ))}
                        {(!org?.members || org.members.length === 0) && (
                          <div className="p-6 text-center text-xs text-foreground-muted">
                            No members found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PLAN & SUBSCRIPTION */}
                  {activeSubtab === 'plan' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-mono uppercase text-brand-accent">CURRENT ACTIVE PLAN</div>
                          <div className="text-lg font-bold text-foreground mt-0.5">
                            {org?.subscription?.plan?.name || 'Starter Plan'}
                          </div>
                          <div className="text-xs text-foreground-secondary">
                            ${org?.subscription?.plan?.price_monthly || '29.00'} / month
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-status-success/15 text-status-success">
                          SUBSCRIPTION ACTIVE
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-2">
                          Switch Organization Plan
                        </label>
                        <select
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ${p.price_monthly}/mo
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                        >
                          Update Subscription Plan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: DANGER ZONE & GOVERNANCE */}
                  {activeSubtab === 'danger' && (
                    <div className="space-y-6">
                      <div className="p-5 rounded-2xl border border-border bg-background space-y-4">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                          Operational Status Governance
                        </h4>
                        <p className="text-xs text-foreground-secondary">
                          {org?.status === 'active'
                            ? 'Suspending this organization halts all scheduled publishing jobs and revokes all active session tokens for its members.'
                            : 'This organization is currently suspended. Reactivating it will restore team access and publishing routines.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenSuspendModal(org)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                            org?.status === 'active'
                              ? 'bg-status-danger/10 text-status-danger border border-status-danger/30 hover:bg-status-danger/20'
                              : 'bg-status-success/10 text-status-success border border-status-success/30 hover:bg-status-success/20'
                          }`}
                        >
                          {org?.status === 'active' ? 'Suspend Organization' : 'Reactivate Organization'}
                        </button>
                      </div>

                      <div className="p-5 rounded-2xl border border-status-danger/30 bg-status-danger/5 space-y-4">
                        <div className="flex items-center gap-2 text-status-danger">
                          <Trash2 className="w-4 h-4" />
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                            Delete / Offboard Organization
                          </h4>
                        </div>
                        <p className="text-xs text-foreground-secondary leading-relaxed">
                          Soft-deleting this organization will revoke member access immediately. Workspaces, drafts, and campaigns are archived according to data retention policies.
                        </p>
                        <div>
                          <label className="block text-[11px] font-mono text-foreground-muted mb-1">
                            Type <strong className="text-foreground">{org?.name}</strong> to confirm deletion:
                          </label>
                          <input
                            type="text"
                            placeholder={org?.name}
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-status-danger/30 bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-status-danger outline-hidden"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isDeleting || deleteConfirmationText !== org?.name}
                          onClick={handleDeleteTenant}
                          className="px-4 py-2 rounded-xl bg-status-danger text-white text-xs font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-40"
                        >
                          {isDeleting ? 'Offboarding...' : 'Permanently Offboard Organization'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
