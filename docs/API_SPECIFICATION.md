# AutoCanvas — REST API Specification
**Version:** 1.0.0 | **Base URL:** `/api/v1` | **Protocol:** HTTPS / JSON | **Date:** 2026-11-10

---

## 1. Global Conventions

### 1.1 Headers
All authenticated API requests must supply:
- `Authorization: Bearer <sanctum_token>`
- `Accept: application/json`
- `Content-Type: application/json`
- `X-Workspace-Id: <ulid>` (Optional: Defaults to user's active workspace)

### 1.2 Standard Success Response Structure
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-11-10T01:00:00Z",
    "request_id": "req_01jb7..."
  }
}
```

### 1.3 Standard Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The given data was invalid.",
    "details": {
      "name": ["The brand name field is required."]
    }
  },
  "meta": {
    "timestamp": "2026-11-10T01:00:00Z",
    "request_id": "req_01jb7..."
  }
}
```

---

## 2. Core Endpoint Matrix

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **System** | `GET` | `/api/v1/health` | Service health, DB & Redis ping |
| **Auth** | `POST` | `/api/v1/auth/register` | New user + initial organization |
| **Auth** | `POST` | `/api/v1/auth/login` | Email/password session creation |
| **Auth** | `POST` | `/api/v1/auth/logout` | Revoke active token |
| **Auth** | `GET` | `/api/v1/auth/me` | Current user & tenant memberships |
| **Organizations**| `GET` | `/api/v1/organizations` | List user organizations |
| **Workspaces**| `GET` | `/api/v1/workspaces` | List active organization workspaces |
| **Brands** | `GET` | `/api/v1/brands` | List brands in current workspace |
| **Brands** | `POST` | `/api/v1/brands` | Create new brand identity profile |
| **Brands** | `GET` | `/api/v1/brands/{id}` | Brand profile, visual guide & voice |
| **Knowledge** | `POST` | `/api/v1/brands/{id}/sources` | Ingest document or URL |
| **Strategy** | `POST` | `/api/v1/brands/{id}/strategies` | Generate AI content calendar |
| **Content** | `POST` | `/api/v1/content/generate` | Generate platform-specific posts |
| **Content** | `POST` | `/api/v1/content/{id}/approve` | Human approval gate |
| **Creative** | `POST` | `/api/v1/creatives/render` | Trigger Chromium render job |
| **Publishing** | `POST` | `/api/v1/publishing/schedule`| Schedule post with idempotency key |
| **Connectors** | `GET` | `/api/v1/connectors/{platform}/auth` | Initiate OAuth flow |
| **Community** | `GET` | `/api/v1/inbox` | Unified message and comment feed |
| **Analytics** | `GET` | `/api/v1/analytics/overview` | Cross-platform performance data |
| **Automations**| `POST` | `/api/v1/automations/emergency-pause` | Halt all autonomous publishing |

