/**
 * AutoCanvas — Structured Data (Schema.org) JSON-LD Graph Generators
 * Compliant with Schema.org Vocabulary v26.0+ and Google Rich Result specifications.
 */

export interface OrganizationSchemaOptions {
  name: string
  url: string
  logoUrl: string
  parentOrganizationName?: string
  parentOrganizationUrl?: string
  socialProfiles?: string[]
  contactEmail?: string
}

export interface SoftwareApplicationSchemaOptions {
  name: string
  url: string
  description: string
  priceCurrency?: string
  lowPrice?: string
  highPrice?: string
  featureList?: string[]
}

export interface FaqItem {
  question: string
  answer: string
}

export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Generate Organization entity JSON-LD.
 */
export function generateOrganizationSchema(opts: OrganizationSchemaOptions): Record<string, any> {
  const schema: Record<string, any> = {
    '@type': 'Organization',
    '@id': `${opts.url.replace(/\/$/, '')}/#organization`,
    name: opts.name,
    url: opts.url,
    logo: {
      '@type': 'ImageObject',
      '@id': `${opts.url.replace(/\/$/, '')}/#logo`,
      url: opts.logoUrl,
      caption: `${opts.name} Logo`,
    },
  }

  if (opts.parentOrganizationName && opts.parentOrganizationUrl) {
    schema.parentOrganization = {
      '@type': 'Organization',
      name: opts.parentOrganizationName,
      url: opts.parentOrganizationUrl,
    }
  }

  if (opts.socialProfiles && opts.socialProfiles.length > 0) {
    schema.sameAs = opts.socialProfiles
  }

  if (opts.contactEmail) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: opts.contactEmail,
    }
  }

  return schema
}

/**
 * Generate WebSite entity JSON-LD.
 */
export function generateWebSiteSchema(name: string, url: string): Record<string, any> {
  const cleanUrl = url.replace(/\/$/, '')
  return {
    '@type': 'WebSite',
    '@id': `${cleanUrl}/#website`,
    url: cleanUrl,
    name: name,
    publisher: {
      '@id': `${cleanUrl}/#organization`,
    },
    inLanguage: 'en-US',
  }
}

/**
 * Generate SoftwareApplication entity JSON-LD.
 */
export function generateSoftwareApplicationSchema(opts: SoftwareApplicationSchemaOptions): Record<string, any> {
  const cleanUrl = opts.url.replace(/\/$/, '')
  return {
    '@type': 'SoftwareApplication',
    '@id': `${cleanUrl}/#software`,
    name: opts.name,
    operatingSystem: 'All (Web-based Cloud SaaS)',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Social Media Management & Publishing Software',
    description: opts.description,
    publisher: {
      '@id': `${cleanUrl}/#organization`,
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: opts.priceCurrency || 'USD',
      lowPrice: opts.lowPrice || '29',
      highPrice: opts.highPrice || '199',
      offerCount: '3',
    },
    featureList: opts.featureList || [
      'Multi-Tenant Agency & Brand Workspaces',
      'Deterministic Chromium-Composited AI Creative Studio',
      'Multi-Network Scheduled Publishing (Facebook, Instagram, LinkedIn)',
      'Granular Client Approval Workflows & Public Review Links',
      'Unified Social Media Inbox & Engagement Hub',
      'Cross-Platform Engagement Analytics',
    ],
  }
}

/**
 * Generate FAQPage entity JSON-LD for Answer Engine Optimization (AEO).
 */
export function generateFaqSchema(items: FaqItem[], pageUrl: string): Record<string, any> | null {
  const validItems = items.filter((item) => item.question?.trim() && item.answer?.trim())
  if (validItems.length === 0) return null

  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl.replace(/\/$/, '')}/#faq`,
    mainEntity: validItems.map((item) => ({
      '@type': 'Question',
      name: item.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.trim(),
      },
    })),
  }
}

/**
 * Generate BreadcrumbList entity JSON-LD.
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, any> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Combine entity graphs into a unified Schema.org JSON-LD graph.
 */
export function generateUnifiedGraph(graphs: Array<Record<string, any> | null>): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@graph': graphs.filter(Boolean),
  }
}

