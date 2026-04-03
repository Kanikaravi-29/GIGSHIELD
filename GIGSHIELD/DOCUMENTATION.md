# GigShield: Complete Application Documentation & Workflow Guide

This document provides a comprehensive guide to the GigShield platform, including its architecture, core features, database schema, and the step-by-step user workflows (from onboarding to automated claims).

---

## 🚀 1. Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Local Development
1. **Repository Setup**:
   ```bash
   git clone https://github.com/Kanikaravi-29/GIGSHIELD.git
   cd GIGSHIELD/GIGSHIELD
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Application**:
   ```bash
   # Start the backend server (on port 3001)
   npm run dev:server
   # Start the frontend (on port 5173)
   npm run dev
   ```

---

## 🏗️ 2. System Architecture

The GigShield platform follows a modern full-stack architecture:

- **Frontend**: **React.js** + **TypeScript** (Vite), **Tailwind CSS** for styling, and **Recharts**.
- **Backend**: **Node.js** + **Express.js**.
- **Database**: **SQLite** (managed via `sqlite3` and `sqlite` wrapper for async support).
- **Security**: Stateless **JWT** authentication and **bcrypt** for hashing.

---

## 👤 3. User Roles & Access Control

GigShield uses a role-based access control (RBAC) system:

### A. Gig Partners (Workers)
*   **Role**: `worker`
*   **Sign-up**: Provide Name, Email, Password, City, Zone, Daily Income, and Platform (Amazon/Flipkart).
*   **Main Task**: Managing insurance coverage and triggering disruption simulations.

### B. Insurance Providers (Admins-to-be)
*   **Role**: `provider` (initially) -> `admin` (after approval)
*   **Sign-up**: Register as a provider and wait for a Control Admin to verify.
*   **Main Task**: Portfolio management, claim oversight, and fraud monitoring.

### C. Platform Administrators (Admins)
*   **Role**: `admin`
*   **Admin Types**:
    1.  **Control Admin**: High-level platform governance and user approvals.
    2.  **Security Admin**: Specialized in fraud monitoring and claim auditing.
    3.  **Verification Admin**: Focus on user verification and identity.

---

## ⚡ 4. Core Feature: Parametric Insurance

Unlike traditional insurance, GigShield uses **Parametric Insurance**, where payouts are triggered by measurable real-world events.

### Step-by-Step Insurance Lifecycle:
1.  **Activation**: A worker selects a 7-day policy (Basic, Standard, or Premium).
2.  **Detection**: The system (or mock API) detects a disruption (e.g., Heavy Rain) in the worker's zone.
3.  **The Trigger**: A `POST /api/trigger` call is made.
4.  **Automatic Processing**:
    -   The system checks for an active policy.
    -   If the trigger is covered, it **automatically generates a claim**.
    -   The claim status is instantly updated on the worker's dashboard.

---

## 🕵️ 5. AI-Driven Fraud Protection

Every automated claim is analyzed for potential fraud based on four real-time checks:

1.  **Velocity Check**: Blocks/Flags if more than 10 claims are filed within 24 hours.
2.  **Income-to-Payout Ratio**: Flags claims where the payout is >150% of the daily income.
3.  **Duplicate Protection**: Ensures no duplicate claims for the same event in the same zone within 24 hours.
4.  **GPS Consistency**: Verifies that the claim location (reported via the trigger) matches the worker's registered work zone.

---

## 📊 6. Administrative Command Center

The Admin/Insurance Provider dashboard features:
-   **Live Analytics**: Total payouts, active policies, and risk score averages.
-   **Member Directory**: Search and filter all users by name, role, city, and status.
-   **Claims Management**: View audit trails for every claim, including fraud risk assessments and GPS match logs.
-   **Portfolio Controls**: Insurance providers can manually approve/reject or review flagged claims.

---

## 🗄️ 7. Database Implementation

The SQLite database (`database.sqlite`) is the engine of the platform, containing four core tables:

*   **Users**: Detailed profiling of workers, platform IDs, and roles.
*   **Policies**: Historical and currently active 7-day insurance periods.
*   **Claims**: Record of all triggered payouts and their fraud risk evaluation.
*   **Triggers**: Log of all detected/simulated disruption events.

---

## 🛠️ 8. Developer & Deployment Utilities

*   **Database Initializer**: `server/db.ts` automatically runs migrations and seeds essential accounts (Super Admins and Demo Workers) on startup.
*   **Recursive Role Unification**: The server ensures that all approved Insurance Providers are granted appropriate 'Admin' privileges to maintain system governance.
*   **Health Check**: `GET /` on the backend provides status of service and database connectivity.

---

## 📜 9. API Reference Summary

### Auth
- `POST /api/auth/signup`: Create account.
- `POST /api/auth/login`: Authenticate and receive JWT.

### Workers
- `POST /api/policy/activate`: Start 7-day coverage.
- `GET /api/policy/user`: View active policy.
- `POST /api/trigger`: Detect disruption and create auto-claim.
- `GET /api/claims/user`: View personal claim history.

### Admins
- `GET /api/admin/stats`: Get dashboard analytics.
- `GET /api/admin/workers`: Search/Filter member directory.
- `GET /api/admin/claims`: View all platform claims.
- `PUT /api/admin/users/:id/approve`: Approve provider applications.
- `PUT /api/admin/claims/:id`: Manually manage claim status.
