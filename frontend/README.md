# Kynora Frontend Application

The **Kynora Frontend** is a modern, responsive Single Page Application (SPA) built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**. It provides an intelligent, dark-themed dashboard for managing inboxes, viewing Scikit-learn priority classifications, interacting with contextual AI reply suggestions, and synchronizing real Gmail messages.

---

## 1. Architecture & Component Structure

The frontend codebase is organized cleanly into modular, single-responsibility components and strict type definitions:

```
frontend/
├── src/
│   ├── components/
│   │   ├── ActionRequiredView.tsx   # View isolating emails flagged for user action
│   │   ├── AnalyticsView.tsx        # Inbox distribution & classification analytics
│   │   ├── AuthModal.tsx            # Login & registration modal dialog
│   │   ├── CategoriesView.tsx       # Grid view grouping emails by predicted category
│   │   ├── DashboardView.tsx        # Primary multi-pane dashboard layout
│   │   ├── EmailDetail.tsx          # Full email view with AI analysis & Smart Reply UI
│   │   ├── EmailList.tsx            # Scrollable email list with search & filter indicators
│   │   ├── EmailRow.tsx             # Individual email item row with priority badges
│   │   ├── KynoraBrief.tsx          # High-priority executive inbox summary card
│   │   ├── Placeholder.tsx          # Empty-state and loading placeholder graphics
│   │   ├── PriorityBadge.tsx        # Color-coded badge for Urgent/High/Medium/Low
│   │   ├── PriorityInboxView.tsx    # Filtered view focused strictly on high-priority items
│   │   ├── SettingsView.tsx         # Account details, Gmail OAuth status, & sync triggers
│   │   ├── Sidebar.tsx              # Primary collapsible navigation bar
│   │   ├── StatsBar.tsx             # Top KPI counter bar (Total, Urgent, Action, Deadlines)
│   │   ├── Toolbar.tsx              # Quick filter buttons, search input, and sort controls
│   │   └── TopNav.tsx               # Header with user avatar, sync status, and login button
│   ├── api.ts                       # Typed REST client communicating with FastAPI
│   ├── App.tsx                      # Root component, view state router, and auth manager
│   ├── index.css                    # Tailwind CSS directives & global scrollbar styling
│   ├── main.tsx                     # React 18 DOM mount entrypoint
│   ├── types.ts                     # TypeScript interfaces aligned with backend Pydantic models
│   ├── utils.ts                     # Date formatting, priority color mapping, badge helpers
│   └── vite-env.d.ts                # Vite environment variable type declarations
├── .env.example                     # Frontend environment configuration template
├── index.html                       # HTML5 entrypoint with Google Fonts
├── package.json                     # NPM dependencies and build scripts
├── postcss.config.js                # PostCSS configuration for Tailwind CSS
├── tailwind.config.js               # Custom dark navy theme & color palette configuration
├── tsconfig.json                    # Strict TypeScript compiler options
└── vite.config.ts                   # Vite bundler configuration & dev server proxy
```

---

## 2. Views & Key Features

### 1. Dashboard View (`DashboardView.tsx`)
- Displays the top KPI metrics bar (`StatsBar`).
- Features a quick-action toolbar (`Toolbar`) supporting real-time search and filter chips.
- Houses a responsive split pane: the email list on the left and selected email inspection on the right.

### 2. Priority Inbox View (`PriorityInboxView.tsx`)
- Filters down the inbox exclusively to **Urgent** and **High** priority messages.
- Surfaces critical messages requiring immediate attention based on the Scikit-learn priority classifier.

### 3. Action Required View (`ActionRequiredView.tsx`)
- Highlights messages where Kynora's ML and heuristic engine detected actionable requests, pending questions, or tasks assigned to the user.

### 4. Categories View (`CategoriesView.tsx`)
- Organizes messages into category cards:
  - `Work`
  - `Personal`
  - `Finance`
  - `Notifications`
  - `Newsletter`
  - `Security`

### 5. Analytics View (`AnalyticsView.tsx`)
- Visual metrics displaying priority distributions, category percentages, read-vs-unread ratios, and workload velocity.

### 6. Email Detail & Smart Reply (`EmailDetail.tsx`)
- Displays email sender, recipient, timestamp, subject, and full message body.
- **AI Analysis Drawer**: Shows predicted priority score (0–100), detected category, action items checklist, extracted deadlines, and summary.
- **Smart Reply Assistant**:
  - Select between 4 tones: **Professional**, **Friendly**, **Formal**, or **Concise**.
  - Optional custom instruction input to guide the draft.
  - One-click copy to clipboard.
  - Strictly local and non-intrusive: replies are never sent to Gmail or saved as external drafts.
- **Model Feedback Modal**: Allows the user to correct the model's priority or category, storing feedback for training improvements.

### 7. Settings & Gmail Connection (`SettingsView.tsx`)
- Displays current user profile information.
- Shows real-time Google Gmail connection status.
- "Connect Gmail" button initiating the secure OAuth 2.0 flow.
- "Sync Now" button triggering incremental synchronization of new messages.
- "Disconnect" button revoking access and removing encrypted tokens.

---

## 3. Design System & Styling

Kynora uses a bespoke dark navy design system configured in `tailwind.config.js`:

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `background` | `#070B14` | Application canvas background |
| `surface` | `#0D1526` | Card, sidebar, and container background |
| `surface-hover`| `#131F37` | Hover state for interactive items |
| `border` | `#1E2D4A` | Subtle dividers and card borders |
| `primary` | `#3B82F6` | Accent buttons, active tabs, and primary actions |
| `urgent` | `#EF4444` | Urgent priority badges and high-severity indicators |
| `high` | `#F97316` | High priority badges |
| `medium` | `#EAB308` | Medium priority badges |
| `low` | `#10B981` | Low priority badges |

Icons are provided by [Lucide React](https://lucide.dev/).

---

## 4. API Integration & Authentication

The frontend client in `src/api.ts` manages communication with the FastAPI backend:

- **Session Persistence**: Stores the Kynora session token securely in browser `localStorage`.
- **Automatic Header Injection**: Attaches `Authorization: Bearer <token>` to all authenticated requests.
- **Unauthenticated Fallback**: If a user is not logged in, the UI smoothly displays seeded sample emails, allowing guest exploration of all features.
- **OAuth Callback Handling**: Catches Google OAuth redirect parameters in the URL, updates authentication state, and cleans up URL parameters.

---

## 5. Setup & Development

### Prerequisites
- Node.js `18.0.0` or higher
- npm `9.0.0` or higher

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```ini
VITE_API_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```
The Vite development server will start at `http://localhost:5173`.

### 4. Build for Production
To typecheck and compile the production bundle:
```bash
npm run build
```
Production assets are generated in `frontend/dist/`.

To preview the production build locally:
```bash
npm run preview
```
