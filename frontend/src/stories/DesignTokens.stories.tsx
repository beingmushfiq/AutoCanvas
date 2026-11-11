import type { Meta, StoryObj } from '@storybook/react'
import { Logo } from '../components/brand/Logo'

const meta: Meta = {
  title: 'Design System/Tokens & Identity',
  tags: ['autodocs'],
}

export default meta

export const IdentityAndTokens: StoryObj = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">AutoCanvas Identity System</h2>
        <p className="text-xs text-foreground-secondary mt-1">
          Direction B: Studio / Editorial Kinetic ("The Frame" Symbol + Two-Tone Geist Wordmark).
        </p>
        <div className="mt-4 flex items-center gap-6 p-6 rounded-2xl border border-border bg-surface">
          <Logo size="lg" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">Semantic Color Tokens</h3>
        <p className="text-xs text-foreground-secondary mt-1">
          All colors dynamically resolve through OKLCH CSS Custom Properties.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl border border-border bg-surface">
            <div className="h-8 rounded-lg bg-background border border-border mb-2" />
            <div className="text-[11px] font-mono text-foreground font-semibold">--background</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface">
            <div className="h-8 rounded-lg bg-surface border border-border mb-2" />
            <div className="text-[11px] font-mono text-foreground font-semibold">--surface</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface">
            <div className="h-8 rounded-lg bg-brand-primary mb-2" />
            <div className="text-[11px] font-mono text-foreground font-semibold">--brand-primary</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface">
            <div className="h-8 rounded-lg bg-brand-accent mb-2" />
            <div className="text-[11px] font-mono text-foreground font-semibold">--brand-accent</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground">Status Accents</h3>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl border border-border bg-surface">
            <div className="h-8 rounded-lg bg-status-success mb-2" />
            <div className="text-[11px] font-mono text-foreground font-semibold">--status-success</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface">
            <div className="h-8 rounded-lg bg-status-warning mb-2" />
            <div className="text-[11px] font-mono text-foreground font-semibold">--status-warning</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-surface">
            <div className="h-8 rounded-lg bg-status-danger mb-2" />
            <div className="text-[11px] font-mono text-foreground font-semibold">--status-danger</div>
          </div>
        </div>
      </div>
    </div>
  ),
}
