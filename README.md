# UnitWise

**AI Unit and Curriculum Planning for Teachers**

UnitWise is a production-minded web application designed to help educators transform subjects, curriculum frameworks, and time constraints into comprehensive, pedagogically sound multi-week instructional plans. Grounded in **Backward Design (Understanding by Design)** and **Bloom’s Taxonomy**, UnitWise generates structured unit progressions complete with daily learning objectives, lesson sequences, formative assessments, tiered differentiation, and authentic document exports.

---

## 📁 Project Architecture & Directory Structure

The project is organized into two primary top-level folders separating the browser application (`frontend/`) and the API server (`backend/`):

```text
UnitWise/
├── backend/                        # Node.js + Express API server & AI engine
│   ├── data/                       # Persistent JSON store (plans.json, settings.json)
│   ├── src/
│   │   ├── config/                 # Environment and server configuration
│   │   ├── controllers/            # Route controllers (plans, AI, exports, settings)
│   │   ├── models/                 # Zod validation schemas & TypeScript domain types
│   │   ├── routes/                 # Express routers (/api/plans, /api/generate, etc.)
│   │   ├── services/
│   │   │   ├── ai/                 # Gemini live provider & pedagogical fallback engine
│   │   │   ├── export/             # Word (.docx), PDF, CSV, and HTML print generators
│   │   │   └── storage/            # File-backed database service
│   │   ├── types/                  # Type definitions re-exported from models
│   │   ├── seeds.ts                # Initial curriculum plan seeds
│   │   └── index.ts                # Express application entry point
│   ├── tests/                      # Automated Vitest test suite
│   ├── package.json                # Backend dependencies and scripts
│   ├── tsconfig.json               # Backend TypeScript configuration
│   ├── vitest.config.ts            # Vitest runner configuration
│   └── .env.example                # Backend environment template
│
├── frontend/                       # React 18 + Vite + Tailwind CSS web application
│   ├── public/                     # Static assets (favicon, icons)
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── dashboard/          # Metrics, templates, plan list
│   │   │   ├── layout/             # AppShell, Navbar, responsive drawer
│   │   │   ├── library/            # Saved curriculum plan repository
│   │   │   ├── settings/           # Preferences and AI credentials modal
│   │   │   ├── wizard/             # 4-stage backward design plan creator
│   │   │   └── workspace/          # Multi-tab plan editor & auto-expanding cards
│   │   ├── data/                   # Quick-start curriculum starter blueprints
│   │   ├── services/               # Frontend API client service
│   │   ├── styles/                 # Global styles and Tailwind design system (index.css)
│   │   ├── types/                  # UI domain types & Zod schemas
│   │   ├── App.tsx                 # Root application state & navigation router
│   │   └── main.tsx                # Client entry point
│   ├── index.html                  # HTML template with theme bootstrap script
│   ├── package.json                # Frontend dependencies and scripts
│   ├── postcss.config.js           # PostCSS configuration
│   ├── tailwind.config.js          # Tailwind tokens (SaaS Blue & Midnight Navy)
│   ├── tsconfig.json               # Frontend TypeScript configuration
│   ├── tsconfig.node.json          # Vite node configuration
│   ├── vite.config.ts              # Vite bundler & API proxy configuration
│   └── .env.example                # Frontend environment template
│
├── .env.example                    # Global environment variable template
├── .gitignore                      # Git ignore rules for both tiers
├── package.json                    # Root npm workspace orchestrator
└── README.md                       # Project documentation
```

---

## 🌟 Key Features

### 1. Pedagogical Backward-Design Engine
- **Unit-Level Enduring Understandings**: Establishes broad learning outcomes before planning daily lessons.
- **Measurable Bloom’s Objectives**: Generates observable action verbs (*Analyze*, *Calculate*, *Construct*, *Evaluate*, *Formulate*) with explicit success criteria for every session.
- **Strict Schedule Rigor**: Exactly allocates teaching time (e.g., 4 weeks &times; 5 days = 20 sessions) and partitions daily class minutes across 6 distinct phases (*Opening*, *Direct Instruction*, *Guided Practice*, *Collaborative/Independent Application*, *Formative Check*, *Closure*).
- **Honest Standards Alignment**: Differentiates between *Verified*, *Teacher-Provided*, and *Suggested (Unverified)* standards with clear disclaimers, avoiding fabricated compliance.

### 2. Comprehensive Plan Creation Wizard
- **4-Stage Form Layout**: Core unit specifications, instructional schedule constraints, pedagogical goals, and collapsible inclusivity options.
- **Real-Time Schedule Calculation Preview**: Dynamic validation calculating exact session count and instructional minutes.
- **Multi-Stage Generation Feedback**: Explains the backward-design process through animated status steps.
- **Quick-Start Curriculum Templates**: One-click preloading for Algebra I, NGSS Ecosystems, AP ELA Rhetorical Analysis, and Python Computational Thinking.

### 3. Interactive Plan Workspace
- **Overview & Goals Tab**: Unit vision, enduring understandings, roadmap progression, and editable objectives.
- **Weekly Scope Tab**: Thematic milestones, key vocabulary, prerequisites, weekly checkpoints, and reflection prompts with non-clipping multi-line wrapped titles.
- **Daily Lessons Tab**: Session cards with inline editing, session reordering, and per-lesson AI adaptation (*Regenerate*, *Simplify for Grade Level*, *Make More Interactive*, *Expand Differentiation*).
- **Standards Matrix Tab**: Unified standards reference across all lessons with verification status tracking.
- **Assessments & Rubric Tab**: Formative repository plus end-of-unit capstone project with a 4-tier rubric (*Exemplary*, *Proficient*, *Developing*, *Beginning*).
- **Materials & Resources Tab**: Categorized inventory (Digital, Printable, Lab/Hands-on, Readings).

### 4. Real Multi-Format Document Export
- **Microsoft Word (.docx)**: Generated via `docx` with native tables, headings, and margins.
- **PDF Document (.pdf)**: High-resolution PDF with styled headers, lesson tables, and page numbers.
- **Print-Friendly HTML**: Dedicated clean view optimized for printing or browser "Save as PDF" with `@media print` rules.
- **CSV Schedule Tracker**: Tabular export ready for Excel or Google Sheets.

### 5. Persistent Storage & Teacher Preferences
- **File-Backed Persistent Store**: Plans persist across browser refreshes and server restarts in `backend/data/plans.json` with atomic writes.
- **Settings & AI Configuration**: Configure default curriculum frameworks, grade levels, preferred formats, and Google Gemini API credentials.
- **High-Fidelity Demo Mode**: Full functionality available out of the box even without an external API key.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite |
| **Backend** | Node.js, Express, TypeScript (`tsx`), CORS, Dotenv |
| **Data Validation** | Zod schemas for all domain entities and requests |
| **AI Integration** | Google Gemini (`@google/generative-ai`) + Fallback Backward-Design Engine |
| **Document Generation** | `docx` (Word), `jspdf` & `jspdf-autotable` (PDF) |
| **Testing** | Vitest (15 automated unit & integration tests) |

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js 18+ (tested on Node v26)
- npm 9+

### 1. Install Dependencies
Run `npm install` from the repository root to install dependencies for both the frontend and backend workspaces:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Set `GEMINI_API_KEY=your_key` in `.env` or `backend/.env` to connect live Google Gemini AI. If omitted, UnitWise operates in high-fidelity Demo Mode.)*

### 3. Run Development Servers

#### Option A: Run Both Concurrently from Root
```bash
npm run dev
```
Starts:
- **Backend API**: `http://localhost:3001`
- **Frontend App**: `http://localhost:5173`

#### Option B: Run Individually from Root
```bash
npm run server   # Starts Express backend on port 3001
npm run client   # Starts Vite frontend on port 5173
```

#### Option C: Run Within Each Folder
```bash
# Terminal 1 (Backend):
cd backend
npm run dev

# Terminal 2 (Frontend):
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🧪 Testing & Production Build

### Run Unit and Integration Tests
```bash
npm test
```
*Executes all 15 test cases covering schedule consistency, Bloom's action verbs, formative assessments, phase durations, persistence, and exports.*

To run tests directly inside the backend:
```bash
cd backend
npm test
```

### Run Production Build
```bash
npm run build
```
Executes type checks and builds both packages:
- Backend: `npm run backend:build` (`tsc --noEmit`)
- Frontend: `npm run frontend:build` (`tsc && vite build`)

---

## 🔒 Security & Verification Principles
- **No Secret Key Exposure**: All AI provider integrations and secret credentials exist exclusively in server-side code (`backend/`).
- **Zero Hallucination of Standards**: The system explicitly marks unverified curriculum codes with `'suggested_unverified'` and provides a professional review disclaimer.
- **Graceful Fault Tolerance**: Generation inputs are preserved upon error, allowing immediate retry without data loss.
#   U n i t w i s e 1  
 #   U n i t w i s e 1  
 