# Overview

Adiology is a Google Ads campaign builder platform designed to automate and streamline the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to simplify Google Ads campaign management for various business needs, offering features like real-time expense tracking and an AI-powered web template editor to enhance efficiency and unlock market potential for effective ad deployment.

# User Preferences

Preferred communication style: Simple, everyday language.

## UI Preferences
- **Shell View**: A terminal-style console display with dark background (slate-900), traffic light dots (red/yellow/green), timestamps in brackets, and animated progress messages. Uses ">" prefix for in-progress actions and "✓" (green) for completed actions. This pattern should always be displayed inline within the page, NOT as a popup/modal. Components: `TerminalProgressConsole` and `TerminalResultsConsole`.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite, utilizing Radix UI and Tailwind CSS.
- **UI/UX**: Component-based architecture, multi-step wizards for Campaign and Ads Builders, client-side routing, React hooks, and context-based notification system. Features include a SuperAdmin Console, an AI-powered Web Template Editor, Real-time Expense Tracking, and Call Forwarding. The design is mobile-responsive with collapsible sidebar navigation, responsive grids, compact navigation, and mobile-optimized data tables.
- **Call Forwarding**: Project-based call management system with SkySwitch API integration for tracking numbers, forwarding targets with percentage-based distribution, and syncing to SkySwitch.
- **Call Forwarding Billing**: Prepaid balance system with Stripe integration for auto-recharge, manual top-ups, payment method management, and transaction history.
- **Ads Search (Google Ads Transparency)**: Allows users to research competitor ads from Google Ads Transparency Center using a Playwright-based scraper and an asynchronous job queue system.
- **Campaign Builder**: A 7-step wizard that guides users through URL input with AI analysis, structure selection (SKAG, STAG, Intent-Based, Alpha-Beta), keyword generation (410-710 keywords), ad generation, geo-targeting, and CSV generation.
- **Draft Campaigns**: Manages campaign drafts and completed builds, offering a table view with status tracking, search, and filtering capabilities.
- **Connected Domains**: Custom domain management with CRUD operations, status indicators, and domain WHOIS lookup via RDAP.
- **Saved Campaigns**: Displays campaign history with search and filter options, including Google Ads OAuth integration for direct, paused campaign pushes to Google Ads.
- **Web Template Editor**: A sections-based visual editor with 13 built-in section types for website customization, content editing, and HTML export.
- **Teams Management**: Facilitates team collaboration with role assignment, invitation management via Postmark API, and plan-based team limits.
- **Keyword Tools**:
    - **Long Tail Keywords**: Generates long-tail keyword variations using a hybrid approach (autocomplete patterns and AI via gpt-4o-mini), with options for saving, copying, and exporting.
    - **Keyword Filters**: Reusable Country and Device filters integrated across all keyword tools.
- **Terminal Progress Console**: An animated, terminal-style UI for displaying real-time progress during keyword generation.
- **Data Export**: Generates a master 183-column Google Ads Editor CSV format, ensuring full compatibility for various campaign, ad group, keyword, and extension data.

## Backend
- **Primary API**: Hono (Node.js/TypeScript) for all API endpoints, with optional FastAPI (Python) for legacy ad generation.
- **URL Analyzer**: Cheerio-based HTML parser for website analysis, extracting key information and integrating with OpenAI for marketing insights.
- **Background Processing**: Celery with Redis for asynchronous tasks like keyword generation and AI-powered keyword suggestions.
- **Ads Transparency Scraper**: Playwright-based web scraper for competitor ad data, processed by an hourly cron job.
- **Cron Scheduler**: Manages background jobs, including daily activity summary emails via Postmark.
- **Edge Functions**: Supabase Edge Functions (Deno/TypeScript) for health checks, payment processing, and campaign history storage.
- **Fallback Systems**: Python-based ad generator, local storage, and a three-tier save system (Edge Function → Database → localStorage).
- **Business Logic**: Automatic business type detection, intent classification, service/product-specific ad templates, and Dynamic Keyword Insertion (DKI).
- **Ad Generation Guardrails**: Enforces Google Search Ads policies for RSA, DKI, Call-Only ads, uniqueness checks (Levenshtein distance), and ad strength calculation.

## Data Storage
- **Primary Database**: Supabase (PostgreSQL) for user data, campaign history, subscriptions, and billing.
- **Caching**: KV store for edge functions, localStorage for offline data, and Redis for Celery.
- **Data Models**: Supports campaign structure, user profiles, and billing records.
- **Website Analysis Storage**: localStorage-based analysis service for quick reuse of URL analysis results, with backend sync.

## Authentication & Authorization
- **Authentication Provider**: Supabase Auth with email/password, verification, and invite-only signup.
- **Authorization**: Role-based access (users, paid users, super admins) with Row Level Security (RLS), API key authentication, CORS, and Content Security Policy.

## Super Admin Panel
- **Access**: Restricted to specific users via /admin path or admin.adiology.io subdomain.
- **Authentication**: Server-side middleware protects API endpoints.
- **Dashboard**: Real-time statistics including users, subscriptions, revenue, and errors.
- **Management**: User management (block, edit roles), subscription & billing management (Stripe sync), database management (browse/edit records).
- **System Logs**: View error, activity, and API logs.
- **Email Management**: Sendune integration for transactional emails via AWS SES.
- **Security & Firewall**: IP blocking and rate limiting configuration.
- **Documentation Manager**: Create, edit, and publish help documentation with rich text, images, and video.
- **Template Management**: Manage campaign templates, versions, and status.
- **Website Management**: Track deployed websites and domains.
- **Real-time Expenses**: Integrates with various APIs (Stripe, OpenAI, Supabase, Vercel, SendGrid, GitHub, and Replit) to track and calculate actual usage costs from production data.
- **Support Tickets**: Management of user support requests.
- **AI Usage Tracking**: Monitors AI token consumption per user.
- **Database Admin**: Full CRUD interface for all database tables using React-Admin.

## AI Blog Generator
- **Location**: Blog > AI Generator in sidebar navigation.
- **Features**: Generates 2000+ word blog posts with 5+ content sections, case studies, tips, image prompts, optional code snippets and statistics. Configurable content type, tone, and target audience. Includes HTML export, markdown preview, and copy-to-clipboard.
- **Security**: HTML escaping, server-side authentication, and input validation.

# External Dependencies

## Third-Party Services
- **Supabase**: Authentication, PostgreSQL database, Edge Functions.
- **Stripe**: Payment processing for subscriptions, integrated via `stripe-replit-sync`.
- **Redis**: Message broker and result backend for Celery tasks.
- **OpenAI**: Natural language processing for the web template editor chatbot and AI Blog Generator (gpt-4o-mini).
- **SkySwitch**: Call forwarding and phone number management API (DID/TFNs, percentage-based distribution).
- **ResellerClub**: Email/webmail management API.
- **GitHub**: Version control.
- **Vercel**: Deployment platform.
- **Replit**: Development platform.

## APIs & Integrations
- **Backend API (FastAPI)**: Provides endpoints for keyword generation, ad generation, and CSV export.
- **Google Ads Editor CSV Format**: Adheres strictly to Google's schema for data export.
- **Real-time Expense Tracking**: Integrates with Stripe, OpenAI, Supabase, Vercel, SendGrid, GitHub, and Replit APIs.
