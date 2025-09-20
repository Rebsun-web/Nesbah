## Technical Documentation

### Nesbah Bank Portal
**Original Author**: Die Vrouw  
**Maintainers**: Nikita Voronkin, Team  
**Last Updated**: 20 September 2025

---

## Table of contents
1. Code Structure and Guide
   - 1.1 Overview of Folder Structure
   - 1.2 Key Components and Their Purpose
   - 1.3 How the Code is Organized
2. Deployment Instructions
   - Local Development Setup
   - Deployment Using Docker (Google Cloud Run Ready)
   - Sample .env.local Variables
3. System Architecture Overview
   - Architecture Overview
   - Component Breakdown
4. Database Schema
   - 4.1 Overview
   - 4.2 Key Tables and Relationships
   - 4.3 Design Considerations
   - 4.4 Security and Compliance Notes
   - 4.5 Migrations (New in this version)
5. API and Third-Party Integration Details
   - 5.1 Wathiq Integration (Business Registration Lookup)
   - 5.2 EmailJS Integration (Automated Lead Notification to Bank Users)
   - 5.3 Uploads, Health Checks, and Admin APIs (New)
7. Access Instructions
   - 7.1 Google Cloud Platform (GCP)
   - 7.2 Microsoft Azure
   - 7.3 GitHub Repository
   - 7.4 Domain Name System (DNS) – nesbah.com.sa
   - 7.5 Google Workspace
8. Known Issues or Incomplete Features

Appendices
- A. SQL Migrations (New Tables and Columns)
- B. Dependency and Tooling Changes
- C. Test Coverage Overview

---

## 1. Code Structure and Guide

This project is structured using Next.js App Router, enhanced with Tailwind CSS for styling and Flowbite React for UI components. It runs locally and in cloud environments like Google Cloud Run or Azure. The current version upgrades to Next.js 15 and adds a production-hardened database layer, an Admin Portal, analytics, and background processing.

### 1.1 Overview of Folder Structure

The project leverages the Next.js App Router with clear separation between routing, UI, business logic, and services.

```
root/
├── .github/                         # GitHub Actions workflows (CI/CD)
├── .flowbite-react/                 # Flowbite UI overrides and init
├── public/                          # Static files (images, SVGs, logos, uploads)
│   └── uploads/                     # Runtime file uploads (bank logos, documents)
├── src/
│   ├── app/                         # Next.js App Router (routes and pages)
│   │   ├── admin/                   # Admin portal (new)
│   │   ├── bankPortal/              # Bank portal
│   │   ├── api/                     # API route handlers
│   │   └── ...
│   ├── components/                  # Reusable UI components
│   │   └── admin/                   # Admin UI (new)
│   ├── lib/                         # Utility functions and business logic
│   │   ├── analytics/               # Analytics service (new)
│   │   ├── auth/                    # Auth helpers (new)
│   │   ├── email/                   # Email helpers
│   │   ├── cron/                    # (legacy) Auto-ignore cleanup [removed]
│   │   ├── db.js / db.cjs           # DB connection (enhanced)
│   │   ├── background-*.js          # Background processing (new)
│   │   ├── application-status.js    # Status helpers (new)
│   │   ├── status-*.js              # Status sync/validation (new)
│   │   └── ...
│   ├── contexts/                    # React contexts (Language, AdminAuth)
│   ├── styles/                      # Tailwind CSS and global styles
│   ├── translations/                # i18n strings
│   └── __tests__/                   # Test suites (new)
├── .dockerignore                    # Docker context hygiene (new)
├── Dockerfile                       # Container definition
├── next.config.mjs                  # Next.js configuration
├── package.json                     # Dependencies and scripts
├── postcss.config.js                # PostCSS config
├── tailwind.config.js               # Tailwind theme config
├── monitor-background-processing.js # Local monitor script (new)
├── process-expired-applications.cjs # Background job runner (new)
└── TECHNICAL_DOCUMENTATION.md       # This document
```

### 1.2 Key Components and Their Purpose

Root-Level Files:
- **Dockerfile**: Build and runtime instructions for containerized deployments.
- **package.json**: Project metadata, dependencies, and scripts.
- **tailwind.config.js**: Tailwind theme customization and plugins.
- **postcss.config.js**: Tailwind PostCSS integration.
- **next.config.mjs**: Next.js settings (images, env passthrough, experimental flags).
- **.dockerignore**: Excludes local files from Docker build context.
- **README.md**: Project setup and quickstart (see this document for full details).

Important Folders:
- **.github/workflows/**: CI/CD workflows.
- **public/**: Static assets and user-uploaded files under `public/uploads`.
- **src/app/**: Route segments and pages (App Router). Contains:
  - `admin/` (new): Admin dashboards, users, applications, offers, analytics, login.
  - `bankPortal/`: Bank user flows (leads, history, details).
  - `api/`: Internal backend endpoints.
- **src/components/**: Reusable UI elements; includes a comprehensive `admin/` suite (new).
- **src/lib/**: Core application logic and services:
  - `db.js`/`db.cjs`: Enhanced DB pool with retries, circuit breaker, monitoring.
  - `application-status.js`, `status-synchronizer.js`, `status-validation.js`: Status orchestration.
  - `background-tasks.js`, `auction-expiry-handler.js`, `auction-notification-handler.js`: Background processing.
  - `analytics/analytics-service.js`: Event logging and aggregations.
  - `auth/*`: Admin and API auth helpers (unified login support).

### 1.3 How the Code is Organized

The codebase follows separation of concerns and a route-first organization.

- **Route-based structure**: Each screen/page under `src/app/` has its own directory.
- **Componentization**: UI split into small, reusable components in `src/components/`.
- **Logical layers**:
  - Presentation: `app/`, `components/`
  - Business logic: `lib/`
  - Data/service: `app/api/`

Examples:
- User registration (business):
  1. UI in `src/app/register/page.jsx`.
  2. Backend handler in `src/app/api/users/register/business_users/route.jsx` (Wathiq lookup).
  3. DB writes via `lib/db.js` pool helpers.

- Bank offer submission (new):
  1. UI in `src/app/bankPortal/leads/[id]/page.jsx`.
  2. `POST /api/bank/submit-offer` persists to `application_offers`, upserts `bank_offer_submissions`, updates `pos_application.offers_count` and `purchased_by`.
  3. Files are retrievable via `api/leads/[id]/offer-file` or `api/files/download/offer/[id]`.

- Admin application management (new):
  1. UI under `src/app/admin/applications/...` with modal editors.
  2. Endpoints under `src/app/api/admin/applications/...` for read/update, analytics, status dashboards.
  3. Status transitions are logged in `status_audit_log` and/or `application_status_logs`.

---

## 2. Deployment Instructions

The app supports local development, Docker, Azure Static Web Apps, and Google Cloud Run. Docker is recommended for consistent deployments.

### Local Development Setup

Prerequisites:
- Node.js v18+ (Next.js 15 compatible)
- Git
- npm (comes with Node.js)

Steps:
1. Clone the repository
   - `git clone <repo-url> .`
   - `cd <repo>`
2. Install dependencies
   - `npm install`
3. Create a `.env.local` file (see Sample section below)
4. Run the development server
   - `npm run dev`
5. Visit `http://localhost:3000`

Note: Local behavior mirrors production unless overridden via environment variables.

### Deployment Using Docker (Google Cloud Run Ready)

Steps:
1. Build image locally
   - `docker build -t nesbah-portal .`
2. Test locally (optional)
   - `docker run -p 3000:3000 nesbah-portal`
3. Push to registry
   - `docker tag nesbah-portal gcr.io/YOUR_PROJECT_ID/nesbah-portal`
   - `docker push gcr.io/YOUR_PROJECT_ID/nesbah-portal`
4. Deploy to Cloud Run
   - `gcloud run deploy nesbah-portal \`
     `  --image gcr.io/YOUR_PROJECT_ID/nesbah-portal \`
     `  --platform managed \`
     `  --region YOUR_REGION \`
     `  --allow-unauthenticated`

### Sample .env.local Variables

Important: Use your own secrets. Do not commit `.env.local`.

```
# Database (choose one style)
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>

# Or granular connection
PGHOST=<host>
PGPORT=5432
PGDATABASE=<db>
PGUSER=<user>
PGPASSWORD=<password>

# EmailJS
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxx
EMAILJS_PRIVATE_KEY=xxxxxxxx

# App
NODE_ENV=development
JWT_SECRET=<random-strong-secret>
```

Security Tips:
- Never expose secrets in client bundles (`NEXT_PUBLIC_*` is public by design).
- Use GitHub Secrets or GCP Secret Manager for CI/CD.
- Ensure `.env.local` is ignored in VCS.

---

## 3. System Architecture Overview

The system combines a server-rendered frontend (Next.js App Router) with internal API routes, a PostgreSQL database, third-party services, and background processing utilities.

### Architecture Overview

- **Frontend (Next.js + Tailwind + Flowbite)**: Routing, form inputs, authentication UI.
- **Internal API (`src/app/api/`)**: Handles submissions, lookups, file uploads, admin operations.
- **Business Logic (`src/lib/`)**: Wathiq client, status logic, auth helpers, analytics, background tasks.
- **Third-party**: Wathiq (CR validation), EmailJS (notifications).
- **Database**: PostgreSQL on Cloud SQL.
- **Background jobs (new)**: Auction expiry handling, status synchronization, monitoring.

### Component Breakdown

- **Portals**:
  - Client Portal (business/individual users)
  - Bank Portal (offers, purchased leads, history)
  - Admin Portal (new): users/applications/offers/analytics, background jobs, MFA scaffold

- **Analytics (new)**:
  - Event logging (`analytics_events`)
  - Admin dashboards for flows, success metrics, performance

- **Reliability (new)**:
  - Hardened DB pool (`lib/db.js`): retries, circuit breaker, monitoring, health checks
  - Health endpoints (`/api/health`, `/api/health/database`)

---

## 4. Database Schema

### 4.1 Overview

The platform uses PostgreSQL. This version introduces new tracking/audit tables and expands `pos_application` to better support offers, status flows, and analytics.

### 4.2 Key Tables and Relationships

Baseline roles:
- Business Users (with CR)
- Individual Users (with National ID)
- Bank Users (bank-side reviewers)

Application types:
- POS Applications (current focus)
- Loan and Credit Card (legacy stubs; POS is the authoritative flow in this version)

Core tables (unchanged intent, expanded usage):
- `users`: login/accounts across all user types. Fields used include `user_id`, `email`, `password`, `user_type`, `entity_name`, `account_status`, timestamps.
- `business_users`: CR-bound metadata, populated via Wathiq on registration.
- `individual_users`: personal user profiles.
- `bank_users`: bank entities; now includes `credit_limit`, optional `logo_url`.

Key application tables:
- `pos_application` (expanded): application snapshot and status flags, plus:
  - `current_application_status` (TEXT)
  - `offers_count` (INT)
  - `opened_by` (INT[])
  - `purchased_by` (INT[])
  - `auction_end_time` (TIMESTAMP)
  - Optional document columns for uploads

Offer and tracking tables (new):
- `application_offers`: full offer payloads; files optional.
- `bank_offer_submissions`: per-bank per-application submission tracker (UNIQUE(application_id, bank_user_id)).
- `status_audit_log`: admin/background status transition log.
- `application_status_logs`: background transition logs.
- `application_revenue`: revenue entries when purchased.
- `application_offer_tracking`: optional denormalized counters for analytics.
- `analytics_events`: event logging for dashboards.

### 4.3 Design Considerations

- `pos_application` as the single source of truth for application state; arrays for `opened_by`/`purchased_by` reduce join overhead.
- Transactional write paths for submitting offers and purchases prevent race conditions.
- Audit and analytics tables enable observability without impacting primary write paths.

### 4.4 Security and Compliance Notes

- Handle CR/National IDs per local regulations and GDPR.
- Hash passwords using strong algorithms (e.g., bcrypt).
- Restrict admin endpoints; prefer MFA for admin accounts.

### 4.5 Migrations (New in this version)

See Appendix A for SQL statements to create/alter the required schema.

---

## 5. API and Third-Party Integration Details

### 5.1 Wathiq Integration (Business Registration Lookup)

Purpose: Validate CR numbers and fetch authoritative business data during registration. The backend calls Wathiq directly and snapshots key fields into `business_users` and at submission time into `pos_application`.

Flow:
1. Frontend posts a CR number to `/api/users/register/business_users`.
2. Backend fetches Wathiq data, parses, and stores into `business_users`.
3. POS submissions snapshot relevant fields for historical consistency.

### 5.2 EmailJS Integration (Automated Lead Notification)

Purpose: Notify bank users on new applications/leads.

Flow:
1. After a successful submission (POS/other), backend fetches bank user emails from `users`.
2. Backend calls EmailJS API using configured service/template/public/private keys.
3. Notification content is driven by the EmailJS template.

Environment:
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`

Security:
- Do not expose `EMAILJS_PRIVATE_KEY` to the client; keep server-side only.

### 5.3 Uploads, Health Checks, and Admin APIs (New)

- **Uploads**: `POST /api/upload/bank-logo` and `POST /api/upload/document` store files under `public/uploads/...` and meta in DB.
- **Health**: `/api/health`, `/api/health/database` for runtime checks.
- **Admin**: Comprehensive endpoints under `/api/admin/...` covering users, applications, offers, analytics, background jobs, and status tools.

---

## 7. Access Instructions

### 7.1 Google Cloud Platform (GCP)

Purpose: Hosts production (Cloud Run) and Cloud SQL.

Access Requirements: Google account with proper IAM roles.

Resources: Cloud Run, Cloud SQL, (optional) Cloud Build / Artifact Registry, IAM & Admin.

### 7.2 Microsoft Azure

Purpose: Legacy/secondary website hosting.

### 7.3 GitHub Repository

Contains the complete source code including frontend, internal APIs, and integration logic.

### 7.4 Domain Name System (DNS) – nesbah.com.sa

Provider: Sahara Net. Use to manage DNS records for services.

### 7.5 Google Workspace

Purpose: Email and user account administration.

Dependencies: Ensure MX/TXT (SPF/DKIM/DMARC) records are correctly configured in DNS.

---

## 8. Known Issues or Incomplete Features

- Admin Portal: Implemented in this version (previously marked incomplete). Current constraints:
  - MFA setup endpoints exist; full MFA UX rollout pending.
  - Some legacy routes still reference deprecated paths; all new flows use `pos_application` directly.

---

## Appendix A. SQL Migrations (New Tables and Columns)

The following DDL covers new tables/columns used by the current code. Adjust types and names to match your standards.

```sql
-- Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS entity_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

-- Bank users
ALTER TABLE bank_users ADD COLUMN IF NOT EXISTS credit_limit NUMERIC;
ALTER TABLE bank_users ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Bank employees
CREATE TABLE IF NOT EXISTS bank_employees (
  employee_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  bank_user_id INT REFERENCES bank_users(user_id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_employee_audit_log (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES bank_employees(employee_id) ON DELETE CASCADE,
  action TEXT,
  actor_user_id INT REFERENCES users(user_id),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- POS applications
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS current_application_status TEXT;
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS offers_count INT DEFAULT 0;
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS opened_by INT[] DEFAULT '{}';
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS purchased_by INT[] DEFAULT '{}';
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS auction_end_time TIMESTAMP;
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS uploaded_document BYTEA;
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS uploaded_filename TEXT;
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS uploaded_mimetype TEXT;

-- Offers
CREATE TABLE IF NOT EXISTS application_offers (
  offer_id SERIAL PRIMARY KEY,
  submitted_application_id INT NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
  bank_user_id INT NOT NULL REFERENCES users(user_id),
  submitted_by_user_id INT NOT NULL REFERENCES users(user_id),
  approved_financing_amount NUMERIC,
  proposed_repayment_period_months INT,
  interest_rate NUMERIC,
  monthly_installment_amount NUMERIC,
  grace_period_months INT,
  relationship_manager_name TEXT,
  offer_comment TEXT,
  bank_name TEXT,
  status TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  uploaded_document BYTEA,
  uploaded_filename TEXT,
  uploaded_mimetype TEXT
);

CREATE TABLE IF NOT EXISTS bank_offer_submissions (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
  bank_user_id INT NOT NULL REFERENCES users(user_id),
  bank_name TEXT,
  offer_id INT REFERENCES application_offers(offer_id) ON DELETE SET NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(application_id, bank_user_id)
);

-- Status/audit and analytics
CREATE TABLE IF NOT EXISTS status_audit_log (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT,
  admin_user_id INT REFERENCES users(user_id),
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_status_logs (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_revenue (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
  bank_user_id INT NOT NULL REFERENCES users(user_id),
  amount NUMERIC,
  transaction_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_offer_tracking (
  application_id INT PRIMARY KEY REFERENCES pos_application(application_id) ON DELETE CASCADE,
  offers_count INT DEFAULT 0,
  purchases_count INT DEFAULT 0,
  current_application_status TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT,
  application_id INT REFERENCES pos_application(application_id) ON DELETE SET NULL,
  bank_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  offer_id INT REFERENCES application_offers(offer_id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Appendix B. Dependency and Tooling Changes

- Upgraded **Next.js** to 15.x and **Tailwind** to 3.4.17.
- Updated **@headlessui/react** to 2.2.7.
- Added **jsonwebtoken**, **dotenv**, **exceljs**, **busboy**, **@react-aria/utils**, **@react-stately/** packages.
- Hardened linting/prettier and introduced `.dockerignore`.

---

## Appendix C. Test Coverage Overview

New test suites under `src/__tests__/` cover:
- Admin portal functionality
- Bank portal workflows
- Authentication and access control
- Application status transitions
- Portal end-to-end basics and utilities

Run tests with the project-specific scripts or via provided helper scripts (see root helpers like `run-tests.js` if available).


