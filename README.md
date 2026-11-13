# FlowQueue - Full-Stack Queue Management System

A production-grade, full-stack Queue Management Application engineered for high-concurrency environments (hospitals, banks, service centers, and government offices). FlowQueue pairs an **operational UI** with a **transactionally safe Node.js/Express + SQLite backend**, delivering real-time waiting list orchestration, dynamic priority shifting, one-click counter dispatch, and queue analytics.

---

## 🚀 Key Features & Requirements Matrix

| ID    | Requirement                        | Implementation Details                                                                                                                                                                                    |
| ----- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Manager Login & Queue Creation** | Secure JWT authentication with `bcryptjs` password hashing. Role-based session management, pre-loaded demo account, and intuitive queue creator.                                                          |
| **2** | **Named Queues**                   | Supports multi-queue environments (e.g. _General Service_, _VIP Priority Desk_, _Technical Verification_) with customized token prefixes (`GEN-`, `VIP-`, `TEC-`).                                        |
| **3** | **Add Persons / Issue Tokens**     | Issues sequential smart tokens (`GEN-001`, `VIP-002`) with customer name, phone, optional email, notes, priority levels (`NORMAL`, `PRIORITY`, `VIP`), and timestamp.                                     |
| **4** | **Waiting Queue Display**          | Live, high-visibility waiting line showing current positions (`#1`, `#2`, `#3`), customer details, priority tags, and live elapsed wait timers (`tabular-nums` without layout jitter).                    |
| **5** | **Move Tokens Up & Down**          | Move tokens UP or DOWN with optimistic frontend transitions and atomic database transactions (`prisma.$transaction`) ensuring zero position drift or duplicates.                                          |
| **6** | **Serve Top Token ("Call Next")**  | Single-click action pulling the #1 waiting token to `IN_SERVICE`, stamping `servedAt`, triggering Web Audio chime announcements (`C5 -> G5`), and shifting remaining line positions.                      |
| **7** | **Cancel Token with Reason**       | Cancel token with customizable reason tracking (`no-show`, `customer request`, etc.), immediately compacting remaining positions.                                                                         |
| **8** | **Analytics Dashboard**            | Live operational metrics: **Average Wait Time**, **Average Service Duration**, **Hourly Arrival Distribution Curves** (Recharts), **Token Status Breakdown Donut**, and **Queue Efficiency Comparisons**. |
| **+** | **Digital Signage Kiosk Board**    | Dedicated fullscreen Public Display View for lobby TV monitors with real-time "NOW SERVING" announcements and "UP NEXT" list.                                                                             |

---

## 🛠️ Tech Stack & Technical Decisions

| Layer                  | Technology                      | Architectural Rationale                                                                                                                                                            |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**           | React 18, Vite, TypeScript      | Fast bundling, component modularity, and strict type safety.                                                                                                                       |
| **Styling & Design**   | Tailwind CSS + Lucide React     | High-contrast **Operate Mode** design adhering to the Impeccable craft floor: no nested cards, clean spacing, custom scrollbars, and zero "AI slop".                               |
| **Data Visualization** | Recharts                        | Composable SVG charts for hourly arrival curves, priority wait times, and status distributions.                                                                                    |
| **Backend API**        | Node.js, Express.js, TypeScript | Clean RESTful endpoints, Zod schema validation, and structured error handling.                                                                                                     |
| **Database & ORM**     | SQLite via Prisma ORM           | Zero-setup local execution (evaluators can run immediately without configuring PostgreSQL/MySQL services), transaction safety, and trivial migration to PostgreSQL for production. |
| **Authentication**     | JWT (JSON Web Tokens) + bcrypt  | Stateless authentication with signed tokens and secure password hashing.                                                                                                           |
| **Audio Synthesis**    | Web Audio API                   | Zero external audio asset dependencies; synthetically generates airport-grade two-tone chime (`523Hz -> 784Hz`).                                                                   |

---

## ⚡ Quick Start & Run Guide

### 1. Prerequisites

- **Node.js** v18+ installed
- **npm** v9+ installed

### 2. Clone and Setup

```bash
git clone https://github.com/Om-Suman/flowqueue.git
cd flowqueue
```

### 3. Install All Dependencies (Root, Server & Client)

```bash
npm run install:all
```

_(Or install in each directory: `npm install && npm --prefix server install && npm --prefix client install`)_

### 4. Seed Demo Data (Queues, Tokens & Historical Analytics)

```bash
npm run seed
```

This initializes the SQLite database with:

- **Sarah Jenkins** (`manager@flowqueue.com` / `password123`)
- 3 Active Queues: _General Customer Service_, _VIP & Priority Desk_, _Technical Verification_
- Active waiting line with positions #1, #2, #3, #4, #5
- In-service tokens and completed historical tokens for instant analytics rendering!

### 5. Launch the Application (One Command)

```bash
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Healthcheck**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Manager Credentials

| Field                 | Demo Credential                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Email**             | `manager@flowqueue.com`                                                                                                      |
| **Password**          | `password123`                                                                                                                |
| **One-Click Sign In** | Click **"⚡ Launch Instant Demo"** or **"⚡ Instant Demo Sign In"** on the home screen to log in immediately without typing! |

---

## 🧪 Automated End-to-End Verification

The project includes an end-to-end automated test suite verifying all 8 requirements against the live API:

```bash
npm --prefix server run test:e2e
```

**Test Output Verification:**

```
🧪 Starting FlowQueue End-to-End Verification Suite...
▶ [REQ-1] Manager Authentication
  ✓ Authenticated as Sarah Jenkins (manager@flowqueue.com)
▶ [REQ-2] Create Queue with custom name and prefix
  ✓ Created queue: "Rapid Express Test Queue"
▶ [REQ-3] Add tokens for 3 persons into the queue
  ✓ Created token: EXP-001 for Alice Morgan (Pos #1)
  ✓ Created token: EXP-002 for Bob Vance (Pos #2)
  ✓ Created token: EXP-003 for Charlie Day (Pos #3)
▶ [REQ-4] Display list of waiting tokens in queue
  ✓ Successfully retrieved 3 waiting tokens
▶ [REQ-5] Move token Bob Vance (Pos #2) UP to Pos #1
  ✓ Token EXP-002 moved UP to Position #1
  ✓ Token EXP-002 moved DOWN back to Position #2
▶ [REQ-6] Single-click "Serve Next" for token at top of queue
  ✓ Dispatched token EXP-001 to IN_SERVICE at Counter 1
▶ [REQ-7] Cancel token Charlie Day from queue
  ✓ Cancelled token EXP-003 with reason: "Customer requested reschedule"
▶ [REQ-8] Fetch analytics for wait times, queue lengths, hourly trends
  ✓ Analytics Summary: Total Tokens, Avg Wait Time, Avg Service Time, Hourly Trends
🎉 ALL 8 CORE FUNCTIONAL REQUIREMENTS VERIFIED SUCCESSFULLY!
```

---

## 💡 Technical Details for the Interview

When asked about the architectural design and algorithms used:

1. **Queue Position Ordering Algorithm**:
   - Waiting tokens are given an integer `position` (1, 2, ... N).
   - Moving UP or DOWN swaps the `position` of the target token and its adjacent neighbour within a database transaction (`prisma.$transaction`).
   - The frontend applies an **optimistic UI swap** (instant visual feedback in <16ms) while syncing with the server. If the server rejects the move, the UI rolls back.
2. **"Serve Next" Atomic Dispatch**:
   - Finds the token with `position = 1` and status `WAITING`.
   - Transitions status to `IN_SERVICE`, sets `servedAt = new Date()`, records counter name, and clears its position.
   - Atomically increments / compacts all subsequent waiting tokens ($pos \leftarrow pos - 1$), ensuring no numbering holes exist.
3. **Analytics Math**:
   - **Average Wait Time**: $\frac{1}{N}\sum (\text{servedAt} - \text{createdAt})$.
   - **Average Service Duration**: $\frac{1}{M}\sum (\text{completedAt} - \text{servedAt})$.
   - **Hourly Arrival Distribution**: Bins creation timestamps by hour ($8:00 \dots 18:00$) to identify surge/peak arrival intervals.
4. **Resilience & Fault Tolerance**:
   - Zod validation on all incoming payloads prevents malformed requests.
   - Foreign key cascading deletes (`onDelete: Cascade`) ensure orphaned tokens never exist if a queue is removed.

---

## 📂 Project Structure

```
queue_management_application/
├── client/                     # Frontend (React 18 + Vite + Tailwind + Recharts)
│   ├── src/
│   │   ├── components/         # Modular UI components
│   │   │   ├── AnalyticsDashboard.tsx  # KPI cards, Recharts trends, queue comparison
│   │   │   ├── NowServingCard.tsx      # Counter status, "Serve Next" action, timer
│   │   │   ├── WaitingQueueList.tsx    # Waiting list, move up/down, cancel buttons
│   │   │   ├── QueueSelector.tsx       # Queue switcher & creator
│   │   │   ├── DisplayBoardModal.tsx   # Fullscreen TV/Kiosk waiting room board
│   │   │   ├── AddTokenModal.tsx       # New token generation modal
│   │   │   ├── CancelModal.tsx         # Cancellation reason dialog
│   │   │   ├── LoginModal.tsx          # Manager authentication & demo login
│   │   │   └── Navbar.tsx              # Navigation bar & theme switcher
│   │   ├── context/AuthContext.tsx     # Authentication state & JWT storage
│   │   ├── services/api.ts             # Typed REST API client
│   │   ├── utils/audio.ts              # Web Audio API chime synthesizer
│   │   ├── types.ts                    # Shared TypeScript interfaces
│   │   ├── App.tsx                     # Main layout & optimistic state handlers
│   │   └── main.tsx                    # React root entry
│   └── package.json
├── server/                     # Backend API (Node.js + Express + Prisma + SQLite)
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (User, Queue, Token)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts         # Register, Login, Me endpoints
│   │   │   ├── queues.ts       # Queue CRUD & waiting list retrieval
│   │   │   ├── tokens.ts       # Issue, Move Up/Down, Serve Next, Cancel
│   │   │   └── analytics.ts    # Wait times, hourly trends, queue benchmarks
│   │   ├── middleware/auth.ts  # JWT bearer token verification
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── seed.ts             # Rich demo seed script
│   │   ├── test-e2e.ts         # Automated verification test script
│   │   └── index.ts            # Express server entry point
│   └── package.json
├── package.json                # Root orchestration scripts
└── README.md                   # Complete documentation
```
