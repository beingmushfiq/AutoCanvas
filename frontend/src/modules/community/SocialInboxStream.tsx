import React, { useState, useEffect, useCallback } from 'react'
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Send,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Search,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  apiClient,
  type SocialConversationItem,
  type BrandSummary,
} from '../../lib/api/client'
import { EmptyState } from '../../components/ui/empty-state'

export const SocialInboxStream: React.FC = () => {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>('')
  const [conversations, setConversations] = useState<SocialConversationItem[]>([])
  const [selectedConversation, setSelectedConversation] = useState<SocialConversationItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDrafting, setIsDrafting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // 1. Fetch available brands on mount
  useEffect(() => {
    async function loadBrands() {
      try {
        const res = await apiClient.getBrands()
        if (res.data && res.data.length > 0) {
          setBrands(res.data)
          setSelectedBrandId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      }
    }
    loadBrands()
  }, [])

  // 2. Load conversations for selected brand & filter
  const loadConversations = useCallback(async () => {
    if (!selectedBrandId) return
    setIsLoading(true)
    setActionError(null)
    try {
      const res = await apiClient.getInboxConversations(selectedBrandId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      if (res.data) {
        setConversations(res.data)
        if (res.data.length > 0 && !selectedConversation) {
          loadConversationDetail(res.data[0].id)
        } else if (res.data.length === 0) {
          setSelectedConversation(null)
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch community conversations')
    } finally {
      setIsLoading(false)
    }
  }, [selectedBrandId, statusFilter])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // 3. Load full conversation details & messages
  const loadConversationDetail = async (conversationId: string) => {
    setIsDetailLoading(true)
    try {
      const res = await apiClient.getInboxConversation(conversationId)
      if (res.data) {
        setSelectedConversation(res.data)
        // Pre-populate reply box with latest pending AI draft if available
        const latestInbound = res.data.messages?.filter((m) => m.direction === 'inbound').pop()
        if (latestInbound?.ai_draft_reply) {
          setReplyText(latestInbound.ai_draft_reply)
        } else {
          setReplyText('')
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch conversation details:', err)
    } finally {
      setIsDetailLoading(false)
    }
  }

  // 4. Dispatch Approved Reply
  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim()) return
    const latestInbound = selectedConversation.messages?.filter((m) => m.direction === 'inbound').pop()
    if (!latestInbound) return

    setIsSubmitting(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      await apiClient.replyToInboxMessage(latestInbound.id, replyText.trim())
      setActionSuccess('Reply dispatched successfully to social network.')
      setReplyText('')
      await loadConversationDetail(selectedConversation.id)
      await loadConversations()
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch reply.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. Regenerate AI Draft Reply
  const handleRegenerateDraft = async () => {
    if (!selectedConversation) return
    const latestInbound = selectedConversation.messages?.filter((m) => m.direction === 'inbound').pop()
    if (!latestInbound) return

    setIsDrafting(true)
    try {
      const res = await apiClient.generateInboxDraft(latestInbound.id)
      if (res.data?.ai_draft_reply) {
        setReplyText(res.data.ai_draft_reply)
        setActionSuccess('New brand-voice draft synthesized.')
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to synthesize AI draft.')
    } finally {
      setIsDrafting(false)
    }
  }

  // 6. Lifecycle Actions
  const handleResolve = async () => {
    if (!selectedConversation) return
    try {
      await apiClient.resolveInboxConversation(selectedConversation.id)
      setActionSuccess('Conversation marked as resolved.')
      await loadConversations()
      await loadConversationDetail(selectedConversation.id)
    } catch (err: any) {
      setActionError(err.message || 'Failed to resolve conversation.')
    }
  }

  const handleEscalate = async () => {
    if (!selectedConversation) return
    try {
      await apiClient.escalateInboxConversation(selectedConversation.id, 'urgent')
      setActionSuccess('Conversation escalated to urgent priority.')
      await loadConversations()
      await loadConversationDetail(selectedConversation.id)
    } catch (err: any) {
      setActionError(err.message || 'Failed to escalate conversation.')
    }
  }

  const handleMarkSpam = async () => {
    if (!selectedConversation) return
    try {
      await apiClient.markInboxConversationSpam(selectedConversation.id)
      setActionSuccess('Conversation flagged as spam and hidden.')
      await loadConversations()
      setSelectedConversation(null)
    } catch (err: any) {
      setActionError(err.message || 'Failed to flag as spam.')
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.sender_name.toLowerCase().includes(q) ||
      c.latest_message?.message_text.toLowerCase().includes(q) ||
      c.platform.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header & Brand Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Unified Community Inbox
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-primary text-foreground-inverse">
              Phase 9
            </span>
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            Omnichannel customer sentiment detection, automated spam shielding, and AI brand voice assistant.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="brand-select" className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
            Active Brand:
          </label>
          <select
            id="brand-select"
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm font-medium focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadConversations()}
            disabled={isLoading}
            aria-label="Refresh inbox messages"
            className="p-2 rounded-xl border border-border bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-raised transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div
          role="status"
          className="p-3.5 rounded-xl border border-status-success bg-status-success-bg text-status-success text-xs font-medium flex items-center justify-between"
        >
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-status-success hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border border-status-danger bg-status-danger-bg text-status-danger text-xs font-medium flex items-center justify-between"
        >
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-status-danger hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Conversation Stream (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-border bg-background-subtle space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search sender, message, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Inbox filters">
              {[
                { id: 'open', label: 'Open' },
                { id: 'escalated', label: 'Escalated' },
                { id: 'resolved', label: 'Resolved' },
                { id: 'spam', label: 'Spam' },
                { id: 'all', label: 'All' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={statusFilter === tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    statusFilter === tab.id
                      ? 'bg-foreground text-foreground-inverse font-semibold'
                      : 'text-foreground-secondary hover:bg-surface-raised hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stream List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {isLoading && conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-foreground-muted">Loading inbox messages...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Inbox}
                  title="No conversations found"
                  description="All customer messages for this filter have been settled."
                />
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationDetail(conv.id)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 outline-hidden focus-visible:bg-surface-raised ${
                      isSelected
                        ? 'bg-background-subtle border-l-4 border-l-brand-primary'
                        : 'hover:bg-surface-raised'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0 text-foreground-secondary text-xs font-bold">
                      {conv.sender_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {conv.sender_name}
                        </span>
                        <span className="text-[10px] text-foreground-muted uppercase font-mono-numeric">
                          {conv.platform}
                        </span>
                      </div>

                      <p className="text-xs text-foreground-secondary line-clamp-2 mt-1">
                        {conv.latest_message?.message_text || 'No recent messages'}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        {conv.status === 'escalated' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-status-danger-bg text-status-danger">
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            Urgent
                          </span>
                        )}
                        {conv.latest_message?.intent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-raised border border-border text-foreground-secondary capitalize">
                            {conv.latest_message.intent}
                          </span>
                        )}
                        {conv.status === 'resolved' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-status-success font-medium">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Conversation Detail & AI Reply Studio (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border bg-background-subtle flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-primary text-foreground-inverse flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedConversation.sender_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground truncate">
                      {selectedConversation.sender_name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                      <span className="capitalize">{selectedConversation.platform}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedConversation.conversation_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="capitalize font-medium text-brand-accent">
                        Status: {selectedConversation.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {selectedConversation.status !== 'resolved' && (
                    <button
                      onClick={handleResolve}
                      title="Mark as Resolved"
                      aria-label="Resolve conversation"
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-foreground flex items-center gap-1 transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
                      <span>Resolve</span>
                    </button>
                  )}

                  {selectedConversation.status !== 'escalated' && (
                    <button
                      onClick={handleEscalate}
                      title="Escalate to Human Agent"
                      aria-label="Escalate conversation"
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-foreground flex items-center gap-1 transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-status-warning" aria-hidden="true" />
                      <span>Escalate</span>
                    </button>
                  )}

                  {selectedConversation.status !== 'spam' && (
                    <button
                      onClick={handleMarkSpam}
                      title="Flag as Spam & Hide"
                      aria-label="Flag as spam"
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-status-danger flex items-center gap-1 transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Spam</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread History */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px]">
                {isDetailLoading ? (
                  <div className="text-center py-10 text-xs text-foreground-muted">Loading thread messages...</div>
                ) : (
                  selectedConversation.messages?.map((msg) => {
                    const isInbound = msg.direction === 'inbound'
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-foreground">
                            {msg.sender_name}
                          </span>
                          <span className="text-[10px] text-foreground-muted">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isInbound && msg.intent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-raised border border-border text-foreground-secondary">
                              {msg.intent}
                            </span>
                          )}
                          {isInbound && typeof msg.sentiment_score === 'number' && (
                            <span
                              className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                msg.sentiment_score > 0.2
                                  ? 'text-status-success'
                                  : msg.sentiment_score < -0.2
                                  ? 'text-status-danger'
                                  : 'text-foreground-muted'
                              }`}
                            >
                              {msg.sentiment_score > 0.2 ? (
                                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                              ) : msg.sentiment_score < -0.2 ? (
                                <TrendingDown className="w-3 h-3" aria-hidden="true" />
                              ) : null}
                              {Math.round(msg.sentiment_score * 100)}%
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            isInbound
                              ? 'bg-background-subtle border border-border text-foreground rounded-tl-xs'
                              : 'bg-brand-primary text-foreground-inverse rounded-tr-xs shadow-2xs'
                          }`}
                        >
                          {msg.message_text}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* AI Draft & Reply Dispatch Studio */}
              <div className="p-4 border-t border-border bg-background-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>AI Brand Voice Assistant</span>
                  </div>

                  <button
                    onClick={handleRegenerateDraft}
                    disabled={isDrafting}
                    className="text-xs text-foreground-secondary hover:text-foreground flex items-center gap-1 font-medium transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring rounded"
                  >
                    <RefreshCw className={`w-3 h-3 ${isDrafting ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span>Regenerate Draft</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Draft reply or edit AI proposal..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-surface text-foreground text-xs leading-relaxed focus-visible:ring-2 focus-visible:ring-focus-ring outline-hidden resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-foreground-muted">
                    {replyText.length}/280 characters • Strictly conforms to brand voice guidelines
                  </span>

                  <button
                    onClick={handleSendReply}
                    disabled={isSubmitting || !replyText.trim()}
                    className="px-4 py-2 rounded-xl bg-foreground text-foreground-inverse font-semibold text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isSubmitting ? 'Dispatching...' : 'Approve & Send Reply'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={MessageSquare}
                title="No Conversation Selected"
                description="Select an incoming thread from the stream on the left to inspect customer sentiment, review AI proposals, and dispatch replies."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
