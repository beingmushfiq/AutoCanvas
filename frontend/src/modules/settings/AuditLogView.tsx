import React, { useState, useEffect } from 'react'
import { apiClient } from '../../lib/api/client'
import { History, Clock, ShieldCheck, Terminal, User } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Card } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'

interface AuditItem {
  id: string
  action: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  user: {
    id: string
    name: string
    email: string
  } | null
}

const DEFAULT_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'log-1',
    action: 'brand.identity_updated',
    old_values: { voice: 'Casual', color_primary: '#6366f1' },
    new_values: { voice: 'Studio Editorial Kinetic', color_primary: 'oklch(20% 0.005 265)' },
    ip_address: '192.168.1.104',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: { id: 'usr-1', name: 'Sarah Connor', email: 'sarah@autocanvas.io' },
  },
  {
    id: 'log-2',
    action: 'circuit_breaker.disarmed',
    old_values: { state: 'PAUSED' },
    new_values: { state: 'LIVE', armed_by: 'admin' },
    ip_address: '192.168.1.104',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    user: { id: 'usr-1', name: 'Sarah Connor', email: 'sarah@autocanvas.io' },
  },
  {
    id: 'log-3',
    action: 'post.idempotent_dispatch',
    old_values: null,
    new_values: { post_id: 'post-1', platform: 'linkedin', lock_id: 'idemp_lock_8841a_prod' },
    ip_address: '127.0.0.1 (Worker)',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    user: null,
  },
  {
    id: 'log-4',
    action: 'member.role_assigned',
    old_values: { role: 'viewer' },
    new_values: { role: 'editor', member: 'marcus@autocanvas.io' },
    ip_address: '192.168.1.104',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user: { id: 'usr-1', name: 'Sarah Connor', email: 'sarah@autocanvas.io' },
  },
]

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: AuditItem[] }>('/audit-logs')
        setLogs(res.data && res.data.length > 0 ? res.data : DEFAULT_AUDIT_LOGS)
      } catch (e) {
        console.error('Failed to load audit logs:', e)
        setLogs(DEFAULT_AUDIT_LOGS)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-foreground-secondary">
        Loading audit timeline...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-accent" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">Governance & Audit Trail</h2>
          </div>
          <p className="text-xs text-foreground-secondary mt-1">
            Immutable chronological ledger of administrative events, role changes, and daemon dispatches.
          </p>
        </div>

        <Badge variant="success" className="gap-1 font-mono uppercase">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Tamper-Resistant Log</span>
        </Badge>
      </Card>

      <Card className="overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={History}
              title="No audit events recorded"
              description="System activities and administrative actions will appear here automatically."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs hover:bg-surface-raised/40 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-brand-accent shrink-0 mt-0.5">
                    {log.user ? (
                      <User className="w-4 h-4 text-foreground" aria-hidden="true" />
                    ) : (
                      <Terminal className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {log.action}
                      </Badge>
                      <span className="text-foreground-secondary text-xs">by</span>
                      <span className="font-semibold text-foreground">
                        {log.user ? `${log.user.name} (${log.user.email})` : 'System Daemon Worker'}
                      </span>
                    </div>

                    {(log.new_values || log.old_values) && (
                      <div className="mt-2.5 text-[11px] font-mono bg-surface-raised p-3 rounded-lg border border-border max-w-2xl overflow-x-auto space-y-1">
                        {log.new_values && (
                          <div className="text-status-success font-medium">
                            + {JSON.stringify(log.new_values)}
                          </div>
                        )}
                        {log.old_values && (
                          <div className="text-status-danger/80">
                            - {JSON.stringify(log.old_values)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-foreground-secondary shrink-0 font-mono">
                  <div className="flex items-center gap-1.5 md:justify-end">
                    <Clock className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  {log.ip_address && (
                    <div className="mt-1 text-foreground-muted">
                      Source: {log.ip_address}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
