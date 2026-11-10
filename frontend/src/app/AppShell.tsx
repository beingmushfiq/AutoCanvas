import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Layers,
  Share2,
  PenSquare,
  Palette,
  Calendar,
  Inbox,
  Radio,
  BarChart3,
  Sparkles,
  Bot,
  BookOpen,
  LayoutTemplate,
  Users,
  CreditCard,
  Settings,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronDown,
  LogOut,
  Check,
} from 'lucide-react'
import { apiClient, type HealthCheckData } from '../lib/api/client'
import { useAuth } from '../modules/auth/AuthContext'
import { AuthModal } from '../modules/auth/AuthModal'
import { TeamSettings } from '../modules/settings/TeamSettings'
import { BillingSettings } from '../modules/settings/BillingSettings'
import { AuditLogView } from '../modules/settings/AuditLogView'
import { BrandStudio } from '../modules/brands/BrandStudio'
import { ContentStudio } from '../modules/content/ContentStudio'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
  { id: 'brands', label: 'Brands', icon: Layers },
  { id: 'accounts', label: 'Social Accounts', icon: Share2 },
  { id: 'content', label: 'Content Studio', icon: PenSquare },
  { id: 'creative', label: 'Creative Studio', icon: Palette },
  { id: 'calendar', label: 'Publishing Calendar', icon: Calendar },
  { id: 'inbox', label: 'Unified Inbox', icon: Inbox },
  { id: 'listening', label: 'Social Listening', icon: Radio },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'strategist', label: 'AI Strategist', icon: Sparkles },
  { id: 'automations', label: 'Automations', icon: Bot },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'team', label: 'Team & Access', icon: Users },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  { id: 'audit', label: 'Audit Trail', icon: Settings },
]

export const AppShell: React.FC = () => {
  const { user, activeOrg, activeWorkspace, workspaces, isAuthenticated, logout, switchWorkspace } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [health, setHealth] = useState<HealthCheckData | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await apiClient.checkHealth()
        setHealth(data)
      } catch (e) {
        console.error('Failed to connect to core API:', e)
      }
    }
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen bg-[#F7F8FA] text-[#101828]">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[#EAECF0] bg-white flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Platform Info */}
          <div className="p-5 border-b border-[#EAECF0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6257E8] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                A
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight leading-none text-[#101828]">AutoCanvas</h1>
                <span className="text-[11px] font-medium text-[#667085]">Autonomous Brand Ops</span>
              </div>
            </div>

            {/* Interactive Workspace Selector */}
            <div className="relative mt-4">
              <button
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#101828] bg-[#F7F8FA] rounded-md border border-[#EAECF0] hover:bg-[#F2F4F7] transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                  <span className="truncate">
                    {activeOrg ? `${activeOrg.name} (${activeWorkspace?.name || 'Default'})` : 'No Workspace Selected'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#667085] shrink-0" />
              </button>

              {/* Workspace Dropdown Menu */}
              {showWorkspaceMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EAECF0] rounded-xl shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3]">
                    Switch Workspace
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        switchWorkspace(ws.id)
                        setShowWorkspaceMenu(false)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-[#F2F4F7] text-[#344054] transition-colors"
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspace?.id && (
                        <Check className="w-3.5 h-3.5 text-[#6257E8] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-270px)]">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#6257E8] text-white shadow-sm'
                      : 'text-[#344054] hover:bg-[#F2F4F7] hover:text-[#101828]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#667085]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EAECF0] text-[#344054] font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* User Session & System Health Footer */}
        <div className="p-4 border-t border-[#EAECF0] bg-[#F9FAFB] space-y-3">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="truncate">
                <div className="text-xs font-semibold text-[#101828] truncate">{user?.name}</div>
                <div className="text-[10px] text-[#667085] truncate">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                className="flex-1 py-1.5 px-2.5 rounded-lg border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5246D6] transition-colors shadow-xs"
              >
                Register
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-[#EAECF0] flex items-center justify-between text-xs">
            <span className="text-[#667085] font-medium">Core API</span>
            <div className="flex items-center gap-1.5 font-medium">
              {health?.status === 'ok' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Healthy (v1.0.0)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-600">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Operational Bar */}
        <header className="h-16 border-b border-[#EAECF0] bg-white px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#101828]">
              {activeTab === 'team' && 'Team & Access Control'}
              {activeTab === 'billing' && 'Billing & Subscription Tiers'}
              {activeTab === 'audit' && 'System Governance & Audit Trail'}
              {activeTab === 'overview' && 'AutoCanvas Command Center'}
              {activeTab === 'brands' && 'Brand Intelligence Studio'}
              {activeTab === 'knowledge' && 'Brand Knowledge Base & Citations'}
              {activeTab === 'content' && 'Content Studio & Copy Engine'}
              {activeTab === 'creative' && 'Creative Studio & Deterministic Renderer'}
              {!['team', 'billing', 'audit', 'overview', 'brands', 'knowledge', 'content', 'creative'].includes(activeTab) && 'AutoCanvas Operations'}
            </h2>
            <p className="text-xs text-[#667085]">
              {activeOrg ? `${activeOrg.name} • Plan: ${activeOrg.plan}` : 'Organization operations & brand governance'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Emergency Pause Control */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                isPaused
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{isPaused ? 'Resume All Automations' : 'Emergency Pause All'}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Status Alert if Paused */}
          {isPaused && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-center gap-3 text-amber-900 text-sm">
              <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-semibold">All autonomous planning and publishing is currently PAUSED.</strong>
                <p className="text-xs text-amber-700 mt-0.5">Scheduled slots are safely preserved. No new jobs will be dispatched to social network APIs until resumed.</p>
              </div>
            </div>
          )}

          {/* Conditional View Rendering based on activeTab */}
          {activeTab === 'team' && <TeamSettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'audit' && <AuditLogView />}
          {activeTab === 'brands' && <BrandStudio initialTab="profile" />}
          {activeTab === 'knowledge' && <BrandStudio initialTab="knowledge" />}
          {activeTab === 'content' && <ContentStudio initialView="posts" />}
          {activeTab === 'creative' && <ContentStudio initialView="creative" />}

          {activeTab === 'overview' && (
            <>
              {/* Operational Metrics Cards */}
              <div className="grid grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-xs">
                  <span className="text-xs font-medium text-[#667085]">Active Organization</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#101828] truncate">{activeOrg?.name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-xs">
                  <span className="text-xs font-medium text-[#667085]">Workspaces</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#101828]">{workspaces.length}</span>
                    <span className="text-xs text-[#667085]">Active</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-xs">
                  <span className="text-xs font-medium text-[#667085]">Your Tenant Role</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#6257E8] uppercase tracking-wide">
                      {activeOrg?.role || 'Guest'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#EAECF0] shadow-xs">
                  <span className="text-xs font-medium text-[#667085]">Subscription Plan</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#101828]">{activeOrg?.plan || 'Starter'}</span>
                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                  </div>
                </div>
              </div>

              {/* Phase 1 Completion Status Card */}
              <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-xs">
                <h3 className="text-sm font-semibold text-[#101828]">Phase 1 SaaS Foundation Operational</h3>
                <p className="text-xs text-[#667085] mt-1">
                  Multi-tenant isolation, Sanctum session management, and RBAC authorization are active.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAECF0]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#101828]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Tenant Isolation Scopes</span>
                    </div>
                    <p className="text-[11px] text-[#667085] mt-1.5 leading-relaxed">
                      All queries automatically filter by organization_id. Cross-tenant access attempts are strictly rejected.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAECF0]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#101828]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Role-Based Access Control</span>
                    </div>
                    <p className="text-[11px] text-[#667085] mt-1.5 leading-relaxed">
                      Owner, Admin, Manager, Editor, Designer, Publisher, Analyst, and Community Manager policies enforced.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F8FA] border border-[#EAECF0]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#101828]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Centralized Entitlements</span>
                    </div>
                    <p className="text-[11px] text-[#667085] mt-1.5 leading-relaxed">
                      Starter, Growth, Agency, and Enterprise plan limits govern workspace and member additions in real time.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!['team', 'billing', 'audit', 'overview', 'brands', 'knowledge', 'content', 'creative'].includes(activeTab) && (
            <div className="bg-white rounded-xl border border-[#EAECF0] p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F2F4F7] text-[#6257E8] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#101828]">Scheduled for Next Phase</h3>
              <p className="text-xs text-[#667085] max-w-md mx-auto mt-1">
                This module connects to the Publishing Engine and Social Connectors coming in Phase 5 & 6.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
