# ✦ SpendSage — Production MERN Personal Finance Platform

> An enterprise-grade, privacy-conscious personal wealth and finance management platform built with the MERN stack (MongoDB, Express, React, Node.js), TypeScript, Tailwind CSS, Recharts, and provider-agnostic AI financial intelligence ("Sage").

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38B2AC.svg)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

---

## 🌟 Key Architectural Highlights

SpendSage has been re-architected from the ground up from an offline prototype into a high-performance, full-stack personal finance suite with strong tenant isolation, atomic transaction handling, and automated financial analytics.

### 💼 Wealth & Account Management
- **Multi-Account Vault:** Aggregate Checking, Savings, Cash, Digital Wallets, and Credit Cards.
- **Double-Entry Transfers:** Atomic fund transfers between accounts with linked transfer records and automatic balance reconciliation.
- **Dynamic Net Worth Engine:** Real-time net worth calculation (Total Assets minus Credit Liabilities) with credit limit utilization tracking.

### 📊 Deep Financial Analytics & Visualizations
- **Recharts Interactive Dashboards:**
  - 30-day Cash Flow Trend Area Charts with linear gradients.
  - Multi-month Income vs. Expenses comparative charts.
  - Category spending donut distribution.
  - Day-of-week spending habits bar chart (identifying weekend vs. weekday spending spikes).
  - Top merchant outflow rankings and largest individual transaction tracking.
- **Period-over-Period Performance:** Automated delta percentages for income, expenses, and savings rate.

### 🎯 Budgets & Forecasting
- **Live Spending Pace:** Real-time tracking of categorical expenses against active budget thresholds.
- **Daily Safe Pace:** Automatically computes remaining safe daily spend to stay within budget.
- **Month-End Projections:** Statistical linear pacing to project end-of-month utilization before overspending occurs.
- **Automated Alerts:** Warning notifications when category spending breaches 75% or 90% alert thresholds.

### 📅 Recurring Bills & Subscriptions
- **Smart Recurrence Engine:** Weekly, monthly, quarterly, and annual frequency scheduling.
- **Due Date Timeline:** Automatically segregates upcoming, overdue, and paid commitments with countdown day badges.
- **One-Click Settlement:** Mark bills as paid with optional automated checking/credit account debit and advance to the next due date.

### 🏆 Milestone Savings Goals
- **Target Tracking:** Progress rings, saved vs. target sums, target completion dates, and priority weighting.
- **Contribution Pace Engine:** Automatically calculates required monthly and weekly contributions needed to reach goals on time.
- **Dedicated Fund Allocations:** Log contributions directly deducted from bank/cash accounts.

### 🤖 "Ask Sage" AI Financial Intelligence
- **Provider-Agnostic Engine:** Pluggable AI integration supporting OpenAI (GPT-4o-mini), Google Gemini (Gemini 1.5 Flash), or local deterministic fallback engines.
- **Zero Hallucination Grounding:** Sage only answers based on aggregated, user-scoped financial data context.
- **Automated Anomaly Detection:** Flags transactions that deviate &gt; 2.5x from category historical averages.
- **What-If Scenario Simulator:** Interactive simulator calculating annual compound savings from discretionary spending cuts.

### 🧾 Tesseract.js OCR Receipt Scanner
- Client and server-side image processing extracting Merchant, Total Amount, and Date from physical paper receipts to auto-populate transaction forms.

### 📥 CSV Import & Data Portability
- **Universal CSV Statement Importer:** Bulk upload bank statements with automated column mapping, date/amount validation, and account balance syncing.
- **Executive Statement PDF Generator:** Native vector PDF export powered by PDFKit.
- **Full Data Backup & Restore:** Complete JSON export/import and GDPR-compliant account wipe.

---

## 🏗️ Monorepo Architecture

```
SpendSage/
├── client/                     # React 18 + Vite + TypeScript Frontend
│   ├── public/                 # Static assets, PWA manifest.json, sw.js
│   ├── src/
│   │   ├── api/                # Axios instance, token refresh queue, typed endpoints
│   │   ├── components/         # Reusable UI library (Card, Modal, Button, Badge, etc.)
│   │   ├── hooks/              # Custom hooks (useAuth, TanStack mutations)
│   │   ├── layouts/            # AppLayout (Sidebar, Mobile BottomNav), AuthLayout
│   │   ├── pages/              # Dashboard, Transactions, Budgets, Bills, Goals,
│   │   │                       # Accounts, Analytics, AI Insights, Reports, Settings
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── store/              # Zustand persistent auth state
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   └── utils/              # Formatting, class merging, date utilities
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── __tests__/          # Vitest unit & calculation test suites
│   │   ├── config/             # Environment validation, MongoDB connection
│   │   ├── controllers/        # Thin HTTP controllers with error wrapping
│   │   ├── middleware/         # JWT auth, rate limiters, multer, error handler
│   │   ├── models/             # 13 Mongoose schemas with compound indexes & types
│   │   ├── routes/             # RESTful API routers (14 sub-routers)
│   │   ├── services/           # Business logic, aggregation pipelines, AI engine
│   │   ├── utils/              # AppError, logger, apiResponse helpers
│   │   ├── app.ts              # Express configuration & health check
│   │   └── server.ts           # Server bootstrap & graceful shutdown
│   ├── package.json
│   └── tsconfig.json
├── archive/                    # Archived original prototype assets
├── package.json                # Root monorepo workspace orchestration
└── README.md
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [MongoDB](https://www.mongodb.com/) (Local instance running at `localhost:27017` or MongoDB Atlas URI)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ShashankUpadhyay45/ExpenseTrackerApp.git
cd ExpenseTrackerApp

# Install all monorepo, server, and client dependencies
npm run install:all
```

### 2. Environment Configuration

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/spendsage
JWT_SECRET=super_secure_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=super_secure_refresh_token_secret_key
JWT_EXPIRE=15m
CORS_ORIGIN=http://localhost:5173
AI_PROVIDER=gemini # or openai
AI_API_KEY=your_gemini_or_openai_api_key_here
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Launch Development Servers
```bash
# Runs both backend (port 5000) and frontend (Vite port 5173) concurrently:
npm run dev
```

Visit `http://localhost:5173` to experience SpendSage.

---

## 🧪 Testing & Verification

Run the automated test suite powered by Vitest:
```bash
# Run server calculation and error handler tests
npm test
```

Build production distributions for deployment:
```bash
# Typechecks and compiles both client and server
npm run build
```

---

## 🔐 Security & Hardening Measures

- **Authentication & Session Security:** Access tokens (15-minute lifetime) paired with cryptographically rotated 7-day Refresh Tokens.
- **Tenant Scoping & Anti-IDOR:** Every single service method strictly scopes database queries by authenticated `userId`.
- **Injection Protection:** Parameterized Mongoose queries; Helmet HTTP headers enabled.
- **Rate Limiting:** Dedicated rate limit tiers for general browsing (`100/15m`), authentication endpoints (`20/15m`), and AI completions (`10/1m`).
- **File Upload Guard:** Strict MIME type checking and file size thresholds for receipts and CSV statements.
- **Audit Logging:** System events, balance transfers, and password changes record timestamps and client metadata.

---

## 🚀 Production Deployment Guide

### Frontend (Vercel / Netlify)
1. Set the root directory to `client`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Environment variable: `VITE_API_URL=https://your-backend-api.com/api`.

### Backend (Render / Railway / AWS / DigitalOcean)
1. Set the root directory to `server`.
2. Build command: `npm run build`.
3. Start command: `npm start`.
4. Ensure environment variables (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`) are configured in your hosting dashboard.

---

## 📜 License
Distributed under the MIT License. Designed and developed with modern engineering standards for personal finance security.