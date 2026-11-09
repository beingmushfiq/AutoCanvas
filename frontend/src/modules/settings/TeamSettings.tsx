import React, { useState, useEffect } from 'react'
import { apiClient } from '../../lib/api/client'
import { UserPlus, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  name: string
  email: string
  role: string
  joined_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  expires_at: string
}

export const TeamSettings: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTeam = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get<{
        success: boolean
        data: { members: Member[]; invitations: Invitation[] }
      }>('/organization/members')
      setMembers(res.data.members)
      setInvitations(res.data.invitations)
    } catch (e) {
      console.error('Failed to load team:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      await apiClient.post('/organization/members/invite', {
        email: inviteEmail,
        role: inviteRole,
      })
      setFeedback({ type: 'success', message: `Invitation sent to ${inviteEmail}` })
      setInviteEmail('')
      setShowInviteModal(false)
      fetchTeam()
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#101828]">Team & Access Control</h3>
          <p className="text-xs text-[#667085]">Manage members and role permissions for your organization</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6257E8] text-white text-xs font-semibold hover:bg-[#5246D6] transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-[#EAECF0] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#101828]">Active Members ({members.length})</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#667085]">Loading team members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">No members found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[#667085] border-b border-[#EAECF0]">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[#F9FAFB]/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#EAECF0] flex items-center justify-center font-bold text-xs text-[#344054]">
                        {m.name?.charAt(0) || m.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[#101828]">{m.name || 'Invited User'}</div>
                        <div className="text-[11px] text-[#667085]">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#F2F4F7] text-[#344054]">
                      <Shield className="w-3 h-3 text-[#667085]" />
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#667085]">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAECF0]">
            <span className="text-xs font-semibold text-[#101828]">Pending Invitations ({invitations.length})</span>
          </div>
          <div className="divide-y divide-[#EAECF0]">
            {invitations.map((inv) => (
              <div key={inv.id} className="px-5 py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#98A2B3]" />
                  <span className="font-medium text-[#101828]">{inv.email}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F2F4F7] text-[#667085]">
                    {inv.role}
                  </span>
                </div>
                <span className="text-[11px] text-[#667085]">
                  Expires {new Date(inv.expires_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-sm font-bold text-[#101828]">Invite Team Member</h4>
            <p className="text-xs text-[#667085] mt-1">
              Send an invitation to join your organization workspace.
            </p>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] focus:outline-hidden focus:border-[#6257E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white focus:outline-hidden focus:border-[#6257E8]"
                >
                  <option value="admin">Admin (Full Management)</option>
                  <option value="manager">Manager (Operations & Approvals)</option>
                  <option value="editor">Editor (Content & Creative Creation)</option>
                  <option value="designer">Designer (Creative Studio & Templates)</option>
                  <option value="publisher">Publisher (Publishing Control)</option>
                  <option value="analyst">Analyst (Analytics & Reports)</option>
                  <option value="community_manager">Community Manager (Inbox & Replies)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-2 text-xs font-medium text-[#344054] hover:bg-[#F2F4F7] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#6257E8] text-white rounded-lg hover:bg-[#5246D6] disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
