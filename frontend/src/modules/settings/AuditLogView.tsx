import React, { useState, useEffect } from 'react'
import { apiClient } from '../../lib/api/client'
import { History, Clock } from 'lucide-react'

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

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: AuditItem[] }>('/audit-logs')
        setLogs(res.data)
      } catch (e) {
        console.error('Failed to load audit logs:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-[#667085]">Loading audit timeline...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-[#101828]">Governance & Audit Trail</h3>
        <p className="text-xs text-[#667085]">Immutable chronological record of administrative and tenant events</p>
      </div>

      <div className="bg-white rounded-xl border border-[#EAECF0] shadow-xs overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">No audit logs recorded yet.</div>
        ) : (
          <div className="divide-y divide-[#EAECF0]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between text-xs hover:bg-[#F9FAFB]/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F2F4F7] flex items-center justify-center text-[#667085] shrink-0 mt-0.5">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#101828] font-mono text-[11px] px-1.5 py-0.5 bg-[#F2F4F7] rounded">
                        {log.action}
                      </span>
                      <span className="text-[#667085]">by</span>
                      <span className="font-medium text-[#344054]">
                        {log.user ? `${log.user.name} (${log.user.email})` : 'System Daemon'}
                      </span>
                    </div>

                    {(log.new_values || log.old_values) && (
                      <div className="mt-2 text-[11px] text-[#475467] font-mono bg-[#F9FAFB] p-2.5 rounded-lg border border-[#EAECF0] max-w-xl overflow-x-auto">
                        {log.new_values && <div>+ {JSON.stringify(log.new_values)}</div>}
                        {log.old_values && <div className="text-[#98A2B3]">- {JSON.stringify(log.old_values)}</div>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-[#98A2B3] shrink-0 ml-4">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  {log.ip_address && <div className="mt-0.5">IP: {log.ip_address}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
