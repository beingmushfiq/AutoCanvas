import React, { useState, useEffect } from 'react'
import { MarketingNavbar } from './components/MarketingNavbar'
import { HeroSection } from './components/HeroSection'
import { PlatformPillarsSection } from './components/PlatformPillarsSection'
import { DeterministicComparisonSection } from './components/DeterministicComparisonSection'
import { PricingSection } from './components/PricingSection'
import { FaqSection } from './components/FaqSection'
import { MarketingFooter } from './components/MarketingFooter'
import { apiClient, type PublicCmsData } from '../../lib/api/client'

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
        <PlatformPillarsSection />
        <DeterministicComparisonSection />
        <PricingSection onSelectPlan={() => onOpenAuth('register')} />
        <FaqSection />
      </main>

      {/* Public Footer */}
      <MarketingFooter />
    </div>
  )
}

