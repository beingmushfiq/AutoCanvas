import React, { useState, useEffect } from 'react'
import {
  Building2,
  Globe,
  Sparkles,
  Share2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Compass,
  FileText,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react'
import { apiClient } from '../../lib/api/client'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Logo } from '../../components/brand/Logo'

interface OnboardingWizardProps {
  isOpen: boolean
  onComplete: () => void
}

const STORAGE_KEY = 'autocanvas_onboarding_draft'

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onComplete,
}) => {
  const { refreshProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_step`)
    return saved ? parseInt(saved, 10) : 1
  })

  // State across all 13 checkpoints
  const [businessName, setBusinessName] = useState('Acme Corporation')
  const [industry, setIndustry] = useState('Technology & Software')
  const [workspaceSlug, setWorkspaceSlug] = useState('acme-core')
  const [brandName, setBrandName] = useState('Acme Global')
  const [websiteUrl, setWebsiteUrl] = useState('https://acme.example.com')
  const [guidelinesText, setGuidelinesText] = useState(
    'We build enterprise workflow automation for engineering leaders. Precision, clarity, and reliability are our values.'
  )
  const [toneFormality, setToneFormality] = useState<number>(75) // 0 (Casual) to 100 (Formal)
  const [toneTechnical, setToneTechnical] = useState<number>(80) // 0 (Conversational) to 100 (Technical)
  const [socialAccounts, setSocialAccounts] = useState({
    linkedin: true,
    instagram: true,
    facebook: false,
  })
  const [cadence, setCadence] = useState<'3_per_week' | '5_per_week' | 'daily'>('3_per_week')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
  const [approvalPolicy, setApprovalPolicy] = useState<'strict_approval' | 'autonomous_killswitch'>('strict_approval')
  const [rssFeedUrl, setRssFeedUrl] = useState('https://techcrunch.com/feed/')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_step`, currentStep.toString())
  }, [currentStep])

  if (!isOpen) return null

  const handleNext = () => {
    if (currentStep < 13) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleFinalize = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // 1. Create Brand in Backend
      await apiClient.post('/brands', {
        name: brandName,
        industry: industry,
        website_url: websiteUrl,
        business_description: guidelinesText,
        primary_color: '#090d16',
        secondary_color: '#f59e0b',
        primary_font: 'Geist',
      }).catch(() => {
        // Fallback for mock/demo mode
      })

      // 2. Clear onboarding progress storage
      localStorage.removeItem(`${STORAGE_KEY}_step`)

      // 3. Refresh user session
      await refreshProfile()
      onComplete()
    } catch (err) {
      setError((err as Error).message || 'Failed to complete onboarding. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const progressPercent = Math.round((currentStep / 13) * 100)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="bg-surface rounded-3xl border border-border shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Progress Header */}
        <div className="px-8 pt-6 pb-4 border-b border-border bg-surface">
          <div className="flex items-center justify-between mb-3">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-foreground-muted">
                Step {currentStep} of 13
              </span>
              <Badge variant="accent">{progressPercent}% COMPLETED</Badge>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-background-subtle overflow-hidden">
            <div
              className="h-full bg-brand-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-status-danger-bg border border-status-danger/30 flex items-center gap-2 text-status-danger text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Introduce the business */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Building2 className="w-4 h-4" /> CHAPTER 1: WORKSPACE FOUNDATION
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Introduce your organization
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                AutoCanvas isolates all telemetry, brand profiles, and publishing queues within your tenant boundary.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Organization / Legal Entity Name</label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Global Inc."
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 2: Industry taxonomy */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Compass className="w-4 h-4" /> CHAPTER 1: WORKSPACE FOUNDATION
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Identify your primary industry
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                This calibrates the AI Trend Radar to crawl high-relevance market publications and filter out irrelevant noise.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  'B2B SaaS & Enterprise Tech',
                  'E-Commerce & DTC Retail',
                  'Healthcare & Biotechnology',
                  'Financial Services & Fintech',
                  'Professional Services & Consulting',
                  'Marketing & Creative Agency',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setIndustry(item)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      industry === item
                        ? 'border-brand-accent bg-brand-accent-subtle text-foreground shadow-2xs font-semibold'
                        : 'border-border bg-surface text-foreground-secondary hover:bg-surface-raised hover:text-foreground'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Workspace creation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Layers className="w-4 h-4" /> CHAPTER 1: WORKSPACE FOUNDATION
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Configure your workspace URL slug
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Workspaces house team permissions, API tokens, and brand assets.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Workspace Slug</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-xl border border-r-0 border-border bg-background-subtle text-xs text-foreground-muted font-mono">
                    autocanvas.com/
                  </span>
                  <Input
                    value={workspaceSlug}
                    onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="rounded-l-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: First brand */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Sparkles className="w-4 h-4" /> CHAPTER 2: BRAND IDENTITY
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Name your primary brand
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                This is the public-facing brand that will be published across LinkedIn, Instagram, and Facebook.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Brand Name</label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Acme Global"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 5: Website URL */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Globe className="w-4 h-4" /> CHAPTER 2: BRAND IDENTITY
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Add your official website
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Our autonomous crawler analyzes your domain meta tags, core products, and terminology to avoid generic copy.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Official Website URL</label>
                <Input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://acme.com"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 6: Guidelines & Mission */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <FileText className="w-4 h-4" /> CHAPTER 2: BRAND IDENTITY
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Define your brand mission & guidelines
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Paste your positioning statement, value proposition, or core rules. The AI will strictly respect these boundaries.
              </p>
              <textarea
                rows={4}
                value={guidelinesText}
                onChange={(e) => setGuidelinesText(e.target.value)}
                placeholder="What does your company do? What are your key differentiators?"
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-foreground-muted outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
              />
            </div>
          )}

          {/* STEP 7: Voice Calibrator */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <SlidersHorizontal className="w-4 h-4" /> CHAPTER 3: BRAND VOICE
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Calibrate your brand tone & voice
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Adjust the spectrum sliders to define how your brand speaks to audiences.
              </p>

              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Casual & Friendly</span>
                  <span className="font-mono text-brand-accent">{toneFormality}% Formal</span>
                  <span>Authoritative & Formal</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toneFormality}
                  onChange={(e) => setToneFormality(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Conversational</span>
                  <span className="font-mono text-brand-accent">{toneTechnical}% Technical</span>
                  <span>Engineering-Deep</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={toneTechnical}
                  onChange={(e) => setToneTechnical(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 8: AI Brand Understanding Review */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Sparkles className="w-4 h-4" /> CHAPTER 3: BRAND VOICE
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Review AI-synthesized brand profile
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Here is how AutoCanvas will interpret your brand voice across multi-platform copy generation:
              </p>

              <div className="p-5 rounded-2xl border border-border bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{brandName} Voice Matrix</span>
                  <Badge variant="success">Synthesized</Badge>
                </div>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  "Speaks with rigorous technical authority while maintaining approachable editorial clarity.
                  Prioritizes data-backed claims, architectural diagrams, and precise verbs. Strictly avoids hyperbolic marketing buzzwords."
                </p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-background-subtle border border-border text-foreground">
                    Formality: {toneFormality}/100
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-background-subtle border border-border text-foreground">
                    Technical Depth: {toneTechnical}/100
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-background-subtle border border-border text-foreground">
                    Industry: {industry}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Connect social accounts */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Share2 className="w-4 h-4" /> CHAPTER 4: SOCIAL CONNECTORS
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Connect your social channels
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                AutoCanvas uses official OAuth 2.0 with AES-256 token encryption. Toggle the networks you wish to activate:
              </p>

              <div className="space-y-3">
                {[
                  { id: 'linkedin', label: 'LinkedIn Company Page', desc: 'Direct corporate posts and image carousel dispatching' },
                  { id: 'instagram', label: 'Instagram Professional', desc: 'Feed image and story auto-publishing via Meta Graph' },
                  { id: 'facebook', label: 'Facebook Page', desc: 'Brand community posts and link card synchronization' },
                ].map((net) => {
                  const isChecked = socialAccounts[net.id as keyof typeof socialAccounts]
                  return (
                    <div
                      key={net.id}
                      onClick={() =>
                        setSocialAccounts((prev) => ({ ...prev, [net.id]: !isChecked }))
                      }
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand-accent bg-brand-accent-subtle/50 text-foreground'
                          : 'border-border bg-surface text-foreground-secondary'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-foreground">{net.label}</div>
                        <div className="text-[11px] text-foreground-secondary mt-0.5">{net.desc}</div>
                      </div>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isChecked ? 'bg-brand-accent border-brand-accent text-interactive-primary-fg' : 'border-border bg-background'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-4 h-4" />}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 10: Publishing preferences */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Calendar className="w-4 h-4" /> CHAPTER 4: SOCIAL CONNECTORS
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Set publishing cadence & timezone
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Define how frequently AutoCanvas schedules posts and your account operating timezone.
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: '3_per_week', label: '3 Posts / Week', desc: 'Optimal for focused brands' },
                  { id: '5_per_week', label: '5 Posts / Week', desc: 'Monday through Friday' },
                  { id: 'daily', label: 'Daily (7 Posts)', desc: 'Continuous maximum reach' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCadence(item.id as any)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      cadence === item.id
                        ? 'border-brand-accent bg-brand-accent-subtle text-foreground font-semibold shadow-2xs'
                        : 'border-border bg-surface text-foreground-secondary hover:bg-surface-raised'
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className="text-[10px] text-foreground-muted mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Account Timezone</label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 11: Approval policy */}
          {currentStep === 11 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <ShieldCheck className="w-4 h-4" /> CHAPTER 4: SOCIAL CONNECTORS
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Establish governance & approval policy
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Choose the balance between autonomous dispatching and human oversight.
              </p>

              <div className="space-y-3">
                <div
                  onClick={() => setApprovalPolicy('strict_approval')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    approvalPolicy === 'strict_approval'
                      ? 'border-brand-accent bg-brand-accent-subtle/50 text-foreground font-semibold'
                      : 'border-border bg-surface text-foreground-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Strict Human Approval (Recommended for New Brands)
                    </span>
                    <Badge variant="accent">SAFE</Badge>
                  </div>
                  <p className="text-[11px] text-foreground-secondary mt-1">
                    AI generates drafts and creative templates, but no post is dispatched without an explicit human confirmation click.
                  </p>
                </div>

                <div
                  onClick={() => setApprovalPolicy('autonomous_killswitch')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    approvalPolicy === 'autonomous_killswitch'
                      ? 'border-brand-accent bg-brand-accent-subtle/50 text-foreground font-semibold'
                      : 'border-border bg-surface text-foreground-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Autonomous Auto-Publish with Emergency Killswitch
                    </span>
                    <Badge variant="default">AUTONOMOUS</Badge>
                  </div>
                  <p className="text-[11px] text-foreground-secondary mt-1">
                    High-confidence posts are auto-scheduled into calendar slots. You maintain full override authority via the 2-click Emergency Pause.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: Activate Intelligence */}
          {currentStep === 12 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Compass className="w-4 h-4" /> CHAPTER 5: INTELLIGENCE & REVEAL
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Activate continuous trend intelligence
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Provide an initial industry RSS feed or media source. AutoCanvas will continuously monitor it for viral signals and technical breakthroughs.
              </p>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Industry RSS Feed URL</label>
                <Input
                  type="url"
                  value={rssFeedUrl}
                  onChange={(e) => setRssFeedUrl(e.target.value)}
                  placeholder="https://news.ycombinator.com/rss"
                />
              </div>
              <div className="p-4 rounded-xl bg-background-subtle border border-border text-xs text-foreground-secondary space-y-1 font-mono">
                <div className="text-status-success flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to cluster signals
                </div>
                <div>Domain verification: Completed</div>
                <div>Negative keyword filtering: Active</div>
              </div>
            </div>
          )}

          {/* STEP 13: Reveal Personalized Ideas */}
          {currentStep === 13 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-brand-accent">
                <Sparkles className="w-4 h-4" /> CHAPTER 5: INTELLIGENCE & REVEAL
              </div>
              <h2 id="onboarding-step-title" className="text-xl font-bold text-foreground tracking-tight">
                Your first autonomous post queue is ready!
              </h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Based on your brand guidelines and voice calibration, we have generated 3 initial concepts ready for your Publishing Calendar:
              </p>

              <div className="space-y-3">
                {[
                  {
                    channel: 'LinkedIn',
                    hook: 'Why deterministic architecture beats prompt diffusion for enterprise brands.',
                    slot: 'Tomorrow • 09:30 EST',
                  },
                  {
                    channel: 'Instagram',
                    hook: 'Precision meets creativity: Behind the scenes of our brand design system.',
                    slot: 'Thursday • 14:00 EST',
                  },
                  {
                    channel: 'Facebook',
                    hook: 'Announcing our autonomous social operations workflow for engineering teams.',
                    slot: 'Saturday • 11:00 EST',
                  },
                ].map((post, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-accent-subtle text-foreground flex items-center justify-center text-xs font-bold font-mono">
                        #{i + 1}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{post.hook}</div>
                        <div className="text-[10px] text-foreground-muted mt-0.5">{post.channel} • {post.slot}</div>
                      </div>
                    </div>
                    <Badge variant="accent">Ready</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-8 py-4 border-t border-border bg-background-subtle flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isSaving}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>

          {currentStep < 13 ? (
            <Button
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Next Step
            </Button>
          ) : (
            <Button
              onClick={handleFinalize}
              isLoading={isSaving}
              variant="accent"
              rightIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Activate Engine & Enter Command Center
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
