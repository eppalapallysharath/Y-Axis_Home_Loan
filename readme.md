# 🏠 Y-Axis Home Loan Processing System

A full-stack, enterprise-grade Retail Home Loan Origination and Processing Platform built with **Next.js (App Router)**, **Redux Toolkit (RTK)**, and **Node.js (Express)** with **PostgreSQL & Prisma ORM**.

---

## 📑 Table of Contents

1. [Setup Instructions](#1-setup-instructions)
   - [Prerequisites](#prerequisites)
   - [Clone the Repository](#1-clone-the-repository)
   - [Configure Environment Variables](#2-configure-environment-variables)
   - [Install Dependencies](#3-install-dependencies)
   - [Configure Database & Seed Data](#4-configure-database--seed-data)
   - [Run the Application](#5-run-the-application)
   - [Seeded Test Accounts](#seeded-test-accounts)
2. [Architecture](#2-architecture)
   - [High-Level Architecture](#high-level-architecture)
   - [Major Modules & Subsystems](#major-modules--subsystems)
   - [Technology Stack & Rationale](#technology-stack--rationale)
3. [Data Model](#3-data-model)
   - [Key Entities & Relationships](#key-entities--relationships)
   - [Entity Relationship Diagram](#entity-relationship-diagram)
   - [Core Enums & Schemas](#core-enums--schemas)
4. [Application Design](#4-application-design)
   - [Frontend & Backend Communication](#frontend--backend-communication)
   - [Redux Toolkit State Architecture](#redux-toolkit-state-architecture)
   - [Workflow State Machine & Blocking Rules](#workflow-state-machine--blocking-rules)
5. [Authentication and Authorization](#5-authentication-and-authorization)
   - [Dual-Token JWT Strategy](#dual-token-jwt-strategy)
   - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
   - [Next.js Edge Middleware & Server Guards](#nextjs-edge-middleware--server-guards)
6. [External Integration (Core Banking System — CBS)](#6-external-integration-core-banking-system--cbs)
   - [When Synchronization Occurs](#when-synchronization-occurs)
   - [Failure Handling & Exponential Backoff](#failure-handling--exponential-backoff)
   - [Concurrency, Idempotency & Duplicate Prevention](#concurrency-idempotency--duplicate-prevention)
   - [Production Improvements for CBS Integration](#production-improvements-for-cbs-integration)
7. [Assumptions and Trade-offs](#7-assumptions-and-trade-offs)
8. [Incomplete Features & Future Roadmap](#8-incomplete-features--future-roadmap)
9. [Production Considerations](#9-production-considerations)

---

## 1. Setup Instructions

### Prerequisites
- **Node.js**: `v18.x` or `v20.x+`
- **npm**: `v9.x` or `v10.x+`
- **PostgreSQL Database**: Running locally or hosted (Supabase, Neon, AWS RDS, Docker)

---

### 1. Clone the Repository

```bash
git clone https://github.com/eppalapallysharath/Y-Axis_Home_Loan.git
cd Y-Axis_Home_Loan
```

---

### 2. Configure Environment Variables

Create `.env` files in both the `server/` and `client/` directories.

#### Backend Configuration (`server/.env`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
API_PREFIX=/api/v1

# PostgreSQL Connection String (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yaxis_home_loan?schema=public"

# JWT Secrets (Minimum 32 characters)
JWT_ACCESS_SECRET="yaxis_home_loan_access_secret_key_32bytes_min!"
JWT_REFRESH_SECRET="yaxis_home_loan_refresh_secret_key_32bytes_min!"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Core Banking System (CBS) Configuration
CBS_BASE_URL="http://localhost:5000/mock-cbs"
CBS_TIMEOUT_MS=10000
CBS_MAX_ATTEMPTS=4
CBS_RETRY_WORKER_INTERVAL=60000
```

#### Frontend Configuration (`client/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
JWT_ACCESS_SECRET="yaxis_home_loan_access_secret_key_32bytes_min!"
```

---

### 3. Install Dependencies

Install dependencies for both backend and frontend applications:

```bash
# 1. Install Backend Dependencies
cd server
npm install

# 2. Install Frontend Dependencies
cd ../client
npm install
```

---

### 4. Configure Database & Seed Data

From the `server/` directory, initialize the database schema with Prisma and populate demo users, teams, customers, applications, and work items:

```bash
cd server

# 1. Generate Prisma Client
npx prisma generate

# 2. Push Schema to PostgreSQL
npx prisma db push

# 3. Seed Initial Demo Data
node prisma/seed.js
```

*(Optional) To view and inspect database tables visually via Prisma Studio:*
```bash
npx prisma studio
# Opens Prisma Studio on http://localhost:5555
```

---

### 5. Run the Application

Start both the backend API server and the Next.js frontend client:

#### Terminal 1 — Backend API Server
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 2 — Frontend Client Application
```bash
cd client
npm run dev
# Client runs on http://localhost:3000
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

### Seeded Test Accounts

The database seed provides pre-configured test users with role hierarchies and team associations (all accounts share password `Password@123`):

| Role | Name | Email | Password | Scope & Operational Permissions |
|---|---|---|---|---|
| **ADMIN** | System Admin | `admin@yaxis.com` | `Password@123` | Full system access, all loans, user management, CBS retry execution, organization-wide audits |
| **MANAGER** | Alice Johnson | `alice.hyd@yaxis.com` | `Password@123` | Hyderabad Branch Manager: approve/reject loans, reassign officers, view branch applications |
| **MANAGER** | Eve Smith | `eve.mum@yaxis.com` | `Password@123` | Mumbai Branch Manager: approve/reject loans, reassign officers, view branch applications |
| **EXECUTIVE** | Bob Miller | `bob.exec@yaxis.com` | `Password@123` | Hyderabad Loan Officer: process assigned loans, complete verification work items |
| **EXECUTIVE** | Carol Davis | `carol.exec@yaxis.com` | `Password@123` | Hyderabad Loan Officer: process assigned loans, complete verification work items |
| **EXECUTIVE** | David Wilson | `david.exec@yaxis.com` | `Password@123` | Mumbai Loan Officer: process assigned loans, complete verification work items |
| **EXECUTIVE** | Frank Taylor | `frank.exec@yaxis.com` | `Password@123` | Mumbai Loan Officer: process assigned loans, complete verification work items |

---

## 2. Architecture

### High-Level Architecture

```
+---------------------------------------------------------------------------------------+
|                                 Next.js 14+ Frontend                                  |
|                                                                                       |
|  +----------------+  +--------------------+  +-------------------+  +--------------+  |
|  |  Auth / Login  |  | Executive / Branch |  | Application & Work|  |   Customer   |  |
|  |     Pages      |  |     Dashboard      |  | Item Detail Views |  |  Management  |  |
|  +----------------+  +--------------------+  +-------------------+  +--------------+  |
|          |                     |                       |                    |         |
|          +---------------------+-----------------------+--------------------+         |
|                                        |                                              |
|                         Redux Toolkit State Layer (RTK)                               |
|        [authSlice, applicationSlice, customerSlice, workItemSlice, syncJobSlice]      |
|                                        |                                              |
|                             Next.js Edge Middleware                                   |
|                     (Route Protection & Role Claim Guarding)                          |
|                                        |                                              |
|                          Unified API Layer (`apiFetch`)                               |
|                 (Bearer Header Injection & Silent 401 Refresh Queue)                  |
+----------------------------------------|----------------------------------------------+
                                         | HTTPS REST API (/api/v1)
                                         v
+---------------------------------------------------------------------------------------+
|                               Node.js Express Backend                                 |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | Security & Route Middleware: Helmet, CORS, CookieParser, Morgan, Global Error   |  |
|  | Auth Guard (JWT Verification) -> RBAC Guard (Role & Resource Ownership)        |  |
|  +---------------------------------------------------------------------------------+  |
|         |                      |                      |                     |         |
|         v                      v                      v                     v         |
|  +--------------+      +---------------+      +---------------+      +-------------+  |
|  | User/Auth    |      | Applications  |      | Work Items    |      | Customers   |  |
|  | Controller   |      | Controller    |      | Controller    |      | Controller  |  |
|  +--------------+      +---------------+      +---------------+      +-------------+  |
|         |                      |                      |                     |         |
|         +----------------------+----------------------+---------------------+         |
|                                        |                                              |
|                             +--------------------+                                    |
|                             |  Workflow Service  |                                    |
|                             | (Deterministic FSM |                                    |
|                             |  & Blocking Rules) |                                    |
|                             +----------+---------+                                    |
|                                        |                                              |
|        +-------------------------------+-------------------------------+              |
|        | (Trigger on Sanction/COMPLETED)                               | (Poll every 60s)
|        v                                                               v              |
|  +---------------------------------------------------------------------------------+  |
|  | CBS Integration Service & Background Retry Worker                               |  |
|  | - Optimistic/Pessimistic State Locking via `prisma.updateMany`                   |  |
|  | - Exponential Backoff: Math.min(60s * 2^(n-1), 1hr)                             |  |
|  | - Comprehensive Audit Logging via ActivityLog                                   |  |
|  +---------------------------------------------------------------------------------+  |
+----------------------------------------|----------------------------------------------+
                                         |
                      +------------------+------------------+
                      |                                     |
                      v                                     v
+---------------------------+             +------------------------------------+
|   PostgreSQL Database     |             |   External CBS HTTP Endpoint       |
|   (via Prisma ORM)        |             |   (Mock or Real Core Banking Core) |
+---------------------------+             +------------------------------------+
```

### Major Modules & Subsystems

1. **Authentication & Identity Module (`/auth`)**: Dual-token JWT lifecycle (15m access token + 7d HTTP-only refresh cookie), token revocation on logout, automatic token refresh queueing, and bcrypt password hashing.
2. **Role-Based Access Control Module (RBAC)**: Multi-tiered access levels (`ADMIN` > `MANAGER` > `EXECUTIVE`) governing route execution, data isolation by branch/team, application reassignment, and status transition rights.
3. **Customer Management Module (`/customers`)**: Borrower profiling, unique PAN validation, Aadhaar, credit score bounds (300–900), and annual income financial metrics.
4. **Loan Application Management Module (`/applications`)**: Multi-category home financing (`HOME_LOAN`, `TOP_UP`, `LAP`), priority matrices, loan-to-value calculations, and officer assignments.
5. **Workflow & Status Engine (`workflowService.js`)**: Deterministic Finite State Machine (FSM) enforcing stage prerequisites and blocking unverified loans from progressing to approval.
6. **Work Items Subsystem (`/work-items`)**: Verification tasks (`CIBIL_CHECK`, `DOCUMENT_VERIFICATION`, `LEGAL_TITLE_SEARCH`, `PROPERTY_VALUATION`, `FINAL_REVIEW`) with discrete states (`OPEN`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`).
7. **Activity History & Audit Trail (`/activity`)**: Immutable chronological audit events recording stage progressions, reassignments, notes, and CBS interactions.
8. **CBS Integration Engine (`cbsIntegrationService.js` + `cbsRetryWorker.js`)**: Database-backed asynchronous sync engine pushing sanctioned loans to Core Banking with atomic locking and exponential backoff.
9. **Search & Multi-Facet Filtering Engine**: Real-time filtering across stage, priority, loan category, team/officer assignment, date range, and keyword search across applicant names and PAN numbers.

### Technology Stack & Rationale

| Layer | Selected Tech | Rationale & Architectural Benefit |
|---|---|---|
| **Frontend Framework** | **Next.js 14+ (App Router)** | Hybrid server/client rendering, file-system routing, and Edge Middleware for route guarding. |
| **Global State Management** | **Redux Toolkit (RTK) + `react-redux`** | Centralized, predictable store architecture with typed slices (`auth`, `application`, `customer`, `workItems`, `activityLogs`, `syncJobs`) and custom hooks (`useAuth`, `useAppDispatch`, `useAppSelector`). |
| **UI & Styling** | **Tailwind CSS + Lucide Icons + React Hot Toast** | High-performance utility styling, clean responsive design system, and toast feedback. |
| **Backend Server** | **Node.js + Express.js** | Modular REST architecture with clean separation across controllers, services, middleware, and workers. |
| **Database & ORM** | **PostgreSQL + Prisma ORM** | Relational integrity, ACID transactions for transitions, foreign key cascading, and type-safe data access. |
| **Job Queue & Scheduling** | **PostgreSQL-backed Retry Table + Node Interval Worker** | Eliminates external infrastructure overhead (such as Redis / BullMQ) for assessment portability while delivering atomic concurrency locking, retry timestamps, and idempotency guarantees. |

---

## 3. Data Model

### Key Entities & Relationships

- **User**: System actors (`ADMIN`, `MANAGER`, `EXECUTIVE`). Associated with a `Team` as a member or manager.
- **Team**: Organizational unit linking one `MANAGER` to multiple `EXECUTIVE` members.
- **Customer**: Borrower profile containing identity data (unique `panNumber`, phone, email, income, credit score). Has 1-to-many `LoanApplication` records.
- **LoanApplication**: Core aggregate entity tracking `loanAmount`, `applicationType`, `stage`, `priority`, `cbsSyncStatus`, assigned officer, and creator.
- **WorkItem**: Operational verification tasks attached to a `LoanApplication` with explicit task statuses (`OPEN`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`).
- **ActivityLog**: Immutable audit log linking an `Application`, `User`, `ActivityAction`, and JSON `metadata` payload.
- **CbsSyncJob**: 1-to-1 asynchronous sync tracking record storing retry `attempts`, `maxAttempts`, `nextRetryAt`, `lastError`, and sync `status`.

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Team : "member of"
    User ||--o| Team : "manages"
    User ||--o{ Customer : "creates"
    User ||--o{ LoanApplication : "creates"
    User ||--o{ LoanApplication : "assigned to"
    User ||--o{ WorkItem : "assigned to"
    User ||--o{ ActivityLog : "performs"

    Customer ||--o{ LoanApplication : "owns"

    LoanApplication ||--o{ WorkItem : "has checklist"
    LoanApplication ||--o{ ActivityLog : "audit records"
    LoanApplication ||--o| CbsSyncJob : "synchronization status"

    User {
        int id PK
        string name
        string email UK
        string passwordHash
        string role
        int teamId FK
    }

    Team {
        int id PK
        string name
        int managerId FK,UK
    }

    Customer {
        int id PK
        string fullName
        string email
        string phone
        string panNumber UK
        float annualIncome
        int creditScore
    }

    LoanApplication {
        int id PK
        int customerId FK
        string applicationType
        float loanAmount
        string stage
        string priority
        int assignedToId FK
        string cbsSyncStatus
    }

    WorkItem {
        int id PK
        int applicationId FK
        string type
        string status
        int assignedToId FK
        datetime completedAt
    }

    ActivityLog {
        int id PK
        int applicationId FK
        int userId FK
        string action
        json metadata
        datetime createdAt
    }

    CbsSyncJob {
        int id PK
        int applicationId FK,UK
        string status
        int attempts
        int maxAttempts
        datetime nextRetryAt
        string lastError
    }
```

### Core Enums & Schemas

```prisma
enum Role { ADMIN, MANAGER, EXECUTIVE }
enum ApplicationType { HOME_LOAN, TOP_UP, LAP }
enum ApplicationStage { NEW, WAITING_FOR_INFO, IN_PROGRESS, UNDER_REVIEW, COMPLETED, REJECTED }
enum Priority { LOW, MEDIUM, HIGH, URGENT }
enum WorkItemType { CIBIL_CHECK, DOCUMENT_VERIFICATION, LEGAL_TITLE_SEARCH, PROPERTY_VALUATION, FINAL_REVIEW, OTHER }
enum WorkItemStatus { OPEN, IN_PROGRESS, COMPLETED, BLOCKED }
enum CbsSyncStatus { PENDING, IN_PROGRESS, SUCCESS, FAILED, EXHAUSTED, NOT_APPLICABLE }
```

---

## 4. Application Design

### Frontend & Backend Communication

1. **RESTful Versioned Endpoints**: All client-to-server interactions operate over `/api/v1/*` using standardized JSON response formats:
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Operation completed successfully"
   }
   ```
2. **Unified API Fetcher (`client/src/lib/api.js`)**:
   - Injected with the Redux Store (`injectStore(store)`) to dynamically retrieve active access tokens.
   - Automatically injects `Authorization: Bearer <token>` from the Redux store into outbound requests.
   - Configured with `credentials: 'include'` to pass HTTP-only refresh cookies.
   - Synchronizes tokens with client cookies for Next.js Edge Middleware SSR compatibility.
3. **Silent 401 Token Refresh & Request Queueing**:
   - If an API request receives a `401 Unauthorized` status (due to token expiry), the client pauses outbound requests.
   - Requests are enqueued while a single token refresh call (`POST /api/v1/auth/refresh-token`) is executed.
   - Upon successful token refresh, the Redux store and cookies are updated, and all queued requests are replayed automatically without interrupting user workflows.

---

### Redux Toolkit State Architecture

The frontend application utilizes **Redux Toolkit (RTK)** for centralized, immutable state management structured across domain slices:

- **`authSlice`**: Stores authenticated user profiles, access tokens, loading states, and login/logout async thunks.
- **`applicationSlice`**: Manages application lists, selected loan details, active search filters, pagination metadata, and status transition actions.
- **`customerSlice`**: Manages customer profiles, search queries, and applicant registration states.
- **`workItemSlice`**: Handles task checklists, active verification statuses, and assignment states.
- **`activityLogSlice`**: Holds chronological audit logs for the currently inspected loan application.
- **`syncJobSlice`**: Tracks real-time CBS sync statuses, retry counts, and error messages.

#### Idiomatic React-Redux Hooks (`client/src/redux/hooks.js`)
Components consume state via unified helper hooks:
```javascript
// Clean component consumption
import { useAuth } from '@/redux/hooks';

export function Navbar() {
  const { user, isAuthenticated, logout, isRole } = useAuth();
  // ...
}
```

---

### Workflow State Machine & Blocking Rules

The application enforces a deterministic loan processing lifecycle:

```
                  +--------------------------------+
                  |              NEW               |
                  +---------------+----------------+
                                  |
            +---------------------+--------------------+
            |                                          |
            v                                          v
+-----------------------+                  +-----------------------+
|   WAITING_FOR_INFO    | <--------------> |      IN_PROGRESS      |
+-----------+-----------+                  +-----------+-----------+
            |                                          |
            |                                          v (All Verification items COMPLETED)
            |                              +-----------------------+
            |                              |     UNDER_REVIEW      |
            |                              +-----------+-----------+
            |                                          |
            v (Requires rejection reason)              v (FINAL_REVIEW item COMPLETED)
+-----------------------+                  +-----------------------+
|       REJECTED        |                  |       COMPLETED       |
+-----------------------+                  |   (CBS Sync Trigger)  |
            ^                              +-----------------------+
            | (Reopen by Admin/Manager)                |
            +------------------------------------------+
```

#### Transition Matrix & Role Privileges

| Current Stage | Target Stage | Permitted Roles | Blocking Rules / Prerequisites |
|---|---|---|---|
| `NEW` | `IN_PROGRESS` | ADMIN, MANAGER, EXECUTIVE | Allowed |
| `NEW` | `WAITING_FOR_INFO` | ADMIN, MANAGER, EXECUTIVE | Allowed |
| `NEW` | `REJECTED` | ADMIN, MANAGER | Must supply `rejectionReason` |
| `WAITING_FOR_INFO` | `IN_PROGRESS` | ADMIN, MANAGER, EXECUTIVE | Allowed |
| `IN_PROGRESS` | `WAITING_FOR_INFO`| ADMIN, MANAGER, EXECUTIVE | Allowed |
| `IN_PROGRESS` | `UNDER_REVIEW` | ADMIN, MANAGER, EXECUTIVE | **Blocked** if any `CIBIL_CHECK`, `DOCUMENT_VERIFICATION`, `LEGAL_TITLE_SEARCH`, or `PROPERTY_VALUATION` tasks are `OPEN`, `IN_PROGRESS`, or `BLOCKED` |
| `IN_PROGRESS` | `REJECTED` | ADMIN, MANAGER | Must supply `rejectionReason` |
| `UNDER_REVIEW` | `COMPLETED` | ADMIN, MANAGER | **Blocked** if `FINAL_REVIEW` task is missing or not `COMPLETED` |
| `UNDER_REVIEW` | `IN_PROGRESS` | ADMIN, MANAGER | Sent back for re-work |
| `UNDER_REVIEW` | `REJECTED` | ADMIN, MANAGER | Must supply `rejectionReason` |
| `COMPLETED` / `REJECTED` | `IN_PROGRESS` | ADMIN, MANAGER only | Re-opens application; resets sync status |

---

## 5. Authentication and Authorization

### Dual-Token JWT Strategy

```
[Client App (Redux)]                                           [Auth Server]
        |                                                            |
        |----- 1. POST /auth/login (email, password) --------------->|
        |<---- 2. Set-Cookie: refreshToken (HTTP-Only, 7d) ----------|
        |         Body: { accessToken (15m), user }                  |
        |         (Stored in authSlice & Cookie)                     |
        |                                                            |
        |----- 3. GET /applications (Header: Bearer accessToken) --->|
        |<---- 4. 200 OK (Data) -------------------------------------|
        |                                                            |
        |  (15 minutes elapse - accessToken expires)                 |
        |                                                            |
        |----- 5. GET /applications (Expired accessToken) ---------->|
        |<---- 6. 401 Unauthorized ----------------------------------|
        |                                                            |
        |----- 7. POST /auth/refresh-token (Cookie: refreshToken) -->|
        |<---- 8. Body: { accessToken (New 15m) } -------------------|
        |         (Dispatched to authSlice & Cookie)                 |
        |                                                            |
        |----- 9. Retry Queued GET /applications ------------------->|
        |<---- 10. 200 OK (Data) ------------------------------------|
```

1. **Access Token (15 min lifespan)**: Signed JWT containing `{ id, email, role, teamId }` passed via `Authorization: Bearer` header and stored in the Redux `authSlice`.
2. **Refresh Token (7 day lifespan)**: Secure, `HttpOnly`, `SameSite=Lax` cookie.
3. **Database Hash Check**: Refresh tokens are cryptographically hashed and stored in PostgreSQL (`User.refreshTokenHash`). On logout, the token is invalidated server-side.

---

### Role-Based Access Control (RBAC)

The system defines 3 role tiers with granular operational boundaries:

```javascript
// Server RBAC Middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};
```

- **`ADMIN`**: Full administrative CRUD across Users, Teams, Customers, and Loan Applications. Ability to trigger manual CBS sync retries and inspect global audit logs.
- **`MANAGER`**: Branch-level supervision. Ability to reassign loan applications across team executives, approve (`COMPLETED`) or `REJECT` loans, and re-open closed applications.
- **`EXECUTIVE`**: Field loan officer. Ability to register customers, create loan applications, manage assigned work item checklists, and advance applications up to `UNDER_REVIEW`.

---

### Next.js Edge Middleware & Server Guards

- **Client Route Guard (`client/src/middleware.js`)**:
  - Validates `access_token` on incoming requests before rendering React pages.
  - Unauthenticated visitors attempting to access protected routes (`/dashboard`, `/applications/*`, `/customers/*`) are redirected to `/login?from=<route>`.
  - Non-admin users attempting to access `/admin/*` are bounced back to `/dashboard?error=forbidden`.
- **Backend Route Guard (`server/middleware/auth.middleware.js`)**:
  - Re-verifies cryptographic token signature and checks if user is active in PostgreSQL.

---

## 6. External Integration (Core Banking System — CBS)

The Core Banking System (CBS) integration registers approved loans into the bank's master financial database.

### When Synchronization Occurs

1. When a loan application is transitioned to **`COMPLETED`** (Sanctioned), the backend executes an atomic Prisma transaction:
   - Sets `LoanApplication.stage = 'COMPLETED'`
   - Creates or updates a `CbsSyncJob` record with `status = 'PENDING'`
   - Records an `ActivityLog` entry (`STATUS_CHANGED`)
2. Immediately upon committing the transaction, the server triggers an asynchronous call to `cbsIntegrationService.triggerSync(applicationId)`.

---

### Failure Handling & Exponential Backoff

If the CBS endpoint is unavailable, responds with an HTTP error (500/503), or times out (after 10,000ms):

1. **Attempt Increment**: `CbsSyncJob.attempts` is incremented.
2. **Exponential Backoff Calculation**:
   $$\text{Backoff Interval} = \min(60\,000 \times 2^{(\text{attempt} - 1)},\, 3\,600\,000)\text{ ms}$$
   - Attempt 1 failure $\rightarrow$ Next retry in **1 minute**
   - Attempt 2 failure $\rightarrow$ Next retry in **2 minutes**
   - Attempt 3 failure $\rightarrow$ Next retry in **4 minutes**
   - Attempt 4 failure $\rightarrow$ Marked as **`EXHAUSTED`**
3. **Status Update**: Job status transitions to `FAILED` (or `EXHAUSTED`).
4. **Audit Log**: `CBS_SYNC_FAILED` or `CBS_SYNC_EXHAUSTED` is recorded in `ActivityLog`.
5. **Background Polling Worker (`cbsRetryWorker.js`)**: Runs every 60 seconds, polling for jobs with `status = 'FAILED'` and `nextRetryAt <= new Date()`, automatically retrying eligible jobs.
6. **Manual Trigger Endpoint**: Administrators can manually retry exhausted or failed jobs at any time via `POST /api/v1/cbs-sync/:applicationId/retry`.

---

### Concurrency, Idempotency & Duplicate Prevention

To guarantee that the initial sync trigger, background retry worker, and manual admin clicks never result in duplicate CBS entries:

1. **Pessimistic State Locking via `updateMany`**:
   ```javascript
   const lockResult = await prisma.cbsSyncJob.updateMany({
     where: {
       applicationId: appId,
       status: { in: ['PENDING', 'FAILED', 'EXHAUSTED'] },
     },
     data: {
       status: 'IN_PROGRESS',
       lastAttemptAt: new Date(),
     },
   });
   if (lockResult.count === 0) {
     return; // Another worker or process already acquired the lock
   }
   ```
2. **Success Guard**: If `job.status === 'SUCCESS'`, the sync runner immediately exits without making an HTTP call.
3. **Idempotency Key**: The CBS payload includes `applicationId` and customer `panNumber`, allowing CBS to enforce idempotency on its side.

---

### Production Improvements for CBS Integration

For high-throughput enterprise deployments:
- **Dedicated Message Queue**: Migrate from database polling to **BullMQ + Redis** or **RabbitMQ** for event-driven job dispatching.
- **Dead-Letter Queue (DLQ)**: Route `EXHAUSTED` jobs to a DLQ with real-time Slack/PagerDuty alerts for loan operations teams.
- **Mutual TLS & HMAC Request Signing**: Secure CBS network transport with mTLS certificates and cryptographically signed headers (`X-Signature-SHA256`).
- **Circuit Breaker Pattern**: Integrate `opossum` circuit breakers to temporarily pause outbound calls if CBS error rates exceed 50% over a 1-minute window.

---

## 7. Assumptions and Trade-offs

1. **Redux Toolkit vs Zustand / Context**:
   - *Decision*: Adopted Redux Toolkit for centralized domain-driven state slices with structured action creators and thunks.
   - *Rationale*: Provides strict predictability, predictable debugging with Redux DevTools, and clean separation across async data flows.
2. **Database-Backed Job Queue vs. Redis**:
   - *Decision*: Implemented a database-backed job queue with `nextRetryAt` timestamps and atomic locking rather than requiring Redis.
   - *Rationale*: Keeps the project lightweight, portable, and runnable with a single PostgreSQL instance for assessment evaluation.
3. **Mock CBS Endpoint**:
   - *Decision*: Included an internal `/mock-cbs/sync` endpoint that simulates configurable success, timeout, and failure scenarios.
   - *Rationale*: Allows end-to-end testing of retry loops, backoff delays, and error logging without external banking sandbox dependencies.

---

## 8. Incomplete Features & Future Roadmap

All core requirements from Sections 1–16 of the Technical Assessment specification are **100% complete and operational**. Future extensions include:

| Feature Area | Production Implementation Strategy | Reason for Prioritization |
|---|---|---|
| **Real-time WebSockets / SSE** | Integrate Socket.io to push real-time stage updates to the dashboard without manual page refreshes. | Prioritized rock-solid REST polling & optimistic UI updates. |
| **Document File Uploads (S3 / Blob)** | Direct multipart uploads to AWS S3 / Cloudflare R2 with pre-signed URLs. | Prioritized data verification status tracking and work item management. |
| **Automated OCR & CIBIL API** | Direct webhook integrations with credit bureaus (TransUnion CIBIL, Experian) and Aadhaar/PAN OCR services. | Simulated via comprehensive `WorkItem` verification checklists. |

---

## 9. Production Considerations

Before deploying to a public production environment:

1. **Containerization & Orchestration**:
   - Package `client/` and `server/` with multi-stage `Dockerfile` configurations.
   - Use `docker-compose.yml` for unified local staging and Kubernetes Helm charts for production clusters.
2. **Database Scaling & Connection Pooling**:
   - Deploy **PgBouncer** in front of PostgreSQL to handle high-concurrency connection spikes.
   - Separate read replicas for high-volume search and reporting queries.
3. **Security & Secrets Management**:
   - Store JWT secrets and database connection strings in AWS Secrets Manager or HashiCorp Vault.
   - Configure strict Content Security Policy (CSP) headers and origin validation.
4. **Observability & APM**:
   - Add structured JSON logging with **Pino** or **Winston**.
   - Stream application metrics and trace spans to **Datadog**, **Prometheus/Grafana**, or **OpenTelemetry**.
5. **Automated CI/CD**:
   - Setup GitHub Actions pipeline to run ESLint, unit/integration test suites, Prisma migrations, and automated container builds.
