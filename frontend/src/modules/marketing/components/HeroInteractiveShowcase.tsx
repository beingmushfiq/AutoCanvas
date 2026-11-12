import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle2,
  Sparkles,
  Layers,
  Share2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { SPRINGS } from '../../../lib/motion/tokens'

type AspectRatio = '1:1' | '16:9' | '9:16'
type BrandPreset = 'editorial' | 'minimal' | 'kinetic'

export const HeroInteractiveShowcase: React.FC = () => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [preset, setPreset] = useState<BrandPreset>('editorial')
  const [simulatedDispatch, setSimulatedDispatch] = useState(false)
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null)

  const handleSimulate = () => {
    if (simulatedDispatch) return
    setSimulatedDispatch(true)
    setDispatchStatus('Acquiring distributed Redis idempotency lock...')

    setTimeout(() => {
      setDispatchStatus('Verifying cryptographic token signatures (Meta & LinkedIn)...')
    }, 700)

    setTimeout(() => {
      setDispatchStatus('Published idempotently to 3 channels (0 duplicate risk)')
      setTimeout(() => {
        setSimulatedDispatch(false)
        setDispatchStatus(null)
      }, 3000)
    }, 1800)
  }

  const presetStyles = {
    editorial: {
      headline: 'Architecting Brand Velocity at Scale',
      subtitle: 'Deterministic creative generation meets continuous social operations.',
      tag: 'STRATEGIC INSIGHT',
      accentColor: 'text-brand-accent',
      badgeBg: 'bg-brand-accent/15 text-brand-accent border-brand-accent/30',
      canvasBg: 'bg-linear-to-br from-surface to-background-subtle',
    },
    minimal: {
      headline: 'The Autonomous Social Operating System',
      subtitle: 'Multi-tenant brand isolation with cryptographically verified publishing.',
      tag: 'ENTERPRISE TECH',
      accentColor: 'text-foreground',
      badgeBg: 'bg-surface-raised text-foreground border-border',
      canvasBg: 'bg-surface',
    },
    kinetic: {
      headline: 'One Master Brand. Every Social Channel.',
      subtitle: 'Original industry news ingestion, deterministic layout, and 0% mock results.',
      tag: 'REAL-TIME RADAR',
      accentColor: 'text-brand-accent',
      badgeBg: 'bg-brand-accent/20 text-brand-accent border-brand-accent/40',
      canvasBg: 'bg-linear-to-tr from-surface-raised to-background',
    },
  }[preset]

  return (
    <div className="relative mt-14 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Ambient Radial Luminous Aura */}
      <div
        className="absolute -inset-4 sm:-inset-8 rounded-3xl opacity-30 dark:opacity-20 blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: 'radial-gradient(ellipse at center, var(--brand-accent) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Floating Micro-Badge Top Left: Real-Time Intelligence */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden lg:flex absolute -top-5 -left-4 z-20 items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface/90 backdrop-blur-md shadow-lg text-xs font-medium text-foreground select-none"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
        </span>
        <TrendingUp className="w-3.5 h-3.5 text-status-success" />
        <span className="font-mono text-[11px]">Trend Radar: +340% Audience Surge</span>
      </motion.div>

      {/* Floating Micro-Badge Bottom Right: Zero Duplicate Lock */}
      <motion.div
        animate={{ y: [4, -4, 4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden lg:flex absolute -bottom-5 -right-4 z-20 items-center gap-2 px-3.5 py-2 rounded-xl border border-brand-accent/30 bg-surface/90 backdrop-blur-md shadow-lg text-xs font-medium text-foreground select-none"
      >
        <ShieldCheck className="w-4 h-4 text-brand-accent" />
        <span className="font-mono text-[11px] text-foreground-secondary">
          Idempotency Active · <strong className="text-foreground">0 Duplicate Dispatches</strong>
        </span>
      </motion.div>

      {/* Main Studio Interactive Deck Frame */}
      <div className="relative z-10 rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden transition-all duration-300">
        {/* Browser / Deck Titlebar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-border bg-background-subtle/80 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-border-strong/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-border-strong/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-border-strong/60" />
            </div>
            <span className="h-3.5 w-px bg-border" />
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-foreground-secondary">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
              <span className="hidden sm:inline">AutoCanvas Production Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                LIVE DEMO ENGINE
              </span>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="flex items-center gap-2 text-xs">
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center p-0.5 rounded-lg border border-border bg-surface">
              {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-interactive-primary text-interactive-primary-fg font-semibold shadow-2xs'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                  aria-label={`Aspect ratio ${ratio}`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Brand Preset Switcher */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg border border-border bg-surface">
              {(['editorial', 'minimal', 'kinetic'] as BrandPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-all cursor-pointer ${
                    preset === p
                      ? 'bg-brand-accent text-interactive-primary-fg font-semibold shadow-2xs'
                      : 'text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deck Core Workspace Grid */}
        <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Canvas Preview Area */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-8 rounded-xl border border-border/80 bg-background-sunken/40 relative min-h-80 sm:min-h-95 overflow-hidden">
            {/* Dimensions Overlay */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-foreground-muted flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-brand-accent" />
              <span>
                {aspectRatio === '1:1' ? '1080 × 1080 px (Square)' : aspectRatio === '16:9' ? '1920 × 1080 px (Landscape)' : '1080 × 1920 px (Story)'}
              </span>
            </div>

            {/* Simulated Live Deterministic Render Canvas with Motion */}
            <motion.div
              layout
              transition={SPRINGS.gentle}
              className={`w-full max-w-sm rounded-xl border border-border shadow-xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                presetStyles.canvasBg
              } ${
                aspectRatio === '1:1'
                  ? 'aspect-square'
                  : aspectRatio === '16:9'
                  ? 'aspect-video'
                  : 'aspect-9/14'
              }`}
            >
              {/* Subtle Canvas Watermark & Logo Anchor */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${presetStyles.badgeBg}`}>
                  {presetStyles.tag}
                </span>
                <span className="text-[10px] font-mono text-foreground-muted flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-status-success" />
                  <span>Deterministic Vector</span>
                </span>
              </div>

              {/* Dynamic Headline & Subtitle */}
              <div className="my-auto py-3">
                <motion.h4
                  key={preset + '-h'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-base sm:text-xl font-bold tracking-tight text-foreground leading-snug"
                >
                  {presetStyles.headline}
                </motion.h4>
                <motion.p
                  key={preset + '-s'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="text-xs text-foreground-secondary mt-2 line-clamp-2 leading-relaxed"
                >
                  {presetStyles.subtitle}
                </motion.p>
              </div>

              {/* Verified Brand Identity Footnote */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[10px] text-foreground-muted font-mono">
                <span>DevCenterPoint Studio OS</span>
                <span className="text-brand-accent">WCAG 2.2 AA (7.4:1)</span>
              </div>
            </motion.div>
          </div>

          {/* Right Interactive Operational Sidebar */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-brand-accent uppercase font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Autonomous Publishing Rhythm</span>
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight mt-1">
                Multi-Channel Real-Time Simulation
              </h3>
              <p className="text-xs text-foreground-secondary mt-2 leading-relaxed">
                Experience deterministic rendering, real social connector binding, and zero-mock dispatch with a single interactive test.
              </p>
            </div>

            {/* Target Channel Indicators */}
            <div className="space-y-2.5">
              {[
                { name: 'LinkedIn Company Page', handle: '@acme-brand', reach: '48.2k members', status: 'SYNCHRONIZED' },
                { name: 'Instagram Professional', handle: '@acme.creative', reach: '124k followers', status: 'OPTIMAL' },
                { name: 'Facebook Business Page', handle: 'Acme Official', reach: '31.5k fans', status: 'ACTIVE' },
              ].map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border bg-background-subtle hover:bg-surface-raised transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">{ch.name}</div>
                      <div className="text-[11px] text-foreground-muted font-mono">{ch.handle} · {ch.reach}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-success-bg text-status-success font-medium">
                    {ch.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Interactive Simulation Action Button */}
            <div className="space-y-2">
              <button
                onClick={handleSimulate}
                disabled={simulatedDispatch}
                className="w-full py-3 px-4 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-98 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group shadow-sm"
              >
                {simulatedDispatch ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Executing Safe Dispatch Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent group-hover:rotate-12 transition-transform" />
                    <span>Simulate 1-Click Multi-Channel Dispatch</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <AnimatePresence>
                {dispatchStatus && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 rounded-lg border border-brand-accent/30 bg-brand-accent/10 text-[11px] font-mono text-brand-accent flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{dispatchStatus}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
