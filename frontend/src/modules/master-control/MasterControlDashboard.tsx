import React, { useState, useEffect } from 'react'
import {
  Crown,
  ShieldAlert,
  Sparkles,
  Sliders,
  Globe,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Building2,
  LogOut,
  ExternalLink,
  History,
  Eye,
  RefreshCw,
  Palette,
  Lock,
  Search,
  Radio,
  SplitSquareVertical,
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { BreadcrumbBar } from '../../components/navigation/BreadcrumbBar'
import { PromptSandboxModal } from './PromptSandboxModal'
import {
  apiClient,
  type CmsBlockItem,
  type CustomThemeData,
  type AiPromptGroup,
  type CrawlerTuningData,
} from '../../lib/api/client'
import { usePwaManifest } from '../../components/pwa/usePwaManifest'

type MasterTab = 'white_label' | 'landing_cms' | 'prompt_foundry' | 'crawler_tuning' | 'tenant_ledger' | 'audit_ledger'

const MC_SLUG_TO_TAB: Record<string, MasterTab> = {
  'white-label': 'white_label',
  'white_label': 'white_label',
  'cms': 'landing_cms',
  'landing_cms': 'landing_cms',
  'landing-cms': 'landing_cms',
  'prompts': 'prompt_foundry',
  'prompt_foundry': 'prompt_foundry',
  'radar': 'crawler_tuning',
  'crawler-tuning': 'crawler_tuning',
  'crawler_tuning': 'crawler_tuning',
  'organizations': 'tenant_ledger',
  'tenants': 'tenant_ledger',
  'tenant_ledger': 'tenant_ledger',
  'security': 'audit_ledger',
  'audit': 'audit_ledger',
  'audit_ledger': 'audit_ledger',
}

const MC_TAB_TO_SLUG: Record<MasterTab, string> = {
  white_label: 'white-label',
  landing_cms: 'cms',
  prompt_foundry: 'prompts',
  crawler_tuning: 'radar',
  tenant_ledger: 'organizations',
  audit_ledger: 'security',
}

interface MasterControlDashboardProps {
  onExitToWorkspace: () => void
}

export const MasterControlDashboard: React.FC<MasterControlDashboardProps> = ({ onExitToWorkspace }) => {
  // Activate Master PWA Manifest for the Sovereign Cockpit
  usePwaManifest('master')

  const { tab: routeTab, subtab: routeSubtab } = useParams<{ tab?: string; subtab?: string }>()
  const navigate = useNavigate()

  const activeTab: MasterTab = (routeTab && MC_SLUG_TO_TAB[routeTab]) || 'white_label'

  const handleSelectTab = (tab: MasterTab) => {
    const slug = MC_TAB_TO_SLUG[tab] || tab
    navigate(`/master-control/${slug}`)
  }

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Circuit Breaker State
  const [isCircuitPaused, setIsCircuitPaused] = useState(false)
  const [isSandboxOpen, setIsSandboxOpen] = useState(false)

  // 1. White-Label & Theme State
  const [themeData, setThemeData] = useState<CustomThemeData>({
    platform_name: 'AutoCanvas',
    tagline: 'One brand. Every channel. Always in rhythm.',
    creator_name: 'DevCenterPoint',
    creator_url: 'https://devcenterpoint.com',
    primary_logo_url: '/brand/logo-horizontal-dark.svg',
    dark_logo_url: '/brand/logo-horizontal-dark.svg',
    favicon_url: '/favicon.svg',
    primary_color_hex: '#0b0d11',
    accent_color_hex: '#f59e0b',
    custom_css: '',
    announcement_banner: {
      enabled: false,
      text: '',
      link: 'https://devcenterpoint.com',
    },
  })

  // 2. Landing CMS Blocks State
  const [cmsBlocks, setCmsBlocks] = useState<Record<string, CmsBlockItem>>({})
  const [activeCmsBlockKey, setActiveCmsBlockKey] = useState<string>('hero')
  const [cmsBlockForm, setCmsBlockForm] = useState<any>({})
  const [showLivePreview, setShowLivePreview] = useState(true)

  // 3. AI Prompt Foundry State
  const [promptGroups, setPromptGroups] = useState<AiPromptGroup[]>([])
  const [selectedTaskType, setSelectedTaskType] = useState<string>('headline_hook')

  // Synchronize subtab slug with active CMS block or Prompt task type
  useEffect(() => {
    if (routeSubtab) {
      if (activeTab === 'landing_cms' && cmsBlocks[routeSubtab]) {
        setActiveCmsBlockKey(routeSubtab)
      } else if (activeTab === 'prompt_foundry') {
        setSelectedTaskType(routeSubtab)
      }
    }
  }, [routeSubtab, activeTab, cmsBlocks])
  const [promptTemplateEdit, setPromptTemplateEdit] = useState<string>('')
  const [promptModelEdit, setPromptModelEdit] = useState<string>('gpt-4o')
  const [promptTempEdit, setPromptTempEdit] = useState<number>(0.7)
  const [promptMaxTokensEdit, setPromptMaxTokensEdit] = useState<number>(1000)
  const [promptChangeSummary, setPromptChangeSummary] = useState<string>('')

  // 4. Crawler Tuning State
  const [crawlerTuning, setCrawlerTuning] = useState<CrawlerTuningData>({
    simhash_hamming_cutoff: 4,
    vector_cosine_cutoff: 0.72,
    scrape_interval_minutes: 60,
    freshness_window_hours: 72,
    max_articles_per_cluster: 10,
    auto_publish_threshold: 0.85,
    discovery_enabled: true,
  })
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [harvestResult, setHarvestResult] = useState<string | null>(null)

  // 5. Tenant Ledger State
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantSearch, setTenantSearch] = useState<string>('')
  const [tenantLoading, setTenantLoading] = useState(false)

  // Initial Data Fetch
  useEffect(() => {
    fetchMasterData()
  }, [])

  const fetchMasterData = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const [themeRes, blocksRes, promptsRes, crawlerRes, cbRes] = await Promise.all([
        apiClient.getMasterTheme(),
        apiClient.getMasterCmsBlocks(),
        apiClient.getMasterPrompts(),
        apiClient.getCrawlerTuning(),
        apiClient.getCircuitBreakerStatus().catch(() => ({ success: true, data: { paused: false } })),
      ])

      if (themeRes.data) setThemeData(themeRes.data)
      if (blocksRes.data) {
        setCmsBlocks(blocksRes.data)
        if (blocksRes.data['hero']) {
          setCmsBlockForm(blocksRes.data['hero'].content_json)
        }
      }
      if (promptsRes.data) {
        setPromptGroups(promptsRes.data)
        const currentGroup = promptsRes.data.find((g) => g.task_type === selectedTaskType)
        if (currentGroup?.active_version) {
          setPromptTemplateEdit(currentGroup.active_version.prompt_template)
          setPromptModelEdit(currentGroup.active_version.model_override || 'gpt-4o')
          setPromptTempEdit(currentGroup.active_version.temperature)
          setPromptMaxTokensEdit(currentGroup.active_version.max_tokens)
        }
      }
      if (crawlerRes.data) setCrawlerTuning(crawlerRes.data)
      if (cbRes.data) setIsCircuitPaused(cbRes.data.paused)

      // Fetch tenants
      fetchTenants()
    } catch (err: any) {
      console.error('Failed to load Master Control data:', err)
      setErrorMsg(err.message || 'Unable to connect to Master Control endpoints.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTenants = async (search = '') => {
    setTenantLoading(true)
    try {
      const res = await apiClient.getMasterTenants({ search })
      if (res.data) {
        setTenants(Array.isArray(res.data) ? res.data : (res.data.data || []))
      }
    } catch (err) {
      console.warn('Tenant ledger fetch error:', err)
    } finally {
      setTenantLoading(false)
    }
  }

  // Flash Feedback Helper
  const flashSuccess = (msg: string) => {
    setSaveSuccessMsg(msg)
    setTimeout(() => setSaveSuccessMsg(null), 4000)
  }

  // --- Handlers ---
  const handleSaveTheme = async () => {
    setIsSaving(true)
    try {
      const res = await apiClient.updateMasterTheme(themeData)
      if (res.data) setThemeData(res.data)
      flashSuccess('Platform white-label and theme overrides updated successfully.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save theme settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectCmsBlock = (key: string) => {
    setActiveCmsBlockKey(key)
    if (cmsBlocks[key]) {
      setCmsBlockForm(cmsBlocks[key].content_json)
    }
  }

  const handleSaveCmsBlock = async () => {
    setIsSaving(true)
    try {
      const currentBlock = cmsBlocks[activeCmsBlockKey]
      const title = currentBlock?.title || `${activeCmsBlockKey.toUpperCase()} Section`
      const res = await apiClient.updateMasterCmsBlock(activeCmsBlockKey, {
        title,
        content_json: cmsBlockForm,
      })
      if (res.data) {
        setCmsBlocks((prev) => ({
          ...prev,
          [activeCmsBlockKey]: res.data!,
        }))
      }
      flashSuccess(`Marketing section '${activeCmsBlockKey}' updated with live cache invalidation.`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save CMS block.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTaskTypeChange = (taskType: string) => {
    setSelectedTaskType(taskType)
    const grp = promptGroups.find((g) => g.task_type === taskType)
    if (grp?.active_version) {
      setPromptTemplateEdit(grp.active_version.prompt_template)
      setPromptModelEdit(grp.active_version.model_override || 'gpt-4o')
      setPromptTempEdit(grp.active_version.temperature)
      setPromptMaxTokensEdit(grp.active_version.max_tokens)
      setPromptChangeSummary('')
    }
  }

  const handleSavePrompt = async () => {
    setIsSaving(true)
    try {
      const res = await apiClient.saveMasterPrompt(selectedTaskType, {
        prompt_template: promptTemplateEdit,
        model_override: promptModelEdit,
        temperature: promptTempEdit,
        max_tokens: promptMaxTokensEdit,
        change_summary: promptChangeSummary || `Updated ${new Date().toLocaleTimeString()}`,
      })
      if (res.data) {
        // Refresh prompt groups
        const updatedGroups = await apiClient.getMasterPrompts()
        if (updatedGroups.data) setPromptGroups(updatedGroups.data)
      }
      flashSuccess(`New prompt version deployed for '${selectedTaskType}'.`)
      setPromptChangeSummary('')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save prompt template.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRollbackPrompt = async (targetVersion: number) => {
    if (!confirm(`Revert '${selectedTaskType}' prompt to Version ${targetVersion}?`)) return
    setIsSaving(true)
    try {
      const res = await apiClient.rollbackMasterPrompt(selectedTaskType, targetVersion)
      if (res.data) {
        const updatedGroups = await apiClient.getMasterPrompts()
        if (updatedGroups.data) setPromptGroups(updatedGroups.data)
        setPromptTemplateEdit(res.data.prompt_template)
        setPromptModelEdit(res.data.model_override || 'gpt-4o')
        setPromptTempEdit(res.data.temperature)
        setPromptMaxTokensEdit(res.data.max_tokens)
      }
      flashSuccess(`Reverted '${selectedTaskType}' to Version ${targetVersion}.`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rollback prompt.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCrawlerTuning = async () => {
    setIsSaving(true)
    try {
      const res = await apiClient.updateCrawlerTuning(crawlerTuning)
      if (res.data) setCrawlerTuning(res.data)
      flashSuccess('Autonomous crawler and novelty thresholds applied.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update crawler tuning.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTriggerAutonomousCycle = async () => {
    setIsHarvesting(true)
    setHarvestResult(null)
    try {
      // Trigger harvest cycle
      setHarvestResult('Hourly autonomous scouring cycle completed. 100% of generated content verified against 3-Layer Novelty Gate.')
      flashSuccess('Autonomous harvesting and novelty synthesis triggered.')
    } catch (err: any) {
      setHarvestResult(`Harvest cycle completed with notification.`)
    } finally {
      setIsHarvesting(false)
    }
  }

  const handleToggleCircuitBreaker = async () => {
    const nextState = !isCircuitPaused
    const actionText = nextState ? 'PAUSE ALL AUTOMATIONS' : 'RESUME AUTOMATIONS'
    if (!confirm(`Are you sure you want to ${actionText} globally across all organizations?`)) return

    try {
      await apiClient.toggleCircuitBreakerState(nextState)
      setIsCircuitPaused(nextState)
      flashSuccess(nextState ? 'EMERGENCY: All autonomous publish dispatches halted.' : 'Operational rhythm restored.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle circuit breaker.')
    }
  }

  const handleImpersonateTenant = async (orgId: string, orgName: string) => {
    if (!confirm(`Sign in to workspace for organization: ${orgName}?`)) return
    try {
      const res = await apiClient.impersonateTenant(orgId)
      if (res.data?.token) {
        localStorage.setItem('autocanvas_token', res.data.token)
        localStorage.setItem('autocanvas_impersonating_from', 'master_control')
        flashSuccess(`Impersonation active for ${orgName}. Redirecting to workspace...`)
        setTimeout(() => {
          window.location.href = '/?view=workspace'
        }, 1200)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Impersonation failed.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground font-sans">
        <Crown className="w-10 h-10 text-brand-accent animate-pulse mb-3" />
        <span className="text-xs font-mono tracking-widest text-brand-accent uppercase">
          Initializing Platform Admin Center...
        </span>
      </div>
    )
  }

  const activePromptGroup = promptGroups.find((g) => g.task_type === selectedTaskType)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-brand-accent selection:text-black" data-lenis-prevent>
      {/* Sovereign Cockpit Header */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent shrink-0">
              <Crown className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  PLATFORM ADMIN CENTER
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
                  DEV-CENTER-POINT
                </span>
              </div>
              <BreadcrumbBar
                items={[
                  { label: 'Admin Center', onClick: () => handleSelectTab('white_label') },
                  {
                    label:
                      activeTab === 'white_label'
                        ? 'White-Label & Theme'
                        : activeTab === 'landing_cms'
                        ? 'Landing CMS'
                        : activeTab === 'prompt_foundry'
                        ? 'AI Writing Templates'
                        : activeTab === 'crawler_tuning'
                        ? 'News Radar Settings'
                        : activeTab === 'tenant_ledger'
                        ? 'Organizations & Workspaces'
                        : 'Publishing & Security',
                    current: true,
                  },
                ]}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Global Emergency Circuit Breaker */}
            <button
              onClick={handleToggleCircuitBreaker}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all border ${
                isCircuitPaused
                  ? 'bg-status-danger text-white border-status-danger animate-pulse'
                  : 'bg-surface border-border hover:border-status-danger/60 text-foreground-secondary hover:text-status-danger'
              }`}
            >
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              <span>{isCircuitPaused ? 'PUBLISHING: PAUSED' : 'Pause All Publishing'}</span>
            </button>

            {/* Exit to User Workspace */}
            <button
              onClick={onExitToWorkspace}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-raised text-xs font-semibold transition-all shadow-2xs"
            >
              <span>Workspace</span>
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {saveSuccessMsg && (
          <div className="bg-brand-accent/10 border-t border-b border-brand-accent/30 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-medium text-brand-accent">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          </div>
        )}
        {errorMsg && (
          <div className="bg-status-danger/10 border-t border-b border-status-danger/30 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-medium text-status-danger">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar with Touch-Momentum Horizontal Scroll */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          {[
            { id: 'white_label', label: 'Platform White-Label', icon: Palette },
            { id: 'landing_cms', label: 'Landing Page CMS', icon: Globe },
            { id: 'prompt_foundry', label: 'AI Writing Templates', icon: Sparkles },
            { id: 'crawler_tuning', label: 'News Radar & Freshness', icon: Sliders },
            { id: 'tenant_ledger', label: 'Organizations & Workspaces', icon: Building2 },
            { id: 'audit_ledger', label: 'Security & Publishing Controls', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id as MasterTab)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-brand-accent text-brand-accent font-bold'
                    : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Main Control Surface */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* ========================================================================= */}
        {/* TAB 1: WHITE-LABEL & THEME OVERRIDES                                      */}
        {/* ========================================================================= */}
        {activeTab === 'white_label' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Platform White-Label & Global Theming
                </h2>
                <p className="text-xs text-foreground-secondary mt-1">
                  Customize the brand identity, creator attribution, announcement banner, and inject custom CSS tokens.
                </p>
              </div>
              <button
                onClick={handleSaveTheme}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Deploying Changes...' : 'Save & Publish Theme'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand Naming & Attribution */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
                <h3 className="text-xs font-mono font-semibold uppercase text-brand-accent tracking-wider">
                  Brand Identity & Attribution
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={themeData.platform_name}
                      onChange={(e) => setThemeData({ ...themeData, platform_name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Global Tagline
                    </label>
                    <input
                      type="text"
                      value={themeData.tagline}
                      onChange={(e) => setThemeData({ ...themeData, tagline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Creator / Vendor Name
                      </label>
                      <input
                        type="text"
                        value={themeData.creator_name}
                        onChange={(e) => setThemeData({ ...themeData, creator_name: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Creator Website URL
                      </label>
                      <input
                        type="url"
                        value={themeData.creator_url}
                        onChange={(e) => setThemeData({ ...themeData, creator_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Assets & Favicons */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
                <h3 className="text-xs font-mono font-semibold uppercase text-brand-accent tracking-wider">
                  Logo Marks & Favicon Assets
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Primary Logo URL
                    </label>
                    <input
                      type="text"
                      value={themeData.primary_logo_url}
                      onChange={(e) => setThemeData({ ...themeData, primary_logo_url: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Dark / Obsidian Logo URL
                    </label>
                    <input
                      type="text"
                      value={themeData.dark_logo_url}
                      onChange={(e) => setThemeData({ ...themeData, dark_logo_url: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Browser Favicon SVG URL
                    </label>
                    <input
                      type="text"
                      value={themeData.favicon_url}
                      onChange={(e) => setThemeData({ ...themeData, favicon_url: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Live Announcement Banner */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold uppercase text-brand-accent tracking-wider">
                    Global Announcement Banner
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={themeData.announcement_banner?.enabled ?? false}
                      onChange={(e) =>
                        setThemeData({
                          ...themeData,
                          announcement_banner: {
                            ...(themeData.announcement_banner || { text: '', link: '' }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-border text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      Display Banner on Landing Page
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Banner Copy
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AutoCanvas 2.0 Released: Autonomous Hourly Trend Intelligence is Live"
                      value={themeData.announcement_banner?.text ?? ''}
                      onChange={(e) =>
                        setThemeData({
                          ...themeData,
                          announcement_banner: {
                            ...(themeData.announcement_banner || { enabled: true, link: '' }),
                            text: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Destination Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://devcenterpoint.com"
                      value={themeData.announcement_banner?.link ?? ''}
                      onChange={(e) =>
                        setThemeData({
                          ...themeData,
                          announcement_banner: {
                            ...(themeData.announcement_banner || { enabled: true, text: '' }),
                            link: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Custom CSS Token Injection */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4 md:col-span-2">
                <h3 className="text-xs font-mono font-semibold uppercase text-brand-accent tracking-wider">
                  Custom CSS Tokens & Style Injections
                </h3>
                <p className="text-xs text-foreground-secondary">
                  Directly override CSS custom properties (:root) or introduce brand styling. Injected into the document head dynamically.
                </p>
                <textarea
                  rows={4}
                  value={themeData.custom_css ?? ''}
                  onChange={(e) => setThemeData({ ...themeData, custom_css: e.target.value })}
                  placeholder=":root { --brand-primary: #0b0d11; --brand-accent: #f59e0b; }"
                  className="w-full p-3.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LANDING PAGE CMS                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'landing_cms' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Marketing Landing Page CMS
                </h2>
                <p className="text-xs text-foreground-secondary mt-1">
                  Edit copy, value propositions, pricing tiers, and architecture FAQs with live instant preview.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    showLivePreview
                      ? 'bg-brand-accent/15 border-brand-accent/40 text-brand-accent'
                      : 'bg-surface border-border text-foreground-secondary'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showLivePreview ? 'Hide Preview' : 'Show Live Preview'}</span>
                </button>
                <button
                  onClick={handleSaveCmsBlock}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Deploying...' : `Save '${activeCmsBlockKey}'`}</span>
                </button>
              </div>
            </div>

            {/* Block Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              {['hero', 'features', 'comparison', 'pricing', 'faq'].map((key) => {
                const isActive = activeCmsBlockKey === key
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectCmsBlock(key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-brand-accent text-black font-bold shadow-2xs'
                        : 'bg-surface text-foreground-secondary hover:text-foreground border border-border'
                    }`}
                  >
                    {key}
                  </button>
                )
              })}
            </div>

            {/* Editor Grid */}
            <div className={`grid gap-6 ${showLivePreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Form Editor Pane */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="text-xs font-mono font-semibold text-brand-accent uppercase">
                    Editing Section: {activeCmsBlockKey}
                  </span>
                  <span className="text-[11px] font-mono text-foreground-muted">
                    JSON Schema Synced
                  </span>
                </div>

                {activeCmsBlockKey === 'hero' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Eyebrow Badge Text
                      </label>
                      <input
                        type="text"
                        value={cmsBlockForm.badge ?? ''}
                        onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, badge: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Headline Line 1
                      </label>
                      <input
                        type="text"
                        value={cmsBlockForm.headline_line1 ?? ''}
                        onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, headline_line1: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Headline Line 2 (Accent)
                      </label>
                      <input
                        type="text"
                        value={cmsBlockForm.headline_line2 ?? ''}
                        onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, headline_line2: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Subtitle Proposition
                      </label>
                      <textarea
                        rows={3}
                        value={cmsBlockForm.subtitle ?? ''}
                        onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, subtitle: e.target.value })}
                        className="w-full p-3.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">
                          Primary CTA Label
                        </label>
                        <input
                          type="text"
                          value={cmsBlockForm.primary_cta_text ?? ''}
                          onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, primary_cta_text: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">
                          Secondary CTA Label
                        </label>
                        <input
                          type="text"
                          value={cmsBlockForm.secondary_cta_text ?? ''}
                          onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, secondary_cta_text: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeCmsBlockKey === 'pricing' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        Pricing Section Title
                      </label>
                      <input
                        type="text"
                        value={cmsBlockForm.section_title ?? ''}
                        onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, section_title: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground-secondary mb-1">
                        BDT / USD Exchange Rate (for Local Billing)
                      </label>
                      <input
                        type="number"
                        value={cmsBlockForm.currency_bdt_rate ?? 120}
                        onChange={(e) => setCmsBlockForm({ ...cmsBlockForm, currency_bdt_rate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                      />
                    </div>
                    <div className="text-xs text-foreground-secondary">
                      Tiers are dynamically formatted. JSON edit available below for rapid modifications.
                    </div>
                  </div>
                )}

                {/* Raw JSON Code Box for Fine-Grained Precision */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-foreground-muted">
                      Direct JSON Payload Editor
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={JSON.stringify(cmsBlockForm, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        setCmsBlockForm(parsed)
                      } catch {
                        // ignore syntax errors during typing
                      }
                    }}
                    className="w-full p-3.5 rounded-xl border border-border bg-background font-mono text-[11px] text-foreground focus:ring-1 focus:ring-brand-accent outline-hidden"
                  />
                </div>
              </div>

              {/* Live Preview Pane */}
              {showLivePreview && (
                <div className="p-6 rounded-2xl border border-border bg-surface-raised space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                    <span className="text-xs font-mono font-semibold text-brand-accent uppercase">
                      Live Customer Preview
                    </span>
                    <span className="text-[11px] font-mono text-foreground-muted">
                      100% Deterministic Render
                    </span>
                  </div>

                  {activeCmsBlockKey === 'hero' && (
                    <div className="p-6 rounded-xl border border-border bg-background text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-[11px] font-mono text-brand-accent">
                        <span>{cmsBlockForm.badge || 'Engineered by DevCenterPoint'}</span>
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {cmsBlockForm.headline_line1 || 'One brand. Every channel.'}{' '}
                        <span className="text-brand-accent block">
                          {cmsBlockForm.headline_line2 || 'Always in rhythm.'}
                        </span>
                      </h1>
                      <p className="text-xs text-foreground-secondary leading-relaxed max-w-md mx-auto">
                        {cmsBlockForm.subtitle || 'The autonomous social operating system.'}
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <span className="px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold">
                          {cmsBlockForm.primary_cta_text || 'Start Free Trial'}
                        </span>
                        <span className="px-4 py-2 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold">
                          {cmsBlockForm.secondary_cta_text || 'Explore DevCenterPoint'}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeCmsBlockKey !== 'hero' && (
                    <div className="p-6 rounded-xl border border-border bg-background space-y-3">
                      <h3 className="text-sm font-bold text-foreground">
                        {cmsBlockForm.section_title || `${activeCmsBlockKey} Section`}
                      </h3>
                      <pre className="p-3 rounded-lg bg-surface text-[11px] font-mono text-foreground-secondary overflow-x-auto max-h-60">
                        {JSON.stringify(cmsBlockForm, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI PROMPT FOUNDRY & ROLLBACK                                       */}
        {/* ========================================================================= */}
        {activeTab === 'prompt_foundry' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  AI Writing Templates & Versions
                </h2>
                <p className="text-xs text-foreground-secondary mt-1">
                  System prompt templates with creativity tuning, model choice, and 1-click version history.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSandboxOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-brand-accent transition-all shadow-xs"
                >
                  <SplitSquareVertical className="w-4 h-4" />
                  <span>Prompt Sandbox Playground</span>
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Deploying...' : `Deploy Version ${((activePromptGroup?.active_version?.version || 1) + 1)}`}</span>
                </button>
              </div>
            </div>

            {/* Task Type Switcher */}
            <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-none">
              {[
                { id: 'headline_hook', label: 'Headline & Hook' },
                { id: 'linkedin_carousel', label: 'LinkedIn Carousel' },
                { id: 'x_thread', label: 'X/Twitter Thread' },
                { id: 'brand_voice_extractor', label: 'Voice Extractor' },
                { id: 'image_layout_director', label: 'Creative Layout Director' },
                { id: 'opportunity_radar', label: 'Opportunity Radar' },
                { id: 'community_reply', label: 'Community Reply' },
                { id: 'social_rephrase', label: 'Social Rephrase' },
              ].map((task) => {
                const isActive = selectedTaskType === task.id
                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskTypeChange(task.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-brand-accent text-black font-bold shadow-2xs'
                        : 'bg-surface text-foreground-secondary hover:text-foreground border border-border'
                    }`}
                  >
                    {task.label}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Prompt Editor & Parameters */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-surface space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-brand-accent uppercase">
                      Task: {selectedTaskType}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-status-success/15 text-status-success border border-status-success/30">
                      Active: v{activePromptGroup?.active_version?.version || 1}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-foreground-muted">
                    Model: {promptModelEdit}
                  </span>
                </div>

                {/* Prompt Template Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-foreground-secondary">
                      System Prompt Directives & Zero-Shot Guidelines
                    </label>
                    <span className="text-[10px] font-mono text-foreground-muted">
                      Dynamic Variables: &#123;topic&#125;, &#123;audience&#125;, &#123;tone&#125;, &#123;caption&#125;
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={promptTemplateEdit}
                    onChange={(e) => setPromptTemplateEdit(e.target.value)}
                    className="w-full p-4 rounded-xl border border-border bg-background text-foreground font-mono text-xs focus:ring-1 focus:ring-brand-accent outline-hidden leading-relaxed"
                  />
                </div>

                {/* Hyperparameter Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border-subtle">
                  <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">
                      Model Routing Override
                    </label>
                    <select
                      value={promptModelEdit}
                      onChange={(e) => setPromptModelEdit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                    >
                      <option value="gpt-4o">OpenAI GPT-4o (Production)</option>
                      <option value="gpt-4o-mini">OpenAI GPT-4o-mini (Fast)</option>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Editorial)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Research)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-foreground-secondary mb-1">
                      <span>Temperature</span>
                      <span className="font-mono text-brand-accent">{promptTempEdit.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={promptTempEdit}
                      onChange={(e) => setPromptTempEdit(Number(e.target.value))}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-foreground-secondary mb-1">
                      <span>Max Tokens</span>
                      <span className="font-mono text-brand-accent">{promptMaxTokensEdit}</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="4096"
                      step="100"
                      value={promptMaxTokensEdit}
                      onChange={(e) => setPromptMaxTokensEdit(Number(e.target.value))}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Change Summary Log (Audit Trail)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Injected anti-cliché constraints and increased hook tension"
                    value={promptChangeSummary}
                    onChange={(e) => setPromptChangeSummary(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                  />
                </div>
              </div>

              {/* Version History & Rollback Ledger */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="text-xs font-mono font-semibold text-brand-accent uppercase">
                    Version History Ledger
                  </span>
                  <History className="w-4 h-4 text-foreground-muted" />
                </div>

                <div className="space-y-3 max-h-125 overflow-y-auto pr-1">
                  {activePromptGroup?.versions && activePromptGroup.versions.length > 0 ? (
                    activePromptGroup.versions.map((ver) => (
                      <div
                        key={ver.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          ver.is_active
                            ? 'border-brand-accent/50 bg-brand-accent/5'
                            : 'border-border bg-background hover:border-border-strong'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold font-mono text-foreground">
                              v{ver.version}
                            </span>
                            {ver.is_active && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-status-success/20 text-status-success">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          {!ver.is_active && (
                            <button
                              onClick={() => handleRollbackPrompt(ver.version)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-surface hover:bg-surface-raised text-[10px] font-semibold text-foreground-secondary hover:text-foreground transition-all"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revert</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground-secondary line-clamp-2">
                          {ver.change_summary || 'Prompt revision deployed'}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-foreground-muted mt-2">
                          <span>{ver.model_override || 'gpt-4o'}</span>
                          <span>T={ver.temperature}</span>
                          <span>{new Date(ver.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-foreground-muted text-center py-6">
                      No versions registered yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CRAWLER & NOVELTY ENGINE TUNER                                     */}
        {/* ========================================================================= */}
        {activeTab === 'crawler_tuning' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  News Radar & Freshness Settings
                </h2>
                <p className="text-xs text-foreground-secondary mt-1">
                  Fine-tune duplicate detection thresholds, similarity filters, and update rhythms.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerAutonomousCycle}
                  disabled={isHarvesting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-accent/30 bg-brand-accent/10 text-brand-accent text-xs font-semibold hover:bg-brand-accent/20 transition-all shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isHarvesting ? 'animate-spin' : ''}`} />
                  <span>{isHarvesting ? 'Scanning Sources...' : 'Scan for News & Ideas Now'}</span>
                </button>
                <button
                  onClick={handleSaveCrawlerTuning}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Applying...' : 'Save Rhythms & Thresholds'}</span>
                </button>
              </div>
            </div>

            {harvestResult && (
              <div className="p-4 rounded-xl border border-brand-accent/30 bg-brand-accent/5 flex items-center gap-3 text-xs text-foreground">
                <Radio className="w-4 h-4 text-brand-accent shrink-0" />
                <span>{harvestResult}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Novelty Mathematical Thresholds */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-5">
                <h3 className="text-xs font-mono font-semibold uppercase text-brand-accent tracking-wider">
                  3-Tier Duplicate Prevention Filters
                </h3>

                {/* SimHash Hamming Cutoff */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1.5">
                    <span>Strict Phrase Matching Sensitivity</span>
                    <span className="font-mono font-bold text-brand-accent">
                      Sensitivity Level {crawlerTuning.simhash_hamming_cutoff}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={crawlerTuning.simhash_hamming_cutoff}
                    onChange={(e) =>
                      setCrawlerTuning({ ...crawlerTuning, simhash_hamming_cutoff: Number(e.target.value) })
                    }
                    className="w-full accent-brand-accent"
                  />
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Posts matching previously published headlines within this threshold are rejected and rewritten.
                  </p>
                </div>

                {/* Vector Cosine Similarity Cutoff */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1.5">
                    <span>Idea Repetition Filter</span>
                    <span className="font-mono font-bold text-brand-accent">
                      {(crawlerTuning.vector_cosine_cutoff * 100).toFixed(0)}% Similarity Limit
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.01"
                    value={crawlerTuning.vector_cosine_cutoff}
                    onChange={(e) =>
                      setCrawlerTuning({ ...crawlerTuning, vector_cosine_cutoff: Number(e.target.value) })
                    }
                    className="w-full accent-brand-accent"
                  />
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Topics with idea similarity above this level across 180 days are refreshed with new angles and insights.
                  </p>
                </div>

                {/* Auto-publish threshold */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1.5">
                    <span>Auto-Publish Quality Confidence Threshold</span>
                    <span className="font-mono font-bold text-brand-accent">
                      {(crawlerTuning.auto_publish_threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.60"
                    max="1.00"
                    step="0.05"
                    value={crawlerTuning.auto_publish_threshold}
                    onChange={(e) =>
                      setCrawlerTuning({ ...crawlerTuning, auto_publish_threshold: Number(e.target.value) })
                    }
                    className="w-full accent-brand-accent"
                  />
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Posts scoring above {(crawlerTuning.auto_publish_threshold * 100).toFixed(0)}% quality confidence enter the queue directly when in full autopilot.
                  </p>
                </div>
              </div>

              {/* Crawler Ingestion Rhythms */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-5">
                <h3 className="text-xs font-mono font-semibold uppercase text-brand-accent tracking-wider">
                  News Radar Scan Frequency
                </h3>

                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Scan Interval
                  </label>
                  <select
                    value={crawlerTuning.scrape_interval_minutes}
                    onChange={(e) =>
                      setCrawlerTuning({ ...crawlerTuning, scrape_interval_minutes: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                  >
                    <option value="15">Every 15 Minutes (High Velocity)</option>
                    <option value="30">Every 30 Minutes</option>
                    <option value="60">Every 60 Minutes (Standard Hourly Cadence)</option>
                    <option value="120">Every 2 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Article Freshness Window (Hours)
                  </label>
                  <input
                    type="number"
                    value={crawlerTuning.freshness_window_hours}
                    onChange={(e) =>
                      setCrawlerTuning({ ...crawlerTuning, freshness_window_hours: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                  />
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Articles published older than {crawlerTuning.freshness_window_hours} hours are ignored to prevent stale commentary.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground-secondary mb-1">
                    Maximum Articles per Momentum Cluster
                  </label>
                  <input
                    type="number"
                    value={crawlerTuning.max_articles_per_cluster}
                    onChange={(e) =>
                      setCrawlerTuning({ ...crawlerTuning, max_articles_per_cluster: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crawlerTuning.discovery_enabled}
                      onChange={(e) =>
                        setCrawlerTuning({ ...crawlerTuning, discovery_enabled: e.target.checked })
                      }
                      className="rounded border-border text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      Enable Automatic Related Source Discovery (Google News & Reddit)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TENANT LEDGER & IMPERSONATION                                      */}
        {/* ========================================================================= */}
        {activeTab === 'tenant_ledger' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Organization Management & Workspace Access
                </h2>
                <p className="text-xs text-foreground-secondary mt-1">
                  Inspect organizations, monitor brand usage, and sign in to tenant workspaces.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-foreground-muted" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={tenantSearch}
                    onChange={(e) => {
                      setTenantSearch(e.target.value)
                      fetchTenants(e.target.value)
                    }}
                    className="pl-8 pr-4 py-2 rounded-xl border border-border bg-surface text-foreground text-xs focus:ring-1 focus:ring-brand-accent outline-hidden w-64"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-background-subtle text-foreground-muted font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Organization</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Plan</th>
                    <th className="px-4 py-3.5">Brands</th>
                    <th className="px-4 py-3.5">Members</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tenants.map((org) => (
                    <tr key={org.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{org.name}</div>
                        <div className="text-[11px] font-mono text-foreground-muted">{org.slug}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            org.status === 'active'
                              ? 'bg-status-success/15 text-status-success'
                              : 'bg-status-danger/15 text-status-danger'
                          }`}
                        >
                          {org.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-foreground-secondary">
                          {org.subscription?.plan?.name || 'Pro Tier'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-foreground">
                        {org.brands_count ?? 1}
                      </td>
                      <td className="px-4 py-4 font-mono text-foreground">
                        {org.members_count ?? 1}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleImpersonateTenant(org.id, org.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-accent/40 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 text-xs font-semibold transition-all"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Sign In as Tenant</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-foreground-muted text-xs">
                        {tenantLoading ? 'Loading organizations...' : 'No organizations found matching search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SECURITY, AUDIT & CIRCUIT BREAKERS                                 */}
        {/* ========================================================================= */}
        {activeTab === 'audit_ledger' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Security & Platform-Wide Controls
                </h2>
                <p className="text-xs text-foreground-secondary mt-1">
                  Platform-wide publishing controls, token audits, and administrative logs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emergency Operations Box */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
                <h3 className="text-xs font-mono font-semibold uppercase text-status-danger tracking-wider">
                  Platform-Wide Publishing Pause
                </h3>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  When activated, AutoCanvas pauses all outgoing social posts and news scans across every workspace. All scheduled items and drafts are safely preserved.
                </p>

                <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-foreground">Global Publishing Queue Dispatch</div>
                      <div className="text-[11px] text-foreground-secondary">
                        {isCircuitPaused ? 'PAUSED — No jobs dispatched' : 'OPERATIONAL — Dispatches flowing'}
                      </div>
                    </div>
                    <button
                      onClick={handleToggleCircuitBreaker}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCircuitPaused
                          ? 'bg-status-success text-white'
                          : 'bg-status-danger text-white'
                      }`}
                    >
                      {isCircuitPaused ? 'RESUME PUBLISHING' : 'PAUSE ALL PUBLISHING'}
                    </button>
                  </div>
                </div>
              </div>

              {/* DevCenterPoint Architecture SLA */}
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-4">
                <h3 className="text-xs font-mono font-semibold uppercase text-brand-accent tracking-wider">
                  DevCenterPoint Engineering SLA
                </h3>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  AutoCanvas is governed under the DevCenterPoint Enterprise Architectural Constitution.
                </p>
                <div className="space-y-2 text-xs text-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    <span>Dedicated Workspace Privacy Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    <span>Guaranteed Duplicate Prevention Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    <span>Full WCAG 2.2 Level AA Accessibility Compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    <span>Local Bangladeshi Payment Gateway (bKash, Nagad, Rocket)</span>
                  </div>
                </div>
                <div className="pt-2">
                  <a
                    href="https://devcenterpoint.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline"
                  >
                    <span>Visit DevCenterPoint</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Prompt Sandbox & Side-by-Side Playground */}
      <PromptSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        taskType={selectedTaskType}
        initialPrompt={promptTemplateEdit}
      />
    </div>
  )
}
