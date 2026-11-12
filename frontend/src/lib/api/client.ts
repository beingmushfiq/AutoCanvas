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
      if (response.status === 401 && token) {
        // If an expired or invalidated token was sent, purge it so app reflects unauthenticated state cleanly
        localStorage.removeItem('autocanvas_token')
        window.dispatchEvent(new CustomEvent('autocanvas:session-expired'))
      }
      const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`
      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      ;(error as any).code = data?.error?.code
      throw error
    }

    return data
  }

  public async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  public async post<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  }

  public async put<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  public async checkHealth(): Promise<HealthCheckData> {
    const response = await fetch('/api/v1/health', {
      headers: { 'Accept': 'application/json' },
    })
    return response.json()
  }

  // Publishing Engine & Circuit Breaker APIs (Phase 7)
  public async publishNow(
    variantId: string,
    payload?: { social_account_id?: string; idempotency_key?: string }
  ): Promise<ApiResponse<PublishingDispatchItem>> {
    return this.post<ApiResponse<PublishingDispatchItem>>(
      `/content/variants/${variantId}/publish-now`,
      payload
    )
  }

  public async scheduleVariant(
    variantId: string,
    scheduledAt: string,
    socialAccountId?: string
  ): Promise<ApiResponse<PublishingDispatchItem>> {
    return this.post<ApiResponse<PublishingDispatchItem>>(
      `/content/variants/${variantId}/schedule`,
      { scheduled_at: scheduledAt, social_account_id: socialAccountId }
    )
  }

  public async cancelDispatch(dispatchId: string): Promise<ApiResponse<PublishingDispatchItem>> {
    return this.post<ApiResponse<PublishingDispatchItem>>(`/publishing/dispatches/${dispatchId}/cancel`)
  }

  public async getDispatches(params?: {
    brand_id?: string
    status?: string
  }): Promise<ApiResponse<PublishingDispatchItem[]>> {
    const query = new URLSearchParams()
    if (params?.brand_id) query.set('brand_id', params.brand_id)
    if (params?.status) query.set('status', params.status)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return this.get<ApiResponse<PublishingDispatchItem[]>>(`/publishing/dispatches${queryString}`)
  }

  public async getCircuitBreakerStatus(): Promise<ApiResponse<{ paused: boolean }>> {
    return this.get<ApiResponse<{ paused: boolean }>>('/publishing/circuit-breaker/status')
  }

  public async pauseAutomations(): Promise<ApiResponse<{ paused: boolean; message: string }>> {
    return this.post<ApiResponse<{ paused: boolean; message: string }>>(
      '/publishing/circuit-breaker/pause'
    )
  }

  public async resumeAutomations(): Promise<ApiResponse<{ paused: boolean; message: string }>> {
    return this.post<ApiResponse<{ paused: boolean; message: string }>>(
      '/publishing/circuit-breaker/resume'
    )
  }

  // Research, Trends & Competitor Intelligence APIs (Phase 8)
  public async getCompetitorGaps(brandId: string): Promise<ApiResponse<CompetitorGapReport>> {
    return this.get<ApiResponse<CompetitorGapReport>>(`/brands/${brandId}/competitor-gaps`)
  }

  public async getCompetitorInsights(brandId: string): Promise<ApiResponse<Record<string, any>>> {
    return this.get<ApiResponse<Record<string, any>>>(`/brands/${brandId}/competitor-insights`)
  }

  public async detectOpportunities(
    brandId: string,
    limit: number = 5
  ): Promise<ApiResponse<ContentOpportunityItem[]>> {
    return this.post<ApiResponse<ContentOpportunityItem[]>>(`/brands/${brandId}/opportunities/detect`, {
      limit,
    })
  }

  public async convertOpportunity(
    opportunityId: string,
    overrides?: { platforms?: string[]; generate_creative?: boolean; use_knowledge?: boolean }
  ): Promise<ApiResponse<{ opportunity: ContentOpportunityItem; content_item: any }>> {
    return this.post<ApiResponse<{ opportunity: ContentOpportunityItem; content_item: any }>>(
      `/research/opportunities/${opportunityId}/convert`,
      overrides
    )
  }

  public async dismissOpportunity(opportunityId: string): Promise<ApiResponse<void>> {
    return this.post<ApiResponse<void>>(`/research/opportunities/${opportunityId}/dismiss`)
  }

  public async syncFeed(feedId: string): Promise<ApiResponse<{ new_articles: number }>> {
    return this.post<ApiResponse<{ new_articles: number }>>(`/research/feeds/${feedId}/sync`)
  }

  public async getBrands(): Promise<ApiResponse<BrandSummary[]>> {
    return this.get<ApiResponse<BrandSummary[]>>('/brands')
  }

  // Community Unified Inbox (Phase 9 / MOD-09)
  public async getInboxConversations(
    brandId: string,
    params?: { status?: string; platform?: string; priority?: string; per_page?: number }
  ): Promise<ApiResponse<SocialConversationItem[]>> {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.platform) query.set('platform', params.platform)
    if (params?.priority) query.set('priority', params.priority)
    if (params?.per_page) query.set('per_page', String(params.per_page))
    const qs = query.toString() ? `?${query.toString()}` : ''
    return this.get<ApiResponse<SocialConversationItem[]>>(`/brands/${brandId}/inbox/conversations${qs}`)
  }

  public async getInboxConversation(
    conversationId: string
  ): Promise<ApiResponse<SocialConversationItem>> {
    return this.get<ApiResponse<SocialConversationItem>>(`/inbox/conversations/${conversationId}`)
  }

  public async replyToInboxMessage(
    messageId: string,
    replyText: string
  ): Promise<ApiResponse<SocialMessageItem>> {
    return this.post<ApiResponse<SocialMessageItem>>(`/inbox/messages/${messageId}/reply`, {
      reply_text: replyText,
    })
  }

  public async generateInboxDraft(
    messageId: string
  ): Promise<ApiResponse<{ ai_draft_reply: string; message: SocialMessageItem }>> {
    return this.post<ApiResponse<{ ai_draft_reply: string; message: SocialMessageItem }>>(
      `/inbox/messages/${messageId}/generate-draft`
    )
  }

  public async resolveInboxConversation(
    conversationId: string
  ): Promise<ApiResponse<SocialConversationItem>> {
    return this.post<ApiResponse<SocialConversationItem>>(`/inbox/conversations/${conversationId}/resolve`)
  }

  public async escalateInboxConversation(
    conversationId: string,
    priority: string = 'urgent'
  ): Promise<ApiResponse<SocialConversationItem>> {
    return this.post<ApiResponse<SocialConversationItem>>(`/inbox/conversations/${conversationId}/escalate`, {
      priority,
    })
  }

  public async markInboxConversationSpam(
    conversationId: string
  ): Promise<ApiResponse<SocialConversationItem>> {
    return this.post<ApiResponse<SocialConversationItem>>(`/inbox/conversations/${conversationId}/mark-spam`)
  }

  // Performance Analytics & Telemetry (Phase 10 / MOD-10)
  public async getAnalyticsOverview(
    brandId: string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<ApiResponse<AnalyticsOverviewReport>> {
    const query = new URLSearchParams()
    if (params?.start_date) query.set('start_date', params.start_date)
    if (params?.end_date) query.set('end_date', params.end_date)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return this.get<ApiResponse<AnalyticsOverviewReport>>(`/brands/${brandId}/analytics/overview${qs}`)
  }

  public async getAnalyticsTimeSeries(
    brandId: string,
    params?: { start_date?: string; end_date?: string; platform?: string }
  ): Promise<ApiResponse<AnalyticsTimeSeriesPoint[]>> {
    const query = new URLSearchParams()
    if (params?.start_date) query.set('start_date', params.start_date)
    if (params?.end_date) query.set('end_date', params.end_date)
    if (params?.platform) query.set('platform', params.platform)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return this.get<ApiResponse<AnalyticsTimeSeriesPoint[]>>(`/brands/${brandId}/analytics/timeseries${qs}`)
  }

  public async getAnalyticsPillars(
    brandId: string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<ApiResponse<PillarRoiItem[]>> {
    const query = new URLSearchParams()
    if (params?.start_date) query.set('start_date', params.start_date)
    if (params?.end_date) query.set('end_date', params.end_date)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return this.get<ApiResponse<PillarRoiItem[]>>(`/brands/${brandId}/analytics/pillars${qs}`)
  }

  public async getAnalyticsBestTimes(
    brandId: string
  ): Promise<ApiResponse<BestPostingTimesReport>> {
    return this.get<ApiResponse<BestPostingTimesReport>>(`/brands/${brandId}/analytics/best-times`)
  }

  public async getAnalyticsTopPosts(
    brandId: string,
    limit: number = 10
  ): Promise<ApiResponse<TopPostAnalyticsItem[]>> {
    return this.get<ApiResponse<TopPostAnalyticsItem[]>>(`/brands/${brandId}/analytics/top-posts?limit=${limit}`)
  }

  // Autonomous Intelligence & Cadence Engine (Autopilot Radar)
  public async getAutopilotRadar(brandId: string): Promise<ApiResponse<AutopilotRadarData>> {
    return this.get<ApiResponse<AutopilotRadarData>>(`/autopilot/radar?brand_id=${brandId}`)
  }

  public async getAutopilotCadence(brandId: string): Promise<ApiResponse<BrandCadenceSettingData>> {
    return this.get<ApiResponse<BrandCadenceSettingData>>(`/autopilot/cadence?brand_id=${brandId}`)
  }

  public async updateAutopilotCadence(
    brandId: string,
    payload: Partial<BrandCadenceSettingData>
  ): Promise<ApiResponse<BrandCadenceSettingData>> {
    return this.post<ApiResponse<BrandCadenceSettingData>>(`/autopilot/cadence?brand_id=${brandId}`, payload)
  }

  public async triggerAutopilotCycle(brandId: string): Promise<ApiResponse<AutopilotCycleReport>> {
    return this.post<ApiResponse<AutopilotCycleReport>>(`/autopilot/trigger?brand_id=${brandId}`)
  }

  public async getDiscoveredSources(brandId: string): Promise<ApiResponse<{ data: DiscoveredSourceItem[] }>> {
    return this.get<ApiResponse<{ data: DiscoveredSourceItem[] }>>(`/autopilot/discovered-sources?brand_id=${brandId}`)
  }

  public async getContentFingerprints(brandId: string): Promise<ApiResponse<{ data: ContentFingerprintItem[] }>> {
    return this.get<ApiResponse<{ data: ContentFingerprintItem[] }>>(`/autopilot/fingerprints?brand_id=${brandId}`)
  }

  // Sovereign Master Control & CMS APIs
  public async getPublicCmsData(): Promise<ApiResponse<PublicCmsData>> {
    return this.get<ApiResponse<PublicCmsData>>('/cms/public-data')
  }

  public async getMasterCmsBlocks(): Promise<ApiResponse<Record<string, CmsBlockItem>>> {
    return this.get<ApiResponse<Record<string, CmsBlockItem>>>('/control-plane/cms/blocks')
  }

  public async updateMasterCmsBlock(key: string, data: { title: string; content_json: any }): Promise<ApiResponse<CmsBlockItem>> {
    return this.post<ApiResponse<CmsBlockItem>>(`/control-plane/cms/blocks/${key}`, data)
  }

  public async getMasterTheme(): Promise<ApiResponse<CustomThemeData>> {
    return this.get<ApiResponse<CustomThemeData>>('/control-plane/cms/theme')
  }

  public async updateMasterTheme(data: Partial<CustomThemeData>): Promise<ApiResponse<CustomThemeData>> {
    return this.post<ApiResponse<CustomThemeData>>('/control-plane/cms/theme', data)
  }

  public async getMasterPrompts(): Promise<ApiResponse<AiPromptGroup[]>> {
    return this.get<ApiResponse<AiPromptGroup[]>>('/control-plane/cms/prompts')
  }

  public async saveMasterPrompt(
    taskType: string,
    data: {
      prompt_template: string
      model_override?: string
      temperature?: number
      max_tokens?: number
      change_summary?: string
    }
  ): Promise<ApiResponse<AiPromptTemplateItem>> {
    return this.post<ApiResponse<AiPromptTemplateItem>>(`/control-plane/cms/prompts/${taskType}`, data)
  }

  public async rollbackMasterPrompt(taskType: string, targetVersion: number): Promise<ApiResponse<AiPromptTemplateItem>> {
    return this.post<ApiResponse<AiPromptTemplateItem>>(`/control-plane/cms/prompts/${taskType}/rollback`, {
      target_version: targetVersion,
    })
  }

  public async getCrawlerTuning(): Promise<ApiResponse<CrawlerTuningData>> {
    return this.get<ApiResponse<CrawlerTuningData>>('/control-plane/crawler-tuning')
  }

  public async updateCrawlerTuning(data: Partial<CrawlerTuningData>): Promise<ApiResponse<CrawlerTuningData>> {
    return this.post<ApiResponse<CrawlerTuningData>>('/control-plane/crawler-tuning', data)
  }

  public async getMasterTenants(params?: { search?: string; status?: string; plan_id?: string; page?: number }): Promise<ApiResponse<any>> {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    if (params?.plan_id && params.plan_id !== 'all') query.set('plan_id', params.plan_id)
    if (params?.page) query.set('page', params.page.toString())
    const qs = query.toString() ? `?${query.toString()}` : ''
    return this.get<ApiResponse<any>>(`/control-plane/organizations${qs}`)
  }

  public async getMasterPlans(): Promise<ApiResponse<any[]>> {
    return this.get<ApiResponse<any[]>>('/control-plane/organizations/plans')
  }

  public async impersonateTenant(orgId: string): Promise<ApiResponse<{ token: string; organization: any }>> {
    return this.post<ApiResponse<{ token: string; organization: any }>>(`/control-plane/organizations/${orgId}/impersonate`)
  }

  public async toggleCircuitBreakerState(paused: boolean): Promise<ApiResponse<{ paused: boolean }>> {
    return this.post<ApiResponse<{ paused: boolean }>>('/control-plane/circuit-breaker/toggle', { paused })
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

export type ContentOpportunityItem = ContentOpportunity

export interface CompetitorGapReport {
  brand_id: string
  total_gaps_identified: number
  whitespace_opportunities: Array<{
    pillar_id: string
    pillar_name: string
    strategic_advantage: string
    recommended_action: string
  }>
  competitor_saturated_themes: Array<{ theme: string; count: number }>
}

export interface CreativeDocumentItem {
  id: string
  organization_id: string
  workspace_id: string
  brand_id: string
  content_item_id?: string | null
  content_variant_id?: string | null
  name: string
  template_id: string
  aspect_ratio: string
  width: number
  height: number
  layers: Record<string, any>
  background_config: Record<string, any>
  rendered_asset_url?: string | null
  render_status: 'draft' | 'rendering' | 'rendered' | 'failed'
  render_engine: 'playwright_chromium' | 'deterministic_svg_fallback'
  error_message?: string | null
  created_at: string
  updated_at: string
}

export interface PillarBalanceItem {
  id: string
  name: string
  slug: string
  target_percentage: number
  actual_percentage: number
  post_count: number
  gap: number
  status: 'under_represented' | 'balanced' | 'over_represented'
  color_tag: string
}

export interface PillarBalanceReport {
  brand_id: string
  total_posts: number
  pillars: PillarBalanceItem[]
  recommended_pillar?: {
    id: string
    name: string
    color_tag: string
    target_percentage: number
  } | null
}

export interface PublishingDispatchItem {
  id: string
  organization_id: string
  workspace_id: string
  brand_id: string
  content_item_id: string
  content_variant_id: string
  social_account_id: string
  idempotency_key: string
  queue_name: string
  status: 'queued' | 'processing' | 'published' | 'failed' | 'cancelled'
  attempts: number
  platform_post_id: string | null
  platform_permalink: string | null
  payload_snapshot: Record<string, any>
  response_payload: Record<string, any> | null
  error_message: string | null
  error_code: string | null
  scheduled_at: string | null
  dispatched_at: string | null
  published_at: string | null
  created_at: string
  social_account?: {
    id: string
    platform: string
    account_name: string
    avatar_url: string | null
  } | null
  brand?: {
    id: string
    name: string
  } | null
  content_variant?: {
    id: string
    platform: string
    caption: string
  } | null
}

export interface SocialMessageItem {
  id: string
  organization_id: string
  workspace_id: string
  brand_id: string
  social_conversation_id: string
  direction: 'inbound' | 'outbound'
  platform_message_id: string
  parent_message_id?: string | null
  sender_type: 'customer' | 'agent' | 'ai_agent'
  sender_name: string
  message_text: string
  sentiment_score: number
  intent: 'general' | 'inquiry' | 'lead' | 'complaint' | 'praise' | 'crisis' | 'spam'
  ai_draft_reply?: string | null
  ai_draft_status: 'none' | 'pending' | 'accepted' | 'rejected' | 'modified'
  is_hidden_on_platform: boolean
  created_at: string
}

export interface SocialConversationItem {
  id: string
  organization_id: string
  workspace_id: string
  brand_id: string
  social_account_id: string
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter'
  conversation_type: 'post_comments' | 'direct_message' | 'mention'
  platform_thread_id: string
  platform_post_id?: string | null
  sender_id: string
  sender_name: string
  sender_avatar_url?: string | null
  status: 'open' | 'escalated' | 'resolved' | 'spam'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  last_message_at: string
  created_at: string
  latest_message?: SocialMessageItem | null
  messages?: SocialMessageItem[]
  social_account?: {
    id: string
    platform: string
    account_name: string
    username?: string
    avatar_url?: string | null
  } | null
  brand?: {
    id: string
    name: string
  } | null
}

export interface AnalyticsOverviewKPI {
  value: number
  delta_percent: number
}

export interface AnalyticsOverviewReport {
  period: {
    start_date: string
    end_date: string
    duration_days: number
  }
  kpis: {
    impressions: AnalyticsOverviewKPI
    reach: AnalyticsOverviewKPI
    engagements: AnalyticsOverviewKPI
    clicks: AnalyticsOverviewKPI
    follower_growth: AnalyticsOverviewKPI
    engagement_rate: AnalyticsOverviewKPI
  }
}

export interface AnalyticsTimeSeriesPoint {
  date: string
  day_name: string
  impressions: number
  reach: number
  engagements: number
  clicks: number
  engagement_rate: number
}

export interface PillarRoiItem {
  pillar_id: string
  pillar_name: string
  color_tag: string
  target_percentage: number
  post_count: number
  total_impressions: number
  total_engagements: number
  avg_engagement_rate: number
  roi_score: number
}

export interface HeatmapSlot {
  day_name: string
  day_index: number
  hour: number
  hour_formatted: string
  engagements: number
  post_count: number
  score: number
}

export interface BestPostingTimesReport {
  matrix: Array<Array<{
    day: number
    hour: number
    engagements: number
    post_count: number
    score: number
  }>>
  recommended_slots: HeatmapSlot[]
}

export interface TopPostAnalyticsItem {
  id: string
  platform: string
  platform_post_id: string
  likes_count: number
  comments_count: number
  shares_count: number
  clicks_count: number
  impressions_count: number
  reach_count: number
  engagement_rate: number
  published_at: string
  content_item?: {
    id: string
    title: string
    concept: string
  } | null
  content_variant?: {
    id: string
    platform: string
    caption: string
  } | null
  content_pillar?: {
    id: string
    name: string
    color_tag: string
  } | null
}

export interface BrandCadenceSlot {
  day: string
  time: string
  channel: string
  pillar_id?: string
}

export interface BrandCadenceSettingData {
  id?: string
  brand_id: string
  autopilot_mode: 'copilot_manual' | 'assisted_autopilot' | 'full_autonomous'
  weekly_schedule: BrandCadenceSlot[]
  novelty_threshold_cosine: number
  max_daily_posts_per_channel: number
  require_consensus_for_breaking_news: boolean
  is_active: boolean
  last_cycle_run_at?: string | null
}

export interface DiscoveredSourceItem {
  id: string
  source_type: string
  source_name: string
  source_url: string
  feed_url: string
  relevance_score: number
  authority_score: number
  last_scoured_at: string | null
  status: string
}

export interface SourceClusterItem {
  id: string
  primary_entity: string
  cluster_title: string
  summary: string | null
  article_count: number
  momentum_score: number
  source_domains: string[] | null
  has_consensus: boolean
}

export interface ContentFingerprintItem {
  id: string
  channel: string
  simhash_64: number
  concept_summary: string
  hook_text: string
  creative_template_id: string
  published_or_scheduled_at: string
}

export interface AutopilotRadarData {
  brand: {
    id: string
    name: string
    industry: string | null
  }
  cadence: BrandCadenceSettingData | null
  pulse: {
    last_scoured_at: string | null
    autopilot_mode: string
    is_active: boolean
    total_sources: number
    active_sources: number
    fingerprints_registered: number
  }
  emerging_clusters: SourceClusterItem[]
  recent_fingerprints: ContentFingerprintItem[]
}

export interface AutopilotCycleReport {
  status: string
  brand: string
  autopilot_mode: string
  sources_discovered: number
  opportunities_found: number
  empty_slots_found: number
  posts_minted: number
  duplicates_rejected_and_mutated: number
  cycle_timestamp: string
}

export interface PublicCmsData {
  branding: {
    platform_name: string
    tagline: string
    creator_name: string
    creator_url: string
    primary_logo_url: string
    dark_logo_url: string
    favicon_url: string
    primary_color_hex?: string | null
    accent_color_hex?: string | null
    custom_css?: string | null
    custom_head_scripts?: string | null
    announcement_banner?: {
      enabled?: boolean
      text?: string
      link?: string
    } | null
  }
  hero: {
    badge: string
    headline_line1: string
    headline_line2: string
    subtitle: string
    primary_cta_text: string
    primary_cta_link: string
    secondary_cta_text: string
    secondary_cta_link: string
    metrics_banner: Array<{ label: string; value: string }>
  }
  features: {
    section_title: string
    section_kicker: string
    items: Array<{ title: string; description: string; pill: string; icon: string }>
  }
  comparison: {
    section_title: string
    rows: Array<{ capability: string; autocanvas: string; generic_tools: string }>
  }
  pricing: {
    section_title: string
    currency_bdt_rate: number
    tiers: Array<{
      id: string
      name: string
      monthly_price_usd: number
      annual_price_usd: number
      description: string
      features: string[]
      highlighted: boolean
    }>
  }
  faq: {
    section_title: string
    items: Array<{ question: string; answer: string }>
  }
  seo?: {
    meta_title: string
    meta_description: string
    meta_keywords?: string
    canonical_url?: string
    og_image_url?: string
    twitter_handle?: string
    robots_policy?: string
    schema_organization_name?: string
    schema_organization_url?: string
    schema_logo_url?: string
    social_profiles?: string[]
  }
}

export interface CmsBlockItem {
  id?: string
  block_key: string
  title: string
  content_json: Record<string, any>
  is_active: boolean
  is_customized?: boolean
  updated_at?: string | null
}

export interface CustomThemeData {
  id?: string
  platform_name: string
  tagline: string
  creator_name: string
  creator_url: string
  primary_logo_url: string
  dark_logo_url: string
  favicon_url: string
  primary_color_hex?: string | null
  accent_color_hex?: string | null
  custom_css?: string | null
  announcement_banner?: {
    enabled: boolean
    text: string
    link?: string
  } | null
}

export interface AiPromptTemplateItem {
  id: string
  task_type: string
  version: number
  prompt_template: string
  model_override: string | null
  temperature: number
  max_tokens: number
  is_active: boolean
  change_summary: string | null
  created_at: string
}

export interface AiPromptGroup {
  task_type: string
  active_version: AiPromptTemplateItem | null
  versions: AiPromptTemplateItem[]
}

export interface CrawlerTuningData {
  simhash_hamming_cutoff: number
  vector_cosine_cutoff: number
  scrape_interval_minutes: number
  freshness_window_hours: number
  max_articles_per_cluster: number
  auto_publish_threshold: number
  discovery_enabled: boolean
}

export const apiClient = new ApiClient()

