# Overview

Adiology is a Google Ads campaign builder platform that automates the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to streamline campaign setup for various business needs, including features like real-time expense tracking and web templates. The vision is to simplify Google Ads campaign management, opening up market potential for efficient ad deployment.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite, utilizing Radix UI and Tailwind CSS.
- **UI/UX**: Component-based architecture, multi-step wizards for Campaign and Ads Builders, client-side routing, React hooks, and context-based notification system. Includes a SuperAdmin Console, an AI-powered Web Template Editor, and Real-time Expense Tracking.
- **Ads Search (Google Ads Transparency)**: Standalone menu item in sidebar for competitor ad research. Uses Playwright-based web scraper to fetch real ads from Google Ads Transparency Center (adstransparency.google.com). Features async job queue system with hourly cron job processing. Users submit keyword searches (up to 5), see "check back in 1 hour" message, and results are stored in database. Cached results valid for 24 hours. Database tables: ad_search_requests, ad_search_results. Backend uses processAdSearchRequest() for scraping and cronScheduler for hourly runs.
- **Campaign Builder (CampaignBuilder3)**: 7-step wizard: 1) URL Input with AI analysis, 2) Structure selection, 3) Keywords, 4) Ads & Extensions, 5) Geo Target, 6) CSV Generation, 7) Success. Supports SKAG, STAG, Intent-Based, and Alpha-Beta campaign structures with automated naming, keyword generation (410-710 keywords), ad generation, and geo-targeting. Analysis results displayed with detailed logs before proceeding.
- **Saved Campaigns (CampaignHistoryView)**: Displays all saved campaigns with grid/list view toggle, search, and filtering by structure type, status, and step. Features Google Ads OAuth integration for direct campaign push. Users can connect their Google Ads account, select an account from dropdown, and push campaigns directly to Google Ads (campaigns are created as PAUSED for safety). Backend endpoints: `/api/google-ads/status`, `/api/google-ads/accounts`, `/api/google-ads/auth-url`, `/api/google-ads/push-campaign`. Database table: google_ads_tokens for OAuth token storage.
- **Web Template Editor**: Sections-based visual editor for website customization (SectionsEditor.tsx). Features 13 built-in section types (Hero, Features, Services, Testimonials, Team, FAQ, Pricing, Gallery, Blog, Partners, CTA, Contact, About). Users add/remove sections with visual buttons, edit content through modal dialogs, and customize text, headings, colors, and background. No drag-and-drop - clean, intuitive interface. Includes save and HTML export functionality.
- **Data Export**: Master 183-column Google Ads Editor CSV format (googleAdsEditorCSVExporterV5.ts). Full compatibility for immediate import. Includes:
  - **Campaign Level (18 cols)**: Campaign, Daily Budget, Type, Bid Strategy, Networks, EU Political Ads, Device Bid Adjustments, Dates, Status, Labels
  - **Ad Group Level (5 cols)**: Ad Group, Max CPC, Status, Labels, Default Max CPC
  - **Keywords (12 cols)**: Keyword, Criterion Type, Status, Max CPC Bid, Labels, Bid Modifier, Negative Keywords
  - **Audience Targeting (6 cols)**: Audience ID, Name, Type, Status, Bid Modifier, Exclusion Status
  - **Location Targeting (12 cols)**: Location, Type, Status, Bid Adjustment, City, State/Region, Postal Code, Country Code, Lat/Long, Radius
  - **RSA Ads (23 cols)**: Headlines 1-15, Descriptions 1-4, Path 1-2, Final URL, Mobile URL, Tracking
  - **Call Extensions (5 cols)**: PhoneNumber, VerificationURL, Status, Scheduling, Call Only Ads
  - **Sitelink Extensions (28 cols)**: 4 Sitelinks with Text, Description 1-2, Final URL, Status, Start/End Date
  - **Callout Extensions (16 cols)**: 4 Callouts with Text, Status, Start/End Date
  - **Structured Snippets (6 cols)**: Header, Values, Status for multiple snippets
  - **Price Extensions (19 cols)**: Type, Qualifier, up to 4 Items with Header, Price, Final URL
  - **Promotion Extensions (14 cols)**: Target, Discount Modifier, Percent/Amount Off, Final URL, Status, Dates
  - **App Extensions (5 cols)**: App ID, Store, Link Text, Final URL, Status
  - **Message Extensions (6 cols)**: Text, Final URL, Business Name, Country Code, Phone Number, Status
  - **Lead Form Extensions (6 cols)**: ID, Name, Headline, Description, Call-to-action, Status
  - **Image/Video Assets (7 cols)**: Image/Video Asset Name, URL, Status
  - **Business Profile (5 cols)**: Location, Name, Address, Phone, Website
  - Master CSV template stored at: src/utils/masterCSVTemplate.csv

## Backend
- **Primary API**: Hono (Node.js/TypeScript) for all API endpoints on port 3001, with optional FastAPI (Python) for legacy ad generation.
- **URL Analyzer**: Cheerio-based lightweight HTML parser (server/urlAnalyzerLite.ts) for website analysis. Works in production without Playwright browser dependencies. Extracts headings, CTAs, forms, SEO signals, contact info, services, and more. Integrated with OpenAI for AI-powered marketing insights.
- **Background Processing**: Celery with Redis for asynchronous keyword generation and AI-powered keyword suggestions based on URL and campaign intent.
- **Ads Transparency Scraper**: Playwright-based web scraper (server/adsTransparencyScraper.ts) fetches competitor ads from Google Ads Transparency Center. Hourly cron job (server/cronScheduler.ts) processes pending requests. Results stored in PostgreSQL (ad_search_requests, ad_search_results tables). Note: Requires development environment (Playwright not available in production).
- **Edge Functions**: Supabase Edge Functions (Deno/TypeScript) for health checks, payment processing, and campaign history storage.
- **Fallback Systems**: Python-based ad generator, local storage, and a three-tier save system (Edge Function → Database → localStorage).
- **Business Logic**: Automatic business type detection, intent classification for ad copy, service/product-specific ad templates, and Dynamic Keyword Insertion (DKI).
- **Ad Generation Guardrails**: All ad creation follows official Google Search Ads policies via `googleAdsRules.ts`:
  - **RSA**: 3-15 headlines (30 chars each, all must be substantially different), 2-4 descriptions (90 chars each), display paths (15 chars)
  - **DKI**: Proper `{KeyWord:Default}` syntax, single DKI per field, valid default text within limits
  - **Call-Only**: Exactly 2 headlines, 2 descriptions, 25-char business name, valid phone number (no premium rates)
  - **Uniqueness Check**: Levenshtein distance algorithm prevents near-duplicate headlines/descriptions
  - **Ad Strength Calculation**: Scores based on headline count, description count, keyword inclusion, uniqueness

## Data Storage
- **Primary Database**: Supabase (PostgreSQL) for user data, campaign history, subscriptions, and billing.
- **Caching**: KV store for edge functions, localStorage for offline data, and Redis for Celery.
- **Data Models**: Supports campaign structure (ad groups, keywords, ads, targeting), user profiles (subscription tiers, usage), and billing records.
- **Website Analysis Storage**: localStorage-based analysis service (analysisService.ts) stores URL analysis results (intent, vertical, CTA, seed keywords) for quick reuse across campaigns. Supports backend sync via API endpoints.

## Authentication & Authorization
- **Authentication Provider**: Supabase Auth with email/password, verification, and password reset. Signup is invite-only.
- **Authorization**: Role-based access for regular users, paid users, and super admins, with Row Level Security (RLS), API key authentication, CORS, and Content Security Policy.

## Super Admin Features
- **Documentation Manager**: Load existing documentation from Supabase, create, edit, and publish help documentation with rich text, images, and video URLs. Super admins can upload images as base64-encoded attachments and embed YouTube/Vimeo videos. Supports draft/published status for content visibility control. Data persists to Supabase support_tickets table with documentation type flag.
- **User Management**: Create, edit, impersonate, and block users
- **Template Management**: Manage templates, versions, and enable/disable status
- **Campaign Structures**: Manage campaign structure templates
- **Website Management**: Track deployed websites and domains
- **Real-time Expenses**: Load real expenses from APIs (Stripe, OpenAI, Supabase, Vercel, GitHub, etc.), parse Mercury CSV transactions, sync with service APIs. Uses realExpensesService.ts for parsing CSV and calculating actual usage costs. Removed all hardcoded/sample expenses - all data is production-real.
- **Support Tickets**: Manage user support requests and tickets
- **AI Usage Tracking**: Monitor AI token consumption across users
- **Database Admin (React-Admin)**: Full CRUD interface for all database tables using React-Admin + ra-supabase (MIT licensed). Access via /superadmin/db-admin route. Features include:
  - Browse, search, filter all tables (users, admin_templates, admin_websites, admin_deployments, admin_expenses, campaign_structures, support_tickets)
  - Create, edit, and delete records with auto-generated forms
  - Material UI interface with dark theme support
  - Built-in authentication with Supabase

# External Dependencies

## Third-Party Services
- **Supabase**: Authentication, PostgreSQL database, Edge Functions, real-time capabilities.
- **Stripe**: Payment processing for subscriptions, managed via stripe-replit-sync with automatic webhook configuration.
  - **Products**: Basic ($69.99/mo or $671.90/yr), Pro ($129.99/mo or $1,247.90/yr), Lifetime ($99.99 one-time)
  - **Server API**: Hono-based backend on port 3001 with endpoints for checkout, portal, products, and webhooks
  - **Integration**: stripe-replit-sync handles schema migrations, data sync, and webhook management
- **Redis**: Message broker and result backend for Celery tasks.
- **OpenAI**: Natural language processing for the web template editor chatbot (gpt-4o-mini).
- **Twilio**: Call forwarding and phone number management (demo mode).
- **ResellerClub**: Email/webmail management API.
- **GitHub**: Version control and CI/CD.
- **Vercel**: Deployment platform.
- **Replit**: Development platform.

## APIs & Integrations
- **Backend API (FastAPI)**: Provides endpoints for keyword generation, ad generation, and CSV export.
- **Google Ads Editor CSV Format**: Strict adherence to Google's schema for CSV exports.
- **OpenAI API**: Powers intelligent chatbot in the web template editor.
- **Real-time Expense Tracking**: Integrates with Stripe, OpenAI, Supabase, Vercel, SendGrid, GitHub, and Replit APIs.