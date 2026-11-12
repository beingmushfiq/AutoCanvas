import { useEffect } from 'react'

export interface DocumentHeadOptions {
  title?: string
  description?: string
  keywords?: string
  canonicalUrl?: string
  robots?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  ogType?: string
  twitterCard?: string
  twitterSite?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  schemaJsonLd?: Record<string, any> | null
}

function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content?: string) {
  if (!content) return

  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attributeName, attributeValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonicalLink(url?: string) {
  if (!url) return

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

function setJsonLdScript(schema?: Record<string, any> | null) {
  const SCRIPT_ID = 'autocanvas-schema-graph'
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null

  if (!schema) {
    if (script) script.remove()
    return
  }

  if (!script) {
    script = document.createElement('script')
    script.id = SCRIPT_ID
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = JSON.stringify(schema, null, 2)
}

/**
 * Custom React hook to synchronize document head metadata during client-side SPA navigation.
 */
export function useDocumentHead(options: DocumentHeadOptions) {
  useEffect(() => {
    if (options.title) {
      document.title = options.title
    }

    if (options.description) {
      setMetaTag('name', 'description', options.description)
    }

    if (options.keywords) {
      setMetaTag('name', 'keywords', options.keywords)
    }

    if (options.robots) {
      setMetaTag('name', 'robots', options.robots)
    }

    const canonical = options.canonicalUrl || window.location.origin + window.location.pathname
    setCanonicalLink(canonical)

    // OpenGraph
    setMetaTag('property', 'og:title', options.ogTitle || options.title)
    setMetaTag('property', 'og:description', options.ogDescription || options.description)
    setMetaTag('property', 'og:url', options.ogUrl || canonical)
    setMetaTag('property', 'og:type', options.ogType || 'website')
    if (options.ogImage) {
      setMetaTag('property', 'og:image', options.ogImage)
    }
    setMetaTag('property', 'og:site_name', 'AutoCanvas')

    // Twitter Card
    setMetaTag('name', 'twitter:card', options.twitterCard || 'summary_large_image')
    if (options.twitterSite) {
      setMetaTag('name', 'twitter:site', options.twitterSite)
      setMetaTag('name', 'twitter:creator', options.twitterSite)
    }
    setMetaTag('name', 'twitter:title', options.twitterTitle || options.title)
    setMetaTag('name', 'twitter:description', options.twitterDescription || options.description)
    if (options.twitterImage || options.ogImage) {
      setMetaTag('name', 'twitter:image', options.twitterImage || options.ogImage)
    }

    // Schema.org Structured Data
    if (options.schemaJsonLd) {
      setJsonLdScript(options.schemaJsonLd)
    }
  }, [
    options.title,
    options.description,
    options.keywords,
    options.canonicalUrl,
    options.robots,
    options.ogTitle,
    options.ogDescription,
    options.ogImage,
    options.ogUrl,
    options.ogType,
    options.twitterCard,
    options.twitterSite,
    options.twitterTitle,
    options.twitterDescription,
    options.twitterImage,
    JSON.stringify(options.schemaJsonLd),
  ])
}

