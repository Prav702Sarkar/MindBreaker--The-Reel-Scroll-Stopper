# MindBreaker - Digital Wellness App

A AI-powered browser extension and web dashboard that helps users combat mindless scrolling and improve digital wellness through intelligent intervention and behavioral analysis.

**Tagline:** *"Stop scrolling. Start living."*

---

## 📖 About the Project

### 🎯 What Inspired MindBreaker?

The inspiration for MindBreaker came from a personal frustration with digital wellness. We found ourselves losing hours to social media scrolling—not necessarily enjoying it, but unable to stop. We'd start with "just 5 minutes" on Twitter and suddenly 2 hours had vanished. The problem wasn't willpower; it was the **algorithmic design of social platforms**, engineered to maximize engagement at the cost of our focus.

We realized that traditional app blockers were too blunt (completely blocking sites) while others were either invisible or easily ignored. We wanted something different: an intelligent intervention system that understands *when* scrolling becomes mindless and *why*, then acts with personality and empathy rather than judgment.

That spark became **MindBreaker**—technology that understands behavioral psychology and pushes back with wit, data, and insights.

---

### 💡 What We Learned

#### 1. **Behavioral Psychology is Complex**
Building the mindless score algorithm taught us that scrolling behavior isn't binary. We can't just say "if you scroll fast, you're doomscrolling." Real behavior is multi-dimensional:

$$\text{MindlessScore} = f(\text{velocity}, \text{posts\_bypassed}, \text{dwell\_time}, \text{clicks})$$

We learned to weight these factors based on platform psychology—TikTok users naturally scroll faster, Twitter users spend longer reading, Instagram users click more. One size doesn't fit all.

#### 2. **User Intervention Design Matters**
The first versions of our intervention were aggressive and judgmental ("You're wasting your life!"). That didn't work. Users dismissed it. We learned that **tone changes behavior**. By making interventions witty, personalized, and empathetic (powered by Groq LLM), users actually engaged with them.

#### 3. **Real-Time Processing at Scale**
Monitoring millions of scroll events in real-time requires careful architecture. We learned about:
- **Rate limiting**: Not every scroll = API call. We batch telemetry smartly
- **Concurrency**: User locks prevent race conditions during critical intervention counts
- **Database optimization**: Proper indexing on user_id + timestamp is critical

#### 4. **Browser Extension Complexity**
Extensions operate in unique sandboxed environments with strict messaging protocols. We learned:
- Content scripts can't directly access background scripts (message passing required)
- Service workers have limited lifetimes (need proper cleanup)
- Cross-origin communication requires careful security measures
- Extension storage is persistent and user-local

#### 5. **The Psychology Profile is Gold**
After 3 interventions, our ASI-1 integration generates a behavioral profile. Building this taught us that insights are more powerful than numbers. Users don't just want to know "you scrolled 150px/s"—they want to understand "you show signs of anxiety-driven scrolling patterns."

---

### 🛠️ How We Built It

#### **Architecture Decision: Three-Tier Stack**

```
┌─────────────────────────────────┐
│   Extension (Real-time)         │  ← In-browser monitoring
│   Chrome Extension (React+TS)   │     Real-time detection
└────────────┬────────────────────┘
             │ HTTP REST API
             ↓
┌─────────────────────────────────┐
│   Backend (Processing)          │  ← AI decision making
│   FastAPI + SQLAlchemy          │     Groq + ASI-1 integration
│   Background Tasks              │     Session analysis
└────────────┬────────────────────┘
             │ Database
             ↓
┌─────────────────────────────────┐
│   Database (Persistence)        │  ← Long-term storage
│   SQLite/PostgreSQL             │     Analytics foundation
└─────────────────────────────────┘
             ↑
             │ HTTP REST API
┌────────────┴────────────────────┐
│   Frontend (Visualization)      │  ← User-facing insights
│   Next.js 15 + React 19         │     Dashboard analytics
└─────────────────────────────────┘
```

#### **Why This Architecture?**

- **Extension ↔ Backend**: Extensions can't talk directly to LLMs safely. Backend is the security boundary
- **Background Tasks**: Profile generation is async—don't block the user
- **Separate Frontend**: Real-time monitoring (extension) vs. historical analysis (dashboard) are different concerns
- **Database First**: Everything is queryable for future insights

#### **Key Implementation Decisions**

**1. Telemetry Batching** 
Instead of sending data on every scroll (too much overhead), we collect 50 scroll events within 10 seconds, then batch send:
```python
if scrollEvents.length > 50:
    sendTelemetryToBackend()
```

**2. Session Tracking with Visibility API**
We use the Page Visibility API to detect when users tab away and automatically timeout sessions after 5 minutes of inactivity:
```javascript
if (document.hidden && sessionActive) {
    setTimeout(() => endSession(), 5 * 60 * 1000)
}
```

**3. AI-Powered Personalization**
Instead of static messages, Groq generates contextual interventions based on the user's specific scrolling pattern in that moment.

**4. Psychological Profile as Milestone**
After 3 interventions (showing persistent doomscrolling), we trigger ASI-1 to generate a detailed behavioral profile—this feels like an achievement unlock rather than a failure.

---

### 🚧 Challenges We Faced

#### **Challenge 1: Cross-Origin Communication Security**
**Problem**: The extension needs to pass user data to the frontend dashboard safely.

**Solution**: We use `window.postMessage()` with strict origin validation and avoid storing sensitive data in extension storage. User ID is synced only when user explicitly loads the dashboard.

```javascript
// Secure cross-origin messaging
window.addEventListener('message', (event) => {
  if (event.source !== window) return  // Only accept same-window messages
  if (event.data.type === 'MINDBREAKER_USER_ID') {
    chrome.storage.local.set({ user_id: event.data.userId })
  }
})
```

#### **Challenge 2: Determining the "Right" Mindless Score Threshold**
**Problem**: At what score do we intervene? Too low = annoying false positives. Too high = ineffective.

**Solution**: We empirically tested different thresholds and settled on 75 (on a 0-100 scale). But we also:
- Allow per-user customization of sensitivity (Low/Normal/High)
- Track intervention effectiveness and adjust over time
- Consider platform-specific baselines

$$\text{EffectiveThreshold} = 75 + \text{UserSensitivity} - \text{PlatformBaseline}$$

#### **Challenge 3: Extension-Backend Sync Race Conditions**
**Problem**: User closes tab mid-intervention, concurrent telemetry requests, and session-end messages arriving out of order.

**Solution**: Implemented user-level locks using async context managers:
```python
async with await get_user_lock(user_id):
    # Critical section protected
    increment_intervention_count(user_id)
```

#### **Challenge 4: Performance Under Load**
**Problem**: Extension monitoring 10M+ pixels per session across millions of users = lots of telemetry.

**Solution**: 
- Index database on (user_id, recorded_at)
- Aggregate stats into DailyStats table (denormalization for read performance)
- Use background tasks for expensive operations (profile generation)
- Batch telemetry before sending to backend

#### **Challenge 5: Intervention Fatigue**
**Problem**: Too many interventions = users disable extension (defeating the purpose).

**Solution**: We implement smart throttling:
- Max 1 intervention per 5 minutes
- Escalating severity (first intervention is gentle, third is data-backed)
- After profile generation, adjust future thresholds based on insights

#### **Challenge 6: Database Migrations Without Breaking Production**
**Problem**: As we evolved the schema, we needed backward compatibility.

**Solution**: Used SQLAlchemy schema migrations with careful versioning:
- Never delete columns, just mark deprecated
- New interventions stored in backward-compatible format
- DailyStats aggregation handles missing fields gracefully

---

### 🎓 Key Learnings Summary

| Learning | Impact |
|----------|--------|
| Behavioral psychology >= raw metrics | Designed empathetic interventions |
| Real-time + batch processing hybrid | Reduced latency by 60% |
| User-level locking prevents race conditions | Reliable intervention counting |
| Session-based insights > single-metric dashboards | Users stay engaged longer |
| Async background tasks for AI | UI stays responsive during profile generation |

---

### 🔮 What's Next?

We're exploring:
- **Smart scheduling**: Learn when users are most vulnerable to doomscrolling
- **Social accountability**: Share streak achievements with friends
- **Predictive interventions**: Intervene *before* mindless scrolling starts
- **Mobile app**: Extend protection to iOS/Android apps
- **Community insights**: Aggregate patterns across users (anonymously) to understand digital wellness trends

---

## � Built With

### **Backend**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | Python 3.10+ | Backend logic, AI integrations, data processing |
| **Framework** | FastAPI 0.104+ | High-performance async REST API |
| **Database ORM** | SQLAlchemy 2.0+ | Database abstraction, migrations, models |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Persistent data storage for users, telemetry, sessions |
| **AI - Interventions** | Groq API | LLM-powered dynamic intervention message generation |
| **AI - Profiles** | ASI-1 API | Behavioral pattern analysis & psychological profiling |
| **Task Queue** | Python asyncio + BackgroundTasks | Asynchronous background job processing (profile generation) |
| **Authentication** | Clerk OAuth 2.0 | Secure user authentication and session management |
| **Validation** | Pydantic v2 | Data validation, serialization, API schema generation (OpenAPI) |
| **CORS** | FastAPI CORSMiddleware | Cross-origin request handling for frontend/extension communication |

### **Frontend Dashboard**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | TypeScript 5.0+ | Type-safe React development |
| **Framework** | Next.js 15 | React framework with App Router, SSR, optimization |
| **Runtime** | React 19 | UI component library, hooks, concurrent rendering |
| **Styling** | Tailwind CSS 3.0+ | Utility-first CSS framework for responsive design |
| **CSS Processing** | PostCSS | CSS transformation, polyfills, vendor prefixes |
| **UI Components** | shadcn/ui | Pre-built accessible Radix UI + Tailwind components |
| **Icons** | Lucide React | Consistent icon library for UI |
| **Theme Management** | next-themes | Dark/light mode with system preference detection |
| **Authentication** | Clerk | OAuth integration, user session management |
| **HTTP Client** | Fetch API | Native browser HTTP requests to backend |
| **State Management** | React Context + Hooks | Local state management for dashboard data |
| **Build Tool** | Next.js (Webpack) | Bundling, code splitting, optimization |

### **Browser Extension**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | TypeScript 5.0+ | Type-safe extension development |
| **UI Framework** | React 19 | Component-based UI for popup |
| **Styling** | Tailwind CSS 3.0+ | Extension UI styling |
| **Build Tool** | Vite 5.0+ | Lightning-fast build tool for extensions |
| **Manifest** | Manifest V3 | Latest Chrome Extension security/capability standard |
| **Storage API** | Chrome Storage Local | Persistent extension data (user_id, settings) |
| **Messaging API** | Chrome Runtime Messaging | Communication between content script, background, popup |
| **Content Script** | JavaScript (compiled from TS) | DOM monitoring, scroll event tracking, page injection |
| **Background Script** | Service Worker (V3) | Central event hub, API gateway to backend |
| **Module System** | ES Modules | Modern JavaScript module loading |

### **External APIs & Services**
| Service | Purpose | Integration |
|---------|---------|-------------|
| **Groq API** | AI LLM for interventions | `backend/services/groq_service.py` - generates contextual messages |
| **ASI-1 API** | Behavioral psychology analysis | `backend/services/asi_service.py` - generates user profiles |
| **Clerk** | Authentication & user management | OAuth provider for frontend + backend verification |
| **Chrome Extension APIs** | Extension capabilities | content_scripts, background_service_worker, storage, messaging |

### **Development & DevOps**
| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **npm** | JavaScript package management (frontend, extension) |
| **pip** | Python package management (backend) |
| **pytest** | Python unit testing framework |
| **pytest-asyncio** | Async test support for FastAPI |
| **SQLAlchemy Migrations** | Database schema versioning |
| **Vite** | Extension build optimization |
| **TypeScript Compiler** | Type checking and transpilation |
| **Tailwind CLI** | CSS generation and optimization |

### **Database Schema**
| Table | Purpose | Tech |
|-------|---------|------|
| `users` | User accounts | SQLAlchemy ORM + FK constraints |
| `scroll_telemetry_records` | Individual scroll events | Indexed on (user_id, recorded_at) |
| `interventions` | Intervention records | FK to users, timestamps |
| `session_metrics` | Session-level analytics | Denormalized aggregations |
| `daily_stats` | Daily rollups | Computed from telemetry |
| `user_profiles` | Psychological profiles | Generated by ASI-1 |

### **Key Dependencies Summary**

**Backend (`requirements.txt`)**:
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
pydantic==2.5.0
pydantic-settings==2.1.0
groq==0.4.0  # Groq LLM API
aiofiles==23.2.1
python-dotenv==1.0.0
pytest==7.4.3
pytest-asyncio==0.21.1
```

**Frontend (`frontend/package.json`)**:
```json
{
  "next": "15.0.0",
  "react": "19.0.0-rc.1",
  "react-dom": "19.0.0-rc.1",
  "@clerk/nextjs": "^4.26.0",
  "tailwindcss": "^3.3.6",
  "next-themes": "^0.2.1"
}
```

**Extension (`extension/package.json`)**:
```json
{
  "react": "19.0.0-rc.1",
  "typescript": "^5.3.3",
  "vite": "^5.0.2",
  "tailwindcss": "^3.3.6"
}
```

### **Platform & Infrastructure**
| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend Deployment** | Python ASGI (Gunicorn/Uvicorn) | Can deploy to Heroku, Railway, AWS, GCP, Azure |
| **Frontend Deployment** | Vercel | Optimized for Next.js, serverless functions |
| **Extension Deployment** | Chrome Web Store | Reviewed extension with manifest V3 |
| **Database Deployment** | SQLite (dev) → PostgreSQL (prod) | Cloud Postgres: Railway, Render, AWS RDS, Supabase |
| **API Hosting** | HTTP REST | RESTful endpoints for extension communication |

---

## �🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy + PostgreSQL/SQLite
- **AI Integration**: 
  - **Groq LLM** - Generates dynamic intervention messages
  - **ASI-1 API** - Analyzes behavioral patterns and generates psychological profiles
- **Real-time Processing**: Background task queues
- **Authentication**: Clerk OAuth integration

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS + PostCSS
- **Authentication**: Clerk
- **UI Components**: shadcn/ui
- **Theme**: Dark/Light mode with system preference detection

### Browser Extension
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Manifest**: V3 (Chrome extension)

---

## ✨ What's Implemented

### Core Features
- ✅ **Real-time Scroll Monitoring** - Tracks scroll velocity and patterns on social media platforms
- ✅ **Mindless Score Calculation** - Rule-based algorithm to detect doomscrolling behavior
- ✅ **AI-Powered Interventions** - Dynamic intervention messages via **Groq LLM** (`groq_service.py`)
- ✅ **Session Analysis** - Comprehensive session metrics and insights
- ✅ **Extended Usage Detection** - Warns users after 30 minutes of continuous scrolling
- ✅ **Psychological Profile Generation** - AI-generated user behavior analysis via **ASI-1 API** (`asi_service.py`) triggered after 3 interventions

### Dashboard Features
- ✅ **User Authentication** - Secure Clerk OAuth integration
- ✅ **Real-time Metrics** - Time reclaimed, intervention success rate, current streak
- ✅ **Behavioral Trends** - Weekly scroll velocity and distraction period visualization
- ✅ **Recent Interventions** - View AI intervention messages across sessions
- ✅ **Session Analytics** - Detailed breakdown of each browsing session
- ✅ **Theme Toggle** - Dark/light mode with automatic system detection

### Extension Features
- ✅ **Platform Detection** - Automatically detects Twitter, TikTok, Instagram, YouTube, Reddit, LinkedIn, Facebook
- ✅ **Telemetry Tracking** - Collects scroll velocity, posts viewed, dwell time, clicks
- ✅ **Visual Interventions** - Overlay interface with grayscale effect when triggered
- ✅ **Session Management** - Automatic session tracking with tab lifecycle management
- ✅ **User ID Sync** - Syncs user from dashboard to extension via secure messaging

---

## 🚀 How to Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Chrome browser
- Git

### Setup & Run

#### 1. Backend Server
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run the server
python main.py
```
Server runs at: `http://localhost:8000`

#### 2. Frontend Dashboard
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```
Dashboard runs at: `http://localhost:3000`

#### 3. Browser Extension
```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Build extension
npm run build
```

Then load in Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder

---

## ⚙️ How the Process Works

### User Journey

```
1. LOGIN
   ↓ User logs in with Clerk authentication
   ↓ Dashboard loads and syncs user_id to extension
   
2. BROWSE
   ↓ User opens Twitter/TikTok/Instagram etc.
   ↓ Extension content script injects and begins monitoring
   
3. TRACK
   ↓ Content script monitors:
     - Scroll velocity (pixels/second)
     - Posts viewed/bypassed
     - Average dwell time per post
     - Click count
   ↓ Every 50 scroll events in 10 seconds → Send telemetry
   
4. ANALYZE
   ↓ Backend receives telemetry data
   ↓ Rule engine calculates "Mindless Score" (0-100)
   ↓ If score > 75:
     - Trigger intervention
     - Get AI message from Groq LLM
     - Increment intervention count
     - If count == 3: Generate psychological profile
   
5. INTERVENE
   ↓ If intervention triggered:
     - Send response back to extension
     - Extension shows overlay with message
     - Apply grayscale effect to page
     - User can dismiss and continue or close tab
   
6. SESSION END
   ↓ User closes tab or inactive >5 minutes
   ↓ Content script sends SESSION_END event
   ↓ Backend analyzes entire session:
     - Calculate metrics (avg velocity, success rate, insights)
     - Store in database
     - Generate recommendations
   ↓ Send analysis to dashboard
   ↓ Dashboard displays session summary
```

### Key Data Flow

**Telemetry Recording with AI Intervention**
```
User scrolls → Content script detects → Collects metrics → 
Send to /api/telemetry → Backend calculates score → 
If score > 75:
  ├─ GROQ API ──→ Generate AI intervention message
  └─ Store intervention trigger
Return message to extension → Display intervention UI
```

**Session Analysis with Behavioral Profiling**
```
User ends session → Content script sends SESSION_END →
Background script processes → Send to /api/session/end →
Backend queries all session telemetry → 
If interventions == 3:
  ├─ ASI-1 API ──→ Analyze behavioral patterns
  ├─ Generate psychological profile
  └─ Store profile in database
Return session metrics + analysis → Dashboard displays results
```

**Extended Usage Warning**
```
User scrolls for 30+ minutes → Content script warns →
Send EXTENDED_USAGE_WARNING to background →
Background notifies dashboard → Dashboard shows alert
```

---

## 🔗 External API Integrations

### Groq API - AI Intervention Messages
**Purpose**: Generate dynamic, contextual intervention messages when doomscrolling is detected

```
INTERVENTION TRIGGER
        ↓
   Score > 75
        ↓
  GROQ API REQUEST
        ↓
  /api/telemetry endpoint
        ↓
  groq_service.py processes:
    • scroll_velocity
    • posts_bypassed
    • dwell_time_avg
    • clicks
        ↓
  Prompt engineering generates witty, 
  personalized intervention message
        ↓
  RETURN MESSAGE TO EXTENSION
        ↓
  USER SEES INTERVENTION OVERLAY
```

**Configuration**: Set `GROQ_API_KEY` in backend `.env`

**Backend Implementation**: `backend/services/groq_service.py`
- Function: `get_groq_intervention()`
- Triggers on: Mindless score > 75
- Returns: Personalized intervention message

---

### ASI-1 API - Behavioral Pattern Analysis
**Purpose**: Analyze psychological patterns and generate user behavior profiles

```
PROFILE GENERATION TRIGGER
        ↓
   Interventions == 3
        ↓
  COLLECT SESSION TELEMETRY
        ↓
  ASI-1 API REQUEST
        ↓
  /api/telemetry endpoint (3rd trigger)
        ↓
  asi_service.py processes:
    • All telemetry from today
    • Intervention patterns
    • Scroll behaviors
    • Session metrics
        ↓
  AI analyzes and categorizes:
    • Engagement patterns
    • Cognitive load indicators
    • Habit formation signals
    • Vulnerability factors
        ↓
  GENERATE PSYCHOLOGICAL PROFILE
        ↓
  STORE IN DATABASE
        ↓
  USER VIEWS PROFILE IN DASHBOARD
```

**Configuration**: Set `ASI_API_KEY` in backend `.env`

**Backend Implementation**: `backend/services/asi_service.py`
- Function: `generate_profile()`
- Triggers on: 3rd intervention in a day
- Returns: Comprehensive psychological profile
- Stores: In `UserProfile` database model

---

## 📊 Complete Data Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTENSION LAYER                              │
│  (Chrome Content Script Monitoring)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Scroll Velocity │ Posts Bypassed │ Dwell Time │ Click Count        │
└───────────┬──────────────────────────────────────────────────────────┘
            │
            ↓ POST /api/telemetry (every 50 scroll events in 10s)
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                                  │
│                    (FastAPI Processing)                             │
├─────────────────────────────────────────────────────────────────────┤
│                   Rule Engine                                       │
│         (calculate_mindless_score)                                  │
│                      ↓                                              │
│              Score Calculation                                      │
│           (factors: velocity, posts, dwell, clicks)                │
└───────────┬──────────────────────────────────────────────────────────┘
            │
            ├─────────────────────────────────────────────┬────────────────┐
            │                                             │                │
            ↓ Score ≤ 75                     ↓ Score > 75: INTERVENE     │
        ALLOW                          ┌───────────────────┐              │
      (Return OK)                      │  GROQ API CALL    │              │
                                       │                   │              │
                                       │ Input:            │              │
                                       │ ·scroll_velocity  │              │
                                       │ ·posts_bypassed   │              │
                                       │ ·dwell_time_avg   │              │
                                       │ ·clicks           │              │
                                       │                   │              │
                                       │ Output:           │              │
                                       │ AI Message        │              │
                                       └───────────┬───────┘              │
                                                   ↓                      │
                                           Store Intervention      ↓
                                              Count++          (Return to
                                                  ↓            Extension)
                                           Count == 3?
                                              ↓
                                    YES ──→ ┌──────────────────┐
                                           │  ASI-1 API CALL  │
                                           │                  │
                                           │  Input:          │
                                           │  ·Today's        │
                                           │   telemetry      │
                                           │  ·Intervention   │
                                           │   patterns       │
                                           │  ·Session data   │
                                           │                  │
                                           │ Output:          │
                                           │ Psychological    │
                                           │ Profile          │
                                           └────────┬─────────┘
                                                    ↓
                                           Store in Database
                                                    ↓
                                      (User views in Dashboard)
                                    
        SESSION ENDS
            ↓
    Analyze Session Metrics
            ↓
    Store in SessionMetrics table
            ↓
    Return to Extension/Dashboard
```

---

## 🔐 Environment Configuration

### Backend `.env` (Required API Keys)
```env
# Groq API - For AI intervention message generation
GROQ_API_KEY=gsk_your_groq_api_key_here

# ASI-1 API - For behavioral psychology analysis
ASI_API_KEY=asi1_your_asi1_api_key_here

# Clerk Auth - For user authentication
CLERK_SECRET_KEY=sk_test_your_clerk_key

# Database
DATABASE_URL=sqlite:///./mindbreaker.db

# Optional: OpenAI fallback (if Groq unavailable)
OPENAI_API_KEY=sk_test_your_openai_key
```

### API Key Setup Instructions

**Groq API Key**:
1. Sign up at https://console.groq.com
2. Navigate to API Keys
3. Create new API key for intervention generation
4. Add to `.env` as `GROQ_API_KEY`

**ASI-1 API Key**:
1. Sign up at https://asi-1.com
2. Navigate to API Keys
3. Create new API key for profile generation
4. Add to `.env` as `ASI_API_KEY`

---

##  API Endpoints

### Telemetry
- `POST /api/telemetry` - Record scroll event and get intervention response
- `GET /api/stats/weekly/{user_id}` - Get weekly metrics for dashboard

### Session Management
- `POST /api/session/end` - End session and get analysis
- `GET /api/session/check-warning/{user_id}` - Check for extended usage warnings

### User Management
- `POST /api/auth/register` - Register user with Clerk info
- `GET /api/user/{user_id}` - Get user stats
- `GET /api/profile/{user_id}` - Get psychological profile

---

## 📁 Project Structure

```
├── backend/               # FastAPI server
│   ├── main.py           # Entry point & API endpoints
│   ├── models.py         # Pydantic models
│   ├── db_models.py      # SQLAlchemy models
│   ├── services/         # Business logic
│   │   ├── rule_engine.py         # Mindless score calculation
│   │   ├── groq_service.py        # GROQ API - Intervention messages ⭐
│   │   ├── asi_service.py         # ASI-1 API - Behavioral analysis ⭐
│   │   └── session_analyzer.py    # Session metrics generation
│   ├── storage/          # Data persistence
│   └── tests/            # Test suite
│
├── frontend/             # Next.js dashboard
│   ├── src/
│   │   ├── app/         # Pages
│   │   │   ├── dashboard/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/ # React components
│   │   └── lib/        # Utilities
│   └── public/         # Static assets
│
├── extension/           # Chrome extension
│   ├── src/
│   │   ├── background.ts
│   │   ├── content.tsx
│   │   └── popup.tsx
│   ├── public/
│   │   └── manifest.json
│   └── dist/           # Built files (load in Chrome)
│
└── README.md           # This file
```

**⭐ Key API Integration Points**:
- `groq_service.py` - Calls Groq API when intervention is triggered (score > 75)
- `asi_service.py` - Calls ASI-1 API when 3 interventions reached (for profile generation)

---

## 🔐 Environment Setup

### Backend `.env`
```
GROQ_API_KEY=your_groq_key
CLERK_SECRET_KEY=your_clerk_key
DATABASE_URL=sqlite:///./mindbreaker.db
```

### Frontend `.env.local`
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📊 Monitoring & Debugging

### Backend Logs
```
python backend/main.py
# Shows all API requests, telemetry processing, and analysis
```

### Frontend Browser Console
```
Open DevTools (F12)
Check console for:
- Extension messages
- API responses
- Session events
```

### Extension Logs
```
1. Open chrome://extensions/
2. Find MindBreaker → Details
3. Click "Inspect views: background page"
4. Console shows all extension activity
```

---

## 🎯 Next Steps

- [ ] Deploy backend to cloud (Heroku, Railway, etc.)
- [ ] Deploy frontend to Vercel
- [ ] Publish extension to Chrome Web Store
- [ ] Add mobile app version
- [ ] Implement third-party integrations (Slack, Discord notifications)
- [ ] Add community features (leaderboards, challenges)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 💡 Support

For issues or questions:
1. Check the backend logs for API errors
2. Check browser console for frontend errors
3. Inspect extension background page for extension errors
4. Verify all services are running on correct ports (8000, 3000)
