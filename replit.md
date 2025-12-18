# Overview

Adiology is a Google Ads campaign builder platform designed to automate and streamline the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to simplify Google Ads campaign management for various business needs, offering features like real-time expense tracking and an AI-powered web template editor to enhance efficiency and unlock market potential for effective ad deployment.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
- **Frontend Framework**: React 18 with TypeScript and Vite, utilizing Radix UI and Tailwind CSS for a component-based architecture.
- **Design Patterns**: Multi-step wizards for Campaign and Ads Builders, client-side routing, React hooks, and a context-based notification system.
- **Key Features**: SuperAdmin Console, AI-powered Web Template Editor, Real-time Expense Tracking, and a dedicated Ads Search feature for competitor analysis.

## Technical Implementations
- **Campaign Builder (CampaignBuilder3)**: A 7-step wizard for comprehensive campaign creation, supporting SKAG, STAG, Intent-Based, and Alpha-Beta structures with automated naming, keyword generation (410-710 keywords), ad generation, and geo-targeting.
- **Draft Campaigns**: Manages campaign drafts and completed builds, offering a table view with status tracking, search, and filtering capabilities.
- **Connected Domains**: Custom domain management with CRUD operations, status indicators, and domain WHOIS lookup via RDAP.
- **Web Template Editor**: A sections-based visual editor with 13 built-in section types, allowing content editing and customization without drag-and-drop.
- **Teams Management**: Facilitates team collaboration with role assignment, invitation management via Postmark API, and plan-based team limits.
- **Keyword Tools**:
    - **Long Tail Keywords**: Generates long-tail keyword variations using a hybrid approach (autocomplete patterns and AI via gpt-4o-mini), with options for saving, copying, and exporting.
    - **Keyword Filters**: Reusable Country and Device filters integrated across all keyword tools.
- **Terminal Progress Console**: An animated, terminal-style UI for displaying real-time progress during keyword generation.
- **Data Export**: Generates Google Ads Editor CSV files with 183 columns, ensuring full compatibility for immediate import, covering campaigns, ad groups, keywords, various extensions, and targeting.

## System Design Choices
- **Backend API**: Hono (Node.js/TypeScript) for primary API endpoints, with optional FastAPI (Python) for legacy ad generation.
- **URL Analyzer**: Cheerio-based HTML parser for website analysis, integrated with OpenAI for marketing insights.
- **Background Processing**: Celery with Redis for asynchronous tasks like keyword generation and AI-powered suggestions.
- **Ads Transparency Scraper**: Playwright-based web scraper for competitor ad research from Google Ads Transparency Center, processed via an hourly cron job.
- **Cron Scheduler**: Manages background jobs, including daily activity summary emails via Postmark.
- **Edge Functions**: Supabase Edge Functions (Deno/TypeScript) for health checks, payment processing, and campaign history.
- **Fallback Systems**: Includes Python-based ad generation and a three-tier save system (Edge Function → Database → localStorage).
- **Business Logic**: Automatic business type detection, intent classification, service/product-specific ad templates, and Dynamic Keyword Insertion (DKI).
- **Ad Generation Guardrails**: Strict adherence to Google Search Ads policies, including rules for RSAs, DKI, Call-Only ads, uniqueness checks (Levenshtein distance), and ad strength calculation.
- **Data Storage**: Supabase (PostgreSQL) for primary data, KV store for edge functions, localStorage for offline data, and Redis for Celery caching.
- **Authentication & Authorization**: Supabase Auth with email/password, invite-only signup, and role-based access with Row Level Security (RLS).

## Super Admin Features
- **Documentation Manager**: For creating, editing, and publishing help documentation.
- **User Management**: Comprehensive CRUD operations for user accounts.
- **Template Management**: Control over templates, versions, and status.
- **Website Management**: Tracking deployed websites and domains.
- **Real-time Expenses**: Integrates with various APIs to track actual usage costs.
- **Support Tickets**: Management of user support requests.
- **AI Usage Tracking**: Monitoring of AI token consumption.
- **Database Admin**: A React-Admin interface for full CRUD on all database tables.

# External Dependencies

## Third-Party Services
- **Supabase**: Authentication, PostgreSQL database, Edge Functions, real-time capabilities.
- **Stripe**: Payment processing for subscriptions (Basic, Pro, Lifetime plans) via `stripe-replit-sync`.
- **Redis**: Message broker and result backend for Celery tasks.
- **OpenAI**: Natural language processing for the web template editor chatbot (gpt-4o-mini).
- **Twilio**: Call forwarding and phone number management (demo mode).
- **ResellerClub**: Email/webmail management API.
- **GitHub**: Version control.
- **Vercel**: Deployment platform.
- **Replit**: Development platform.

## APIs & Integrations
- **Backend API (FastAPI)**: For keyword generation, ad generation, and CSV export.
- **Google Ads Editor CSV Format**: Adherence to Google's schema for exports.
- **OpenAI API**: Powers the intelligent chatbot in the web template editor.
- **Postmark API**: Transactional email service for welcome emails, team invites, password resets, and campaign exports.
- **Real-time Expense Tracking Integrations**: Stripe, OpenAI, Supabase, Vercel, SendGrid, GitHub, and Replit APIs.