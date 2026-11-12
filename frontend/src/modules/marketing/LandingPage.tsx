import React, { useState, useEffect, useMemo } from 'react'
import { MarketingNavbar } from './components/MarketingNavbar'
import { HeroSection } from './components/HeroSection'
import { PlatformPillarsSection } from './components/PlatformPillarsSection'
import { DeterministicComparisonSection } from './components/DeterministicComparisonSection'
import { PricingSection } from './components/PricingSection'
import { FaqSection } from './components/FaqSection'
import { MarketingFooter } from './components/MarketingFooter'
import { apiClient, type PublicCmsData } from '../../lib/api/client'
import { useDocumentHead } from '../../lib/seo/useDocumentHead'
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema,
  generateFaqSchema,
  generateUnifiedGraph,
} from '../../lib/seo/schemaGenerators'

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void
  onEnterApp?: () => void
  isAuthenticated?: boolean
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onEnterApp,
  isAuthenticated = false,
}) => {
  const [cmsData, setCmsData] = useState<PublicCmsData | null>(null)

  useEffect(() => {
    let isMounted = true
    apiClient
      .getPublicCmsData()
      .then((res) => {
        if (isMounted && res.data) {
          setCmsData(res.data)
        }
      })
      .catch((err) => {
        console.warn('Using factory landing page defaults:', err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Synchronize dynamic head metadata and Schema.org knowledge graph
  const seo = cmsData?.seo
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autocanvas.devcenterpoint.com'
  const canonicalUrl = seo?.canonical_url || baseUrl

  const schemaGraph = useMemo(() => {
    const org = generateOrganizationSchema({
      name: seo?.schema_organization_name || 'AutoCanvas',
      url: canonicalUrl,
      logoUrl: seo?.schema_logo_url || `${baseUrl}/brand/logo.svg`,
      parentOrganizationName: 'DevCenterPoint',
      parentOrganizationUrl: 'https://devcenterpoint.com',
      socialProfiles: seo?.social_profiles || [
        'https://www.linkedin.com/company/devcenterpoint',
        'https://twitter.com/devcenterpoint',
      ],
      contactEmail: 'hello@devcenterpoint.com',
    })

    const website = generateWebSiteSchema(
      seo?.meta_title || 'AutoCanvas — Autonomous Social Media Management',
      canonicalUrl
    )

    const software = generateSoftwareApplicationSchema({
      name: 'AutoCanvas',
      url: canonicalUrl,
      description:
        seo?.meta_description ||
        'Enterprise-grade multi-tenant social media management platform featuring deterministic AI creative generation, multi-brand workspace isolation, and idempotent cross-platform publishing.',
    })

    const faqItems = cmsData?.faq?.items || []
    const faqSchema = faqItems.length > 0 ? generateFaqSchema(faqItems, canonicalUrl) : null

    return generateUnifiedGraph([org, website, software, faqSchema])
  }, [seo, cmsData?.faq?.items, canonicalUrl, baseUrl])

  useDocumentHead({
    title: seo?.meta_title || 'AutoCanvas — Autonomous Social Media Management & Creative Studio',
    description:
      seo?.meta_description ||
      'Enterprise-grade multi-tenant social media management platform featuring deterministic AI creative generation, multi-brand workspace isolation, and idempotent cross-platform publishing.',
    keywords:
      seo?.meta_keywords ||
      'AI social media management, multi-brand social publishing, social media scheduling, agency approval workflow, deterministic AI graphics, AutoCanvas, DevCenterPoint',
    canonicalUrl,
    robots: seo?.robots_policy || 'index, follow',
    ogTitle: seo?.meta_title,
    ogDescription: seo?.meta_description,
    ogImage: seo?.og_image_url || '/brand/og-share.png',
    twitterSite: seo?.twitter_handle || '@devcenterpoint',
    schemaJsonLd: schemaGraph,
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-brand-accent selection:text-interactive-primary-fg">
      {/* Sticky Marketing Header */}
      <MarketingNavbar
        onOpenAuth={onOpenAuth}
        onEnterApp={onEnterApp}
        isAuthenticated={isAuthenticated}
        announcement={cmsData?.branding?.announcement_banner}
      />

      {/* Main Marketing Sections */}
      <main className="flex-1">
        <HeroSection
          onGetStarted={() => onOpenAuth('register')}
          onExploreDemo={onEnterApp || (() => onOpenAuth('register'))}
          cmsHero={cmsData?.hero}
        />
        <PlatformPillarsSection cmsFeatures={cmsData?.features} />
        <DeterministicComparisonSection cmsComparison={cmsData?.comparison} />
        <PricingSection
          onSelectPlan={() => onOpenAuth('register')}
          cmsPricing={cmsData?.pricing}
        />
        <FaqSection cmsFaq={cmsData?.faq} />
      </main>

      {/* Public Footer */}
      <MarketingFooter />
    </div>
  )
}
