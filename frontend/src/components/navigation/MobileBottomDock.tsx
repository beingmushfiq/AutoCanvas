import React from 'react'
import {
  LayoutDashboard,
  Radio,
  Palette,
  Calendar,
  Menu,
} from 'lucide-react'

interface MobileBottomDockProps {
  activeTab: string
  onSelectTab: (tabId: string) => void
  onOpenDrawer: () => void
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  onSelectTab,
  onOpenDrawer,
}) => {
  const dockItems = [
    { id: 'overview', label: 'Command', icon: LayoutDashboard },
    { id: 'autopilot', label: 'Radar', icon: Radio },
    { id: 'creative', label: 'Studio', icon: Palette },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ]

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg transition-colors select-none"
    >
      {dockItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
              isActive
                ? 'text-brand-accent font-semibold'
                : 'text-foreground-secondary hover:text-foreground active:scale-95'
            }`}
          >
            {/* Active Top Glow Mark */}
            {isActive && (
              <span
                className="absolute top-0 w-8 h-[2.5px] rounded-full bg-brand-accent shadow-[0_0_8px_var(--color-brand-accent)]"
                aria-hidden="true"
              />
            )}
            <Icon className={`w-5 h-5 ${isActive ? 'text-brand-accent' : 'text-foreground-muted'}`} aria-hidden="true" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
          </button>
        )
      })}

      {/* Drawer Opener for All Studios */}
      <button
        type="button"
        aria-label="Open Full Studio Menu"
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl text-foreground-secondary hover:text-foreground active:scale-95 transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <Menu className="w-5 h-5 text-foreground-muted" aria-hidden="true" />
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">More</span>
      </button>
    </nav>
  )
}

