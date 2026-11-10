export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
  meta?: {
    timestamp: string
    request_id?: string
  }
}

export interface HealthCheckData {
  status: 'ok' | 'degraded'
  service: string
  version: string
  environment: string
  checks: {
    database: string
    redis: string
  }
  timestamp: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('autocanvas_token')
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    const token = this.getAuthToken()

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    const workspaceId = localStorage.getItem('autocanvas_workspace_id')

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (workspaceId) {
      headers['X-Workspace-Id'] = workspaceId
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    return data
  }

  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  }

  public async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  public async checkHealth(): Promise<HealthCheckData> {
    const response = await fetch('/api/v1/health', {
      headers: { 'Accept': 'application/json' },
    })
    return response.json()
  }
}

export interface BrandSummary {
  id: string
  name: string
  slug: string
  industry: string | null
  status: string
  primary_color: string
  secondary_color: string
  primary_logo_url: string | null
  created_at: string
}

export interface BrandProfileData {
  id: string
  brand_id: string
  business_description: string | null
  mission: string | null
  vision: string | null
  positioning: string | null
  products_services: string[] | null
  target_audience: string | null
  personas: unknown[] | null
  usps: string[] | null
  primary_cta: string | null
  secondary_cta: string | null
  prohibited_subjects: string[] | null
}

export interface BrandVisualData {
  id: string
  brand_id: string
  primary_color: string
  secondary_color: string
  accent_colors: string[] | null
  primary_font: string
  secondary_font: string | null
  primary_logo_url: string | null
  secondary_logo_url: string | null
  layout_preferences: Record<string, unknown> | null
  visual_exclusions: string[] | null
}

export interface BrandVoiceData {
  id: string
  brand_id: string
  personality_traits: string[] | null
  tone: string
  communication_style: string | null
  preferred_language: string
  formality_level: 'formal' | 'casual' | 'conversational' | 'technical'
  channel_language_rules: Record<string, { tone?: string; vocabulary?: string[] }> | null
}

export interface BrandDetail {
  id: string
  name: string
  slug: string
  industry: string | null
  website_url: string | null
  status: string
  profile: BrandProfileData | null
  visual_identity: BrandVisualData | null
  voice_profile: BrandVoiceData | null
  sources_count: number
  memory_entries_count: number
  created_at: string
}

export interface KnowledgeSourceItem {
  id: string
  source_type: string
  display_name: string
  original_uri: string | null
  credibility: 'A' | 'B' | 'C' | 'D' | 'E'
  status: string
  chunks_count: number
  created_at: string
}

export interface KnowledgeSearchMatch {
  chunk_id: string
  source_id: string
  source_name: string
  credibility: string
  content: string
  score: number
  token_count: number
  citation: string
}

export interface BrandMemoryItem {
  id: string
  category: 'approved_fact' | 'successful_style' | 'failed_experiment' | 'audience_insight' | 'campaign_milestone'
  title: string
  content: string
  confidence_score: number
  created_at: string
}

export interface BrandDiscoverySuggestion {
  mission: string
  vision: string
  positioning: string
  personality_traits: string[]
  tone: string
  primary_color: string
  secondary_color: string
  primary_font: string
  confidence_scores: {
    mission?: number
    positioning?: number
    tone?: number
  }
}

export interface ContentPillar {
  id: string
  name: string
  slug: string
  description: string | null
  target_audience: string | null
  weight_percentage: number
  color_tag: string
  status: 'active' | 'archived'
  content_items_count?: number
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  slug: string
  objective: string | null
  key_messaging: string | null
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'active' | 'completed' | 'paused'
  content_items_count?: number
  created_at: string
}

export interface ContentVariant {
  id: string
  content_item_id: string
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'threads' | 'generic'
  caption: string
  hashtags: string[]
  cta_text: string | null
  cta_url: string | null
  character_count: number
  media_urls: string[] | null
  creative_document: Record<string, unknown> | null
  quality_score: number
  platform_options: Record<string, unknown> | null
  created_at: string
}

export interface ContentQAReport {
  brand_alignment_score: number
  platform_fit_score: number
  readability_score: number
  overall_quality_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  safety_checks: {
    contains_prohibited_terms: boolean
    unsubstantiated_claims: boolean
    competitor_mentions: boolean
  }
  suggestions: string[]
}

export interface ContentItem {
  id: string
  brand_id: string
  content_pillar_id: string | null
  campaign_id: string | null
  title: string
  concept: string
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'scheduled' | 'published'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  overall_quality_score: number
  qa_report: ContentQAReport | null
  review_feedback: string | null
  reviewed_at: string | null
  created_at: string
  pillar?: ContentPillar | null
  campaign?: Campaign | null
  variants?: ContentVariant[]
}

export interface CreativeTemplateInfo {
  id: string
  name: string
  category: string
  description: string
  aspect_ratios: string[]
}

export interface CreativeRenderResult {
  success: boolean
  file_path: string
  file_url: string
  format: 'png' | 'svg'
  width: number
  height: number
  renderer: string
  creative_document: Record<string, unknown>
}

// Phase 4: Research & Trend Discovery Interfaces
export interface RssFeed {
  id: string
  brand_id: string | null
  name: string
  url: string
  category: string
  fetch_frequency_minutes: number
  last_fetched_at: string | null
  status: 'active' | 'failing' | 'paused'
  error_count: number
  last_error: string | null
  articles_count?: number
  created_at: string
}

export interface FeedArticle {
  id: string
  rss_feed_id: string
  title: string
  url: string
  author: string | null
  summary: string | null
  content: string | null
  published_at: string
  relevance_score: number
  topics: string[] | null
  is_saved: boolean
  feed?: { id: string; name: string; category: string }
  created_at: string
}

export interface CompetitorProfile {
  id: string
  brand_id: string
  name: string
  website_url: string | null
  social_handles: Record<string, string> | null
  strengths: string | null
  weaknesses: string | null
  target_audience: string | null
  observation_frequency: 'daily' | 'weekly' | 'monthly'
  status: 'active' | 'paused' | 'archived'
  posts_count?: number
  created_at: string
}

export interface CompetitorPost {
  id: string
  competitor_profile_id: string
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'other'
  post_url: string | null
  post_text: string
  published_at: string | null
  engagement_signals: { likes?: number; comments?: number; shares?: number } | null
  observed_themes: string[] | null
  tone: string | null
  tactical_takeaway: string | null
  created_at: string
}

export interface CompetitorInsights {
  total_competitors: number
  total_posts_observed: number
  avg_posts_per_week: number
  total_engagements_observed: number
  top_themes: { theme: string; count: number }[]
  platform_distribution: Record<string, number>
}

export interface TrendSignal {
  id: string
  topic: string
  description: string | null
  source_type: 'rss' | 'competitor' | 'industry_radar' | 'manual'
  signal_strength: number
  sample_urls: string[] | null
  status: 'active' | 'fading' | 'archived'
  detected_at: string
  created_at: string
}

export interface ContentOpportunity {
  id: string
  brand_id: string
  content_pillar_id: string | null
  feed_article_id: string | null
  title: string
  angle: string
  why_it_matters: string
  recommended_channels: string[]
  urgency_score: number
  freshness_score: number
  overall_opportunity_score: number
  status: 'new' | 'dismissed' | 'converted'
  converted_content_item_id: string | null
  pillar?: { id: string; name: string; color_tag: string; weight_percentage: number } | null
  article?: { id: string; title: string; url: string; summary: string | null; published_at: string } | null
  created_at: string
}

export const apiClient = new ApiClient()

