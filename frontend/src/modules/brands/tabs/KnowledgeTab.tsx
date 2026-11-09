import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Upload,
  Globe,
  Search,
  CheckCircle2,
  Loader2,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import {
  apiClient,
  type ApiResponse,
  type KnowledgeSourceItem,
  type KnowledgeSearchMatch,
} from '../../../lib/api/client'

interface KnowledgeTabProps {
  brandId: string
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ brandId }) => {
  const [sources, setSources] = useState<KnowledgeSourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Ingestion form state
  const [mode, setMode] = useState<'text' | 'url'>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [credibility, setCredibility] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Search tester state
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<KnowledgeSearchMatch[] | null>(null)

  const fetchSources = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<ApiResponse<KnowledgeSourceItem[]>>(`/brands/${brandId}/knowledge`)
      setSources(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge sources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [brandId])

  const handleIngestText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await apiClient.post(`/brands/${brandId}/knowledge/upload`, {
        title,
        content,
        credibility,
      })

      setTitle('')
      setContent('')
      setSuccessMsg('Knowledge document ingested, sanitized, and chunked successfully.')
      fetchSources()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest knowledge')
    } finally {
      setSubmitting(false)
    }
  }

  const handleIngestUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await apiClient.post(`/brands/${brandId}/knowledge/url`, { url })

      setUrl('')
      setSuccessMsg('Website content fetched and indexed with SSRF security verification.')
      fetchSources()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest URL')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const res = await apiClient.post<ApiResponse<KnowledgeSearchMatch[]>>(
        `/brands/${brandId}/knowledge/search`,
        { query: searchQuery, limit: 5 }
      )
      setSearchResults(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Knowledge search failed')
    } finally {
      setSearching(false)
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'A':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Tier A (1st-Party Verified)</span>
      case 'B':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Tier B (Reputable Industry)</span>
      case 'C':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Tier C (General Web)</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">Tier {tier}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Ingestion Box */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#101828]">Ingest Knowledge Source</h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Feed raw facts, brand guidelines, product specs, or web pages into the brand's verified context.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-[#F2F4F7] rounded-lg">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === 'text' ? 'bg-white text-[#101828] shadow-xs' : 'text-[#667085]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Document / Text</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === 'url' ? 'bg-white text-[#101828] shadow-xs' : 'text-[#667085]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Web URL</span>
            </button>
          </div>
        </div>

        {mode === 'text' ? (
          <form onSubmit={handleIngestText} className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#344054] mb-1">Source Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 2026 Product Spec & Pricing Guidelines"
                  className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Credibility Tier</label>
                <select
                  value={credibility}
                  onChange={(e) => setCredibility(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg"
                >
                  <option value="A">Tier A: 1st-Party Official Doc</option>
                  <option value="B">Tier B: Reputable Press/Report</option>
                  <option value="C">Tier C: Industry Analysis</option>
                  <option value="D">Tier D: Unverified Third-Party</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Knowledge Content</label>
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste product specifications, brand facts, technical documentation, or guidelines..."
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg font-mono focus:ring-2 focus:ring-[#6257E8]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6257E8] text-white text-xs font-semibold rounded-lg hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Ingest & Index Knowledge</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleIngestUrl} className="space-y-3 pt-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <strong className="font-semibold">SSRF Protection Active:</strong> URLs pointing to private networks (10.x, 192.168.x, 127.x, localhost) or cloud metadata endpoints are strictly blocked before connection.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">Website URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/about-us"
                className="w-full px-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6257E8] text-white text-xs font-semibold rounded-lg hover:bg-[#5246D6] disabled:opacity-50 shadow-xs"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>Fetch & Ingest URL</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* RAG Knowledge Retrieval Tester */}
      <div className="bg-white p-6 rounded-xl border border-[#EAECF0] shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#101828]">RAG Knowledge Retrieval Tester</h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Test how the AI retrieves cited passages from this brand's knowledge base before drafting posts.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. refund policy, enterprise features, founder story..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#D0D5DD] rounded-lg focus:ring-2 focus:ring-[#6257E8]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#101828] text-white text-xs font-semibold rounded-lg hover:bg-black disabled:opacity-50 shadow-xs"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Query Knowledge Base</span>
          </button>
        </form>

        {searchResults && (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-[#344054]">
              Found {searchResults.length} matching knowledge passages:
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#667085] bg-[#F9FAFB] rounded-lg border border-[#EAECF0]">
                No relevant passages found in this brand's indexed documents.
              </div>
            ) : (
              searchResults.map((match) => (
                <div
                  key={match.chunk_id}
                  className="p-3.5 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#101828]">{match.citation}</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white border border-[#D0D5DD] rounded text-[#344054]">
                      Score: {match.score} ({match.token_count} tokens)
                    </span>
                  </div>
                  <p className="text-xs text-[#475467] leading-relaxed italic">"{match.content}"</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Ingested Sources Table */}
      <div className="bg-white rounded-xl border border-[#EAECF0] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#6257E8]" />
            <h3 className="text-sm font-bold text-[#101828]">Indexed Knowledge Sources</h3>
          </div>
          <span className="text-xs font-semibold text-[#667085]">Total: {sources.length}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#6257E8]" />
            Loading knowledge sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#667085]">
            No knowledge sources indexed yet. Ingest your first document or URL above.
          </div>
        ) : (
          <div className="divide-y divide-[#EAECF0]">
            {sources.map((src) => (
              <div key={src.id} className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F2F4F7] text-[#667085] flex items-center justify-center shrink-0 mt-0.5">
                    {src.source_type === 'url' ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#101828]">{src.display_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {getTierBadge(src.credibility)}
                      <span className="text-[11px] text-[#667085]">
                        {src.chunks_count} chunks indexed
                      </span>
                      <span className="text-[11px] text-[#98A2B3]">
                        {new Date(src.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
