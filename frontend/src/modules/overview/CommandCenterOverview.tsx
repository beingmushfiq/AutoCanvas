import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  TrendingUp,
  Share2,
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  PenSquare,
  Compass,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { usePreferences } from '../../lib/theme/PreferencesContext'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'

const CADENCE_DATA = [
  { week: 'W1', generated: 14, published: 12, queued: 4 },
  { week: 'W2', generated: 22, published: 18, queued: 8 },
  { week: 'W3', generated: 35, published: 29, queued: 12 },
  { week: 'W4', generated: 48, published: 42, queued: 15 },
  { week: 'W5', generated: 58, published: 54, queued: 18 },
  { week: 'W6', generated: 74, published: 68, queued: 24 },
]

const ENGAGEMENT_DATA = [
  { day: 'Mon', linkedin: 4200, instagram: 5800, facebook: 2100 },
  { day: 'Tue', linkedin: 5100, instagram: 6400, facebook: 2300 },
  { day: 'Wed', linkedin: 6800, instagram: 7900, facebook: 2900 },
  { day: 'Thu', linkedin: 7400, instagram: 8200, facebook: 3400 },
  { day: 'Fri', linkedin: 8900, instagram: 9600, facebook: 4100 },
  { day: 'Sat', linkedin: 6200, instagram: 11200, facebook: 4600 },
  { day: 'Sun', linkedin: 5400, instagram: 10800, facebook: 3900 },
]

interface CommandCenterOverviewProps {
  onNavigate: (tabId: string) => void
  isEmergencyPaused: boolean
}

export const CommandCenterOverview: React.FC<CommandCenterOverviewProps> = ({
  onNavigate,
  isEmergencyPaused,
}) => {
  const { theme, persona } = usePreferences()
  const isDark = theme === 'dark'

  const gridStroke = isDark ? 'oklch(22% 0.005 265)' : 'oklch(92% 0.005 265)'
  const textFill = isDark ? 'oklch(72% 0.005 265)' : 'oklch(44% 0.006 265)'
  const tooltipBg = isDark ? 'oklch(14% 0.005 265)' : 'oklch(100% 0 0)'
  const tooltipBorder = isDark ? 'oklch(22% 0.005 265)' : 'oklch(92% 0.005 265)'
  const tooltipText = isDark ? 'oklch(96% 0.003 265)' : 'oklch(14% 0.003 265)'

  const accentColor = 'var(--brand-accent)'
  const successColor = 'var(--status-success)'
  const infoColor = 'var(--status-info)'
  const brandPrimaryColor = 'var(--brand-primary)'

  return (
    <div className="space-y-6">
      {/* Circuit Breaker Emergency Banner (if active) */}
      {isEmergencyPaused && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-status-warning-bg border border-status-warning/40 flex items-center gap-3 text-status-warning"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div className="text-xs">
            <span className="font-bold">PUBLISHING PAUSED:</span> Automated publishing is currently paused for your workspace. Scheduled posts and drafts remain safely preserved.
          </div>
        </div>
      )}

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span className="font-medium">Total Multi-Channel Reach</span>
            <TrendingUp className="w-4 h-4 text-status-success" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              1,284,500
            </span>
            <span className="text-xs font-semibold text-status-success flex items-center">
              +18.4%
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </span>
          </div>
          <p className="text-[11px] text-foreground-secondary mt-1">
            Across LinkedIn, Instagram, FB & Twitter
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span className="font-medium">Autonomous Automation Rate</span>
            <Bot className="w-4 h-4 text-brand-accent" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              99.8%
            </span>
            <Badge variant="success">
              Optimal
            </Badge>
          </div>
          <p className="text-[11px] text-foreground-secondary mt-1">
            Verified copy & brand design
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span className="font-medium">Posts In Queue & Scheduled</span>
            <Calendar className="w-4 h-4 text-status-info" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              24 Slots
            </span>
            <span className="text-xs text-foreground-secondary font-mono">Next 7 Days</span>
          </div>
          <p className="text-[11px] text-foreground-secondary mt-1">
            Automated dispatch via social connectors
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span className="font-medium">Publishing Status</span>
            <ShieldCheck className="w-4 h-4 text-status-success" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Badge variant={isEmergencyPaused ? 'warning' : 'success'} className="font-mono text-xs uppercase">
              {isEmergencyPaused ? 'PAUSED' : 'ACTIVE & LIVE'}
            </Badge>
          </div>
          <p className="text-[11px] text-foreground-secondary mt-1">
            Dedicated workspace double-post protection
          </p>
        </Card>
      </div>

      {/* Telemetry Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cadence Production Chart (7 Cols) */}
        <Card className="lg:col-span-7 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                <span>Publishing Velocity & Cadence</span>
              </h3>
              <p className="text-xs text-foreground-secondary">
                Weekly generated vs published social items
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-foreground-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-accent" /> Generated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-success" /> Published
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CADENCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGenerated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={successColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={successColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="week" stroke={textFill} fontSize={11} />
                <YAxis stroke={textFill} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '0.75rem',
                    color: tooltipText,
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="generated"
                  stroke={accentColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGenerated)"
                />
                <Area
                  type="monotone"
                  dataKey="published"
                  stroke={successColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPublished)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Multi-Channel Daily Impressions (5 Cols) */}
        <Card className="lg:col-span-5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4 text-status-info" aria-hidden="true" />
                <span>Daily Channel Engagement</span>
              </h3>
              <p className="text-xs text-foreground-secondary">
                Interactions by target platform
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ENGAGEMENT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={textFill} fontSize={11} />
                <YAxis stroke={textFill} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '0.75rem',
                    color: tooltipText,
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="linkedin" fill={infoColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="instagram" fill={accentColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="facebook" fill={brandPrimaryColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Autonomous System Status & Action Center */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-status-success" aria-hidden="true" />
              <span>Publishing Queue Worker</span>
            </span>
            <Badge variant="success" className="font-mono text-[10px]">
              RUNNING (1m)
            </Badge>
          </div>
          <p className="text-[11px] text-foreground-secondary mt-2 leading-relaxed">
            Monitors your scheduled posts every minute and prevents duplicate dispatches.
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-brand-accent" aria-hidden="true" />
              <span>News & Trend Discovery</span>
            </span>
            <Badge variant="accent" className="font-mono text-[10px]">
              POLLING (6 Feeds)
            </Badge>
          </div>
          <p className="text-[11px] text-foreground-secondary mt-2 leading-relaxed">
            Scans news sources and industry trends to find timely content ideas for your brand.
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-foreground-secondary" aria-hidden="true" />
              <span>Persona Complexity</span>
            </span>
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              {persona.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-[11px] text-foreground-secondary mt-2 leading-relaxed">
            {persona === 'agency_pro'
              ? 'Multi-workspace governance, compliance audits, and advanced social connectors are unlocked.'
              : 'Streamlined operational views focused on content creation, calendar scheduling, and core insights.'}
          </p>
        </Card>
      </div>

      {/* Centered Executive Studio Action Dock */}
      <div className="pt-6 pb-2">
        <div className="text-center mb-5">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground-secondary">
            Production Studios & Publishing Schedulers
          </h3>
          <p className="text-xs text-foreground-muted mt-0.5">
            Launch multi-channel post authoring, deterministic graphic generation, or calendar queues
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
          {/* Studio 1: Content Studio */}
          <button
            type="button"
            onClick={() => onNavigate('content')}
            className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border bg-surface-raised hover:border-brand-accent/60 hover:shadow-lg transition-all duration-200 text-left cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-foreground group-hover:scale-105 group-hover:border-brand-accent/40 transition-transform mb-3 shadow-2xs">
                <PenSquare className="w-5 h-5 text-brand-accent" aria-hidden="true" />
              </div>
              <h4 className="text-base font-bold text-foreground group-hover:text-brand-accent transition-colors flex items-center gap-1.5">
                <span>Content Studio</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-brand-accent" />
              </h4>
              <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                Draft multi-platform posts with real-time brand tone guidance, hook generation, and compliance checks.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-foreground-muted">
              <span>Multi-Channel Copy</span>
              <span className="font-semibold text-brand-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Open Studio <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          {/* Studio 2: Creative Studio */}
          <button
            type="button"
            onClick={() => onNavigate('creative')}
            className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border bg-surface-raised hover:border-brand-accent/60 hover:shadow-lg transition-all duration-200 text-left cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-foreground group-hover:scale-105 group-hover:border-brand-accent/40 transition-transform mb-3 shadow-2xs">
                <Zap className="w-5 h-5 text-brand-accent" aria-hidden="true" />
              </div>
              <h4 className="text-base font-bold text-foreground group-hover:text-brand-accent transition-colors flex items-center gap-1.5">
                <span>Brand Graphic Studio</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-brand-accent" />
              </h4>
              <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                Compose pixel-perfect deterministic vector graphics, slide carousels, and verified typography templates.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-foreground-muted">
              <span>Deterministic SVG</span>
              <span className="font-semibold text-brand-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Open Studio <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          {/* Studio 3: Publishing Calendar */}
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border bg-surface-raised hover:border-brand-accent/60 hover:shadow-lg transition-all duration-200 text-left cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-background-subtle border border-border flex items-center justify-center text-foreground group-hover:scale-105 group-hover:border-brand-accent/40 transition-transform mb-3 shadow-2xs">
                <Calendar className="w-5 h-5 text-status-info" aria-hidden="true" />
              </div>
              <h4 className="text-base font-bold text-foreground group-hover:text-brand-accent transition-colors flex items-center gap-1.5">
                <span>Publishing Calendar</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-brand-accent" />
              </h4>
              <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                Orchestrate multi-network publishing queues, inspect scheduled queue slots, and review post timings.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-foreground-muted">
              <span>FullCalendar Deck</span>
              <span className="font-semibold text-brand-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Open Studio <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
