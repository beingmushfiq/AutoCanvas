import React from 'react'
import { X, Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

const SHORTCUT_GROUPS: { category: string; shortcuts: ShortcutItem[] }[] = [
  {
    category: 'Global Navigation & Command',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open Global Command Palette (or Ctrl + K)' },
      { keys: ['?'], description: 'Open Keyboard Shortcuts Cheat Sheet' },
      { keys: ['Esc'], description: 'Close modals, drawers, and popovers' },
      { keys: ['Tab'], description: 'Move focus through accessible interactive controls' },
    ],
  },
  {
    category: 'Operational Toggles',
    shortcuts: [
      { keys: ['Alt', 'E'], description: 'Emergency Pause / Resume All Automations' },
      { keys: ['Alt', 'T'], description: 'Toggle Theme (Obsidian Dark ↔ Clean Light)' },
      { keys: ['Alt', 'D'], description: 'Toggle Density (Comfortable ↔ Compact)' },
      { keys: ['Alt', 'P'], description: 'Switch Persona (Business Owner ↔ Agency Pro)' },
    ],
  },
  {
    category: 'Creative Studio Canvas Ergonomics',
    shortcuts: [
      { keys: ['↑', '↓', '←', '→'], description: 'Micro-nudge selected element by 1px' },
      { keys: ['Shift', 'Arrow'], description: 'Nudge selected element by 10px' },
      { keys: ['⌘', 'Z'], description: 'Undo last canvas action' },
      { keys: ['⌘', 'Shift', 'Z'], description: 'Redo canvas action' },
      { keys: ['Delete'], description: 'Delete selected canvas layer' },
    ],
  },
]

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-background-subtle border border-border flex items-center justify-center text-brand-accent">
              <Keyboard className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 id="shortcuts-modal-title" className="text-sm font-bold text-foreground tracking-tight">
                Keyboard Shortcuts & Productivity
              </h3>
              <p className="text-xs text-foreground-secondary">
                Designed for speed, ergonomics, and WCAG accessibility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-3">
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-accent">
                {group.category}
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.description}
                    className="flex items-center justify-between p-2 rounded-xl bg-background-subtle border border-border-subtle text-xs"
                  >
                    <span className="text-foreground-secondary">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-mono font-medium text-foreground shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-background-subtle flex items-center justify-between text-xs text-foreground-muted">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[10px]">?</kbd> anywhere to toggle this guide</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-raised font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
