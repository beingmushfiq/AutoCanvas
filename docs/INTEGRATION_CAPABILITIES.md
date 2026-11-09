# AutoCanvas — Social Connector Capability Matrix
**Version:** 1.0.0 | **Last Audit:** 2026-11-10

This document tracks the technical feasibility, required permissions, and official API support across each target network.

| Platform | Primary API / Version | Target Entity | Auth Method | Capabilities Supported | Target Phase |
|---|---|---|---|---|---|
| **Facebook** | Graph API v21.0+ | Facebook Page | OAuth 2.0 (Page Access Token) | Text, Single Image, Multi-image, Video, Page Insights, Comments, Webhooks | Phase 5 |
| **Instagram** | Instagram Graph API v21.0+ | Instagram Professional Account | Meta Business OAuth | Single Image, Carousel (up to 10), Reels/Video, Insights, Comments | Phase 5 |
| **LinkedIn** | LinkedIn REST Posts API (202410) | Organization / Company Page | OAuth 2.0 with `w_organization_social` | Text, Single Image, Document/Carousel, Company Analytics, Comments | Phase 5 |
| **YouTube** | YouTube Data API v3 | YouTube Channel | Google OAuth 2.0 (`youtube.upload`) | Video Upload, Shorts, Video Analytics, Comment Threads | Phase 8 |
| **TikTok** | Content Posting API v2 | Creator / Business Account | TikTok Login Kit (`video.publish`) | Video Direct Post, Video Analytics (Audited clients required) | Phase 8 |
| **X (Twitter)**| X API v2 | X Profile | OAuth 2.0 (`tweet.write`, `users.read`) | Text, Images (Requires Pro/Enterprise tier for high volume) | Phase 8 |
| **Pinterest** | Pinterest API v5 | Pinterest Business Board | OAuth 2.0 (`boards:write`, `pins:write`) | Image Pins, Carousel Pins, Board Analytics | Phase 8 |
| **Threads** | Threads API v1 | Threads Profile | Meta Threads OAuth | Text, Image, Video, Insights, Replies | Phase 8 |

---

## Technical Feasibility Notes

1. **Meta (Facebook & Instagram):** Requires an approved Meta App with `pages_manage_posts`, `pages_read_engagement`, `instagram_content_publish`. Development runs in Developer Sandbox mode with Test Pages until app review is completed.
2. **LinkedIn:** Requires LinkedIn Developer Application with "Community Management API" or "Share on LinkedIn" product approved.
3. **Zero Fake Implementation Rule:** Connector adapters report status (`connected`, `token_expired`, `pending_approval`, `missing_credentials`). If API approval is pending, the UI displays real diagnostic notices rather than simulated green checkmarks.

