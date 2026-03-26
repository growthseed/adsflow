# AdsFlow — Design Document for Google Ads API Access

**Document Version:** 1.0
**Date:** March 26, 2026
**Company:** Efeito Digital Marketing e Comunicacao LTDA
**Application:** AdsFlow
**Contact:** jw@efeito.digital

---

## 1. Overview

### 1.1 Application Description

AdsFlow is an internal web application built by Efeito Digital Marketing e Comunicacao LTDA to automate campaign management, performance reporting, and data analysis across Google Ads, Google Analytics 4, and Google Search Console.

The tool serves the internal marketing operations team, enabling them to:

- Access and monitor Google Ads campaigns, ad groups, keywords, and their performance metrics
- Generate automated weekly and monthly performance reports for internal review and client delivery
- Read Google Analytics 4 traffic and conversion data to correlate ad performance with website behavior
- Read Google Search Console data to analyze organic search performance alongside paid campaigns
- Provide a unified dashboard combining paid and organic performance metrics

### 1.2 Target Users

AdsFlow is used exclusively by the internal team of Efeito Digital Marketing e Comunicacao LTDA. There is no public-facing access or third-party usage. The application is accessed at `https://adsflow.efeito.digital` by authenticated team members only.

**User roles:**
- **Super Admin** — Full access to all clients, campaigns, and settings
- **Admin** — Access to assigned clients and campaign management
- **Analyst** — Read-only access to reports and dashboards
- **Viewer** — Read-only access to specific client dashboards

### 1.3 Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 3.6 |
| Backend/Database | Supabase (PostgreSQL + Row Level Security + Auth) |
| Hosting | Vercel |
| Automation | N8N (self-hosted workflow automation) |
| Authentication | Supabase Auth + Google OAuth 2.0 |

---

## 2. Architecture

### 2.1 System Architecture Diagram

```
+------------------+     +-------------------+     +--------------------+
|                  |     |                   |     |                    |
|   AdsFlow Web    |---->|   N8N Workflows   |---->|   Google Ads API   |
|   (React SPA)    |     |   (Server-side)   |     |   (v17)            |
|                  |     |                   |     +--------------------+
+--------+---------+     +--------+----------+
         |                        |               +--------------------+
         |                        +-------------->|   GA4 Data API     |
         |                        |               |   (v1beta)         |
         v                        |               +--------------------+
+------------------+              |
|                  |              |               +--------------------+
|   Supabase       |              +-------------->|   Search Console   |
|   (PostgreSQL)   |                              |   API (v3)         |
|   - RLS enabled  |                              +--------------------+
|   - Auth         |
+------------------+
```

### 2.2 Component Responsibilities

**AdsFlow Web Application (Frontend)**
- User interface for viewing campaigns, metrics, and reports
- Does NOT directly call Google APIs — all API calls are proxied through N8N
- Does NOT store or handle Google API secrets (client_secret, developer_token)
- Initiates OAuth 2.0 authorization flow and receives the authorization code
- Sends the authorization code to N8N for token exchange

**N8N Workflow Server (Backend Proxy)**
- Handles all communication with Google APIs
- Stores and manages sensitive credentials (client_secret, developer_token, refresh_tokens)
- Performs OAuth 2.0 token exchange and refresh
- Fetches campaign data, insights, keywords, GA4 metrics, and Search Console data
- Returns sanitized data to the frontend

**Supabase (Database)**
- Stores synced campaign data, metrics, and report configurations
- Row Level Security (RLS) ensures data isolation between clients
- Supabase Auth manages user authentication
- Does NOT store Google API secrets (only encrypted access/refresh tokens per account)

### 2.3 Deployment

- **Frontend:** Deployed on Vercel at `https://adsflow.efeito.digital`
- **N8N:** Self-hosted on EasyPanel at `https://ia-kommo-n8n.xl78rn.easypanel.host`
- **Database:** Supabase managed PostgreSQL (region: South America East 1)

---

## 3. Data Flow

### 3.1 OAuth 2.0 Authorization Flow

```
1. User clicks "Connect Google Ads" in AdsFlow
2. AdsFlow redirects to Google OAuth consent screen:
   - client_id: 30660281494-qr903vcv9j9nidns90lve7k5tspqp01e.apps.googleusercontent.com
   - redirect_uri: https://adsflow.efeito.digital/auth/google/callback
   - scope: (see Section 3.2)
   - access_type: offline
   - prompt: consent
3. User grants permission on Google's consent screen
4. Google redirects back to AdsFlow with authorization code
5. AdsFlow sends the code to N8N webhook: /adsflow/google-token-exchange
6. N8N exchanges the code for access_token + refresh_token using client_secret
7. N8N returns tokens to AdsFlow (client_secret never reaches the browser)
8. AdsFlow stores the encrypted tokens in Supabase (google_accounts table)
```

### 3.2 OAuth Scopes Requested

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/adwords.readonly` | Read Google Ads campaigns, ad groups, keywords, and performance metrics |
| `https://www.googleapis.com/auth/analytics.readonly` | Read Google Analytics 4 property data (sessions, users, conversions) |
| `https://www.googleapis.com/auth/webmasters.readonly` | Read Google Search Console data (queries, clicks, impressions, position) |

**Note:** All scopes are **read-only**. AdsFlow does not create, modify, or delete any campaigns, ads, or analytics configurations.

### 3.3 Data Sync Flow

```
1. Scheduled sync (daily via N8N cron) or manual trigger from AdsFlow UI
2. AdsFlow sends sync request to N8N with: google_account_id, date_range
3. N8N retrieves the stored access_token (refreshes if expired)
4. N8N calls Google Ads API (GAQL queries) to fetch:
   - Campaign list (name, status, budget, type)
   - Campaign performance metrics (impressions, clicks, cost, conversions, ROAS)
   - Keyword performance (keyword text, match type, quality score, CPC)
5. N8N calls GA4 Data API to fetch:
   - Sessions, users, pageviews by source/medium
   - Conversion events and revenue
6. N8N calls Search Console API to fetch:
   - Search queries, pages, clicks, impressions, CTR, position
7. N8N returns the data to AdsFlow
8. AdsFlow upserts the data into Supabase tables with client_id isolation
9. AdsFlow dashboards display the synced data
```

### 3.4 Data Retention

- Synced data is stored in Supabase with daily granularity
- Historical data is retained for up to 24 months for trend analysis
- Users can request data deletion at any time
- No Google user data is shared with third parties

---

## 4. API Usage

### 4.1 Google Ads API

**API Version:** v17
**Access Level:** Read-only
**MCC Account:** Efeito Digital (101-181-7676)

**GAQL Queries Used:**

1. **Campaign List:**
```sql
SELECT campaign.id, campaign.name, campaign.status,
       campaign.campaign_budget, campaign.bidding_strategy_type,
       campaign.advertising_channel_type
FROM campaign
WHERE campaign.status != 'REMOVED'
```

2. **Campaign Performance (date-ranged):**
```sql
SELECT campaign.id, campaign.name, segments.date,
       metrics.impressions, metrics.clicks, metrics.cost_micros,
       metrics.conversions, metrics.conversions_value,
       metrics.ctr, metrics.average_cpc,
       metrics.search_impression_share,
       metrics.video_views, metrics.video_view_rate
FROM campaign
WHERE segments.date BETWEEN '{start_date}' AND '{end_date}'
```

3. **Keyword Performance:**
```sql
SELECT ad_group_criterion.keyword.text,
       ad_group_criterion.keyword.match_type,
       ad_group_criterion.quality_info.quality_score,
       metrics.impressions, metrics.clicks, metrics.cost_micros,
       metrics.conversions, metrics.ctr
FROM keyword_view
WHERE segments.date DURING LAST_30_DAYS
```

**Rate Limiting:** AdsFlow respects Google Ads API rate limits. Sync operations are throttled to avoid exceeding quotas. Daily syncs are scheduled during off-peak hours.

### 4.2 Google Analytics 4 Data API

**API Version:** v1beta
**Access Level:** Read-only

**Report Request:**
```json
{
  "dateRanges": [{"startDate": "2026-03-01", "endDate": "2026-03-26"}],
  "dimensions": [
    {"name": "date"},
    {"name": "sessionSource"},
    {"name": "sessionMedium"},
    {"name": "deviceCategory"}
  ],
  "metrics": [
    {"name": "sessions"},
    {"name": "totalUsers"},
    {"name": "newUsers"},
    {"name": "screenPageViews"},
    {"name": "engagedSessions"},
    {"name": "engagementRate"},
    {"name": "averageSessionDuration"},
    {"name": "bounceRate"},
    {"name": "conversions"},
    {"name": "totalRevenue"}
  ]
}
```

### 4.3 Google Search Console API

**API Version:** v3
**Access Level:** Read-only

**Search Analytics Request:**
```json
{
  "startDate": "2026-03-01",
  "endDate": "2026-03-26",
  "dimensions": ["query", "page", "device", "country"],
  "rowLimit": 5000
}
```

---

## 5. Security

### 5.1 Credential Management

| Credential | Storage Location | Access |
|-----------|-----------------|--------|
| Google OAuth Client ID | Frontend environment variable (public) | Browser |
| Google OAuth Client Secret | N8N server only (never in browser) | Server-side only |
| Google Ads Developer Token | N8N server only | Server-side only |
| User Access Tokens | Supabase (encrypted column, RLS protected) | Per-user, server-mediated |
| User Refresh Tokens | Supabase (encrypted column, RLS protected) | Per-user, server-mediated |

**Key security principles:**
- The `client_secret` and `developer_token` are NEVER exposed to the browser or frontend code
- All Google API calls are proxied through the N8N backend server
- Token exchange and refresh operations happen server-side only
- Access tokens are stored in Supabase with Row Level Security — users can only access their own tokens

### 5.2 Authentication & Authorization

- **User Authentication:** Supabase Auth with email/password
- **Google OAuth:** Authorization Code flow with PKCE
- **Session Management:** JWT tokens with automatic refresh
- **Role-Based Access Control:** 4 roles (super_admin, admin, analyst, viewer) with hierarchical permissions
- **Row Level Security:** Every database query is filtered by `client_id` membership — users can only see data for clients they are assigned to

### 5.3 Data Protection

- All data in transit is encrypted via TLS 1.3 (HTTPS)
- Database at rest encryption provided by Supabase (AES-256)
- No Google user data is shared with third parties
- No data is sold or used for advertising purposes
- Users can disconnect their Google accounts and request data deletion at any time
- Application complies with Google API Services User Data Policy

### 5.4 Minimal Data Access

AdsFlow requests only **read-only** scopes. The application:
- Does NOT create, modify, or delete campaigns or ads
- Does NOT access user personal information (email, profile, contacts)
- Does NOT access Google Drive, Gmail, or other non-analytics services
- Only reads campaign performance metrics necessary for reporting

### 5.5 Token Lifecycle

```
1. Initial authorization → access_token (1 hour) + refresh_token (persistent)
2. Access token expires → N8N automatically refreshes using refresh_token
3. User disconnects → tokens are deleted from Supabase
4. User revokes access in Google Account → refresh fails, user must re-authorize
```

### 5.6 Incident Response

In case of a security incident:
- All affected tokens will be immediately revoked
- Users will be notified and required to re-authorize
- The incident will be reported to Google per API Terms of Service
- Contact: jw@efeito.digital

---

## 6. Compliance

### 6.1 Google API Services User Data Policy

AdsFlow complies with the Google API Services User Data Policy:
- Data is used only for the purposes described in this document (campaign reporting and analysis)
- No data is transferred to third parties
- Users are clearly informed about what data is accessed and why
- Users can revoke access at any time

### 6.2 Privacy Policy

A privacy policy is available at: `https://adsflow.efeito.digital/privacy`
(To be published before production launch)

### 6.3 Terms of Service

Terms of service are available at: `https://adsflow.efeito.digital/terms`
(To be published before production launch)

---

## 7. Company Information

**Legal Name:** Efeito Digital Marketing e Comunicacao LTDA
**Website:** https://efeito.digital
**Application URL:** https://adsflow.efeito.digital
**Contact Email:** jw@efeito.digital
**Google Ads MCC:** 101-181-7676
**Google Cloud Project:** AdsFlow (project linked to adsefeito@gmail.com)

---

*This document was prepared for Google Ads API access review. For questions or additional information, please contact jw@efeito.digital.*
