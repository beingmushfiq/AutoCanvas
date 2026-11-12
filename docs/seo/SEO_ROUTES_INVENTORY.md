# AutoCanvas — Complete SEO Routes & Indexation Inventory

> **Document Version:** 1.0.0  
> **Target Production Base:** `https://autocanvas.devcenterpoint.com`  
> **Crawl Standard:** RFC 9309 Robots Exclusion Protocol & Google Search Central Guidelines

---

## 1. Route Classification Matrix

Every route in the AutoCanvas ecosystem is explicitly categorized to prevent accidental private data indexation while maximizing the discoverability of public marketing assets.

| Route Path | Classification | Robots Directive | Header Enforced | In Sitemap | Priority | ChangeFreq | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Public Indexable | `index, follow` | Standard | **Yes** | 1.0 | `weekly` | Primary marketing landing page & feature overview |
| `/pricing` | Public Indexable | `index, follow` | Standard | **Yes** | 0.9 | `monthly` | Subscription tiers, feature limits, & enterprise quotes |
| `/features/creative-studio` | Public Indexable | `index, follow` | Standard | **Yes** | 0.8 | `monthly` | AI deterministic creative studio deep dive |
| `/features/publishing-calendar`| Public Indexable | `index, follow` | Standard | **Yes** | 0.8 | `monthly` | Multi-network calendar & scheduling overview |
| `/solutions/agencies` | Public Indexable | `index, follow` | Standard | **Yes** | 0.8 | `monthly` | Agency multi-tenancy, white-label, client approvals |
| `/docs` | Public Indexable | `index, follow` | Standard | **Yes** | 0.7 | `weekly` | Platform documentation & API reference index |
| `/terms` | Public Indexable | `index, follow` | Standard | **Yes** | 0.3 | `yearly` | Terms of service |
| `/privacy` | Public Indexable | `index, follow` | Standard | **Yes** | 0.3 | `yearly` | Privacy policy & data protection guarantees |
| `/sitemap.xml` | Public Machine Doc | `index, follow` | XML Content-Type| **No** | N/A | N/A | Dynamic RFC-compliant XML sitemap |
| `/robots.txt` | Public Machine Doc | `index, follow` | Text Content-Type| **No** | N/A | N/A | RFC 9309 Robots Exclusion Protocol file |
| `/login` | Public Noindex | `noindex, nofollow` | `X-Robots-Tag` | **No** | N/A | N/A | User sign-in modal/route |
| `/register` | Public Noindex | `noindex, nofollow` | `X-Robots-Tag` | **No** | N/A | N/A | Tenant registration modal/route |
| `/reset-password` | Public Noindex | `noindex, nofollow` | `X-Robots-Tag` | **No** | N/A | N/A | Password recovery and reset confirmation |
| `/oauth/callback` | Public Noindex | `noindex, nofollow` | `X-Robots-Tag` | **No** | N/A | N/A | OAuth 2.0 provider callback exchange |
| `/workspace/*` | Authenticated Noindex | `noindex, nofollow, noarchive` | `X-Robots-Tag` | **No** | N/A | N/A | Tenant dashboard, calendar, brand kits, assets |
| `/master-control/*` | Private Admin Noindex | `noindex, nofollow, noarchive` | `X-Robots-Tag` | **No** | N/A | N/A | Platform superadmin control plane |
| `/api/*` | API Endpoints | `noindex, nofollow, noarchive` | `X-Robots-Tag` | **No** | N/A | N/A | All REST endpoints (Auth, CMS, Tenant, Connectors) |
| `/storage/*` | Private Asset Storage | `noindex, nofollow, noarchive` | `robots.txt Disallow` | **No** | N/A | N/A | Raw uploaded media and rendered raster bundles |

---

## 2. Dynamic Route Rules
1. **Trailing Slash Normalization:** All URLs are canonicalized without trailing slashes (except root `/`).
2. **Case Sensitivity:** Route paths are strictly lowercase.
3. **Query Parameter Stripping:** Marketing URLs stripping session tokens and tracking parameters (`?utm_*`, `?ref=*`) when referencing canonical `<link rel="canonical">`.

