import React, { useState, useEffect } from 'react'
import { Play, X, CheckCircle, SplitSquareVertical } from 'lucide-react'
import { toast } from 'sonner'

interface PromptSandboxModalProps {
  isOpen: boolean
  onClose: () => void
  taskType?: string
  initialPrompt?: string
}

interface BenchmarkItem {
  id: string
  title: string
  summary: string
  category: string
}

interface ComparisonResult {
  headline: string
  hook: string
  caption: string
  tokens_used: number
  novelty_score: number
  brand_fidelity: string
}

export const PromptSandboxModal: React.FC<PromptSandboxModalProps> = ({
  isOpen,
  onClose,
  taskType = 'headline_hook',
  initialPrompt = '',
}) => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([])
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('news_01')
  const [candidatePrompt, setCandidatePrompt] = useState<string>(initialPrompt)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [comparison, setComparison] = useState<{
    production: { prompt: string; result: ComparisonResult }
    candidate: { prompt: string; result: ComparisonResult }
    recommendation: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchBenchmarks()
      if (initialPrompt) {
        setCandidatePrompt(initialPrompt)
      }
    }
  }, [isOpen, initialPrompt])

  const fetchBenchmarks = async () => {
    try {
      const res = await fetch('/api/v1/control-plane/prompt-sandbox/benchmarks', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setBenchmarks(json.data)
        if (json.data.length > 0) {
          setSelectedBenchmarkId(json.data[0].id)
        }
      }
    } catch {
      // Fallback local benchmarks if offline
      setBenchmarks([
        {
          id: 'news_01',
          title: 'Bangladesh Central Bank Raises MFS Freelance Limits',
          summary: 'Bangladesh Bank doubles foreign currency retention ceilings for IT exporters.',
          category: 'Fintech & Economy',
        },
      ])
    }
  }

  const handleRunComparison = async () => {
    if (!candidatePrompt.trim()) {
      toast.error('Please enter candidate prompt instructions.')
      return
    }

    setIsRunning(true)
    try {
      const res = await fetch('/api/v1/control-plane/prompt-sandbox/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          task_type: taskType,
          candidate_prompt: candidatePrompt,
          benchmark_id: selectedBenchmarkId,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setComparison({
          production: json.production,
          candidate: json.candidate,
          recommendation: json.recommendation,
        })
        toast.success('Benchmark evaluation completed!')
      } else {
        toast.error(json.error?.message || 'Comparison failed.')
      }
    } catch {
      toast.error('Network error during evaluation.')
    } finally {
      setIsRunning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-elevated border border-border-subtle rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-accent/10 text-brand-accent">
              <SplitSquareVertical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Prompt Sandbox & Side-by-Side Playground</h2>
              <span className="text-xs text-foreground-muted">
                Task Type: <code className="text-brand-accent font-mono">{taskType}</code> · Safe test before deploying to production
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Benchmark Selector */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-foreground-muted block mb-2 font-semibold">
              Select Benchmark News Article
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {benchmarks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBenchmarkId(b.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedBenchmarkId === b.id
                      ? 'bg-brand-accent/10 border-brand-accent text-foreground'
                      : 'bg-background border-border-subtle text-foreground-muted hover:border-border'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent block mb-1">
                    {b.category}
                  </span>
                  <span className="font-bold block text-foreground mb-1 line-clamp-1">{b.title}</span>
                  <span className="text-[11px] line-clamp-2">{b.summary}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Editor */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-foreground-muted block mb-2 font-semibold">
              Experimental Candidate Prompt
            </label>
            <textarea
              value={candidatePrompt}
              onChange={(e) => setCandidatePrompt(e.target.value)}
              rows={4}
              placeholder="Enter candidate system prompt instructions..."
              className="w-full bg-background border border-border-subtle rounded-xl p-3 text-xs font-mono text-foreground focus:outline-none focus:border-brand-accent"
            />
          </div>

          {/* Comparison Side-by-Side */}
          {comparison && (
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-foreground-muted font-bold">
                  Side-by-Side Benchmark Output
                </span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {comparison.recommendation}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Production */}
                <div className="bg-background border border-border-subtle rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
                      Current Production Prompt
                    </span>
                    <span className="text-xs font-mono bg-surface-elevated px-2 py-0.5 rounded text-foreground-muted">
                      {comparison.production.result.tokens_used} Tokens
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-foreground-muted block">Generated Headline:</span>
                    <span className="text-xs font-bold text-foreground block">{comparison.production.result.headline}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-foreground-muted block">Hook & Narrative:</span>
                    <p className="text-xs text-foreground-muted whitespace-pre-line">{comparison.production.result.caption}</p>
                  </div>
                  <div className="flex gap-4 pt-2 border-t border-border-subtle text-[11px]">
                    <span>Novelty: <strong className="text-foreground">{comparison.production.result.novelty_score}%</strong></span>
                    <span>Brand Fidelity: <strong className="text-foreground">{comparison.production.result.brand_fidelity}</strong></span>
                  </div>
                </div>

                {/* Candidate */}
                <div className="bg-background border border-brand-accent/40 rounded-2xl p-5 space-y-3 shadow-lg shadow-brand-accent/5">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">
                      Candidate Experimental Prompt
                    </span>
                    <span className="text-xs font-mono bg-brand-accent/10 px-2 py-0.5 rounded text-brand-accent font-bold">
                      {comparison.candidate.result.tokens_used} Tokens
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-foreground-muted block">Generated Headline:</span>
                    <span className="text-xs font-bold text-foreground block">{comparison.candidate.result.headline}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-foreground-muted block">Hook & Narrative:</span>
                    <p className="text-xs text-foreground whitespace-pre-line">{comparison.candidate.result.caption}</p>
                  </div>
                  <div className="flex gap-4 pt-2 border-t border-border-subtle text-[11px]">
                    <span>Novelty: <strong className="text-brand-accent">{comparison.candidate.result.novelty_score}%</strong></span>
                    <span>Brand Fidelity: <strong className="text-brand-accent">{comparison.candidate.result.brand_fidelity}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface-elevated flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:text-foreground"
          >
            Close Sandbox
          </button>
          <button
            onClick={handleRunComparison}
            disabled={isRunning}
            className="px-6 py-2.5 rounded-xl bg-brand-primary text-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-brand-primary/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? 'Evaluating Benchmark...' : 'Run Side-by-Side Test'}
          </button>
        </div>
      </div>
    </div>
  )
}
