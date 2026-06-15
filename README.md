# Lernova: Personalized Smart Learning Platform - Phase 1

A full-stack intelligent learning platform built with Next.js 15, Drizzle ORM, PostgreSQL, Redis, and Biome.js. 

Lernova adapts to your skill level, tests your knowledge in real-time using local AI, and recommends the perfect courses to accelerate your growth.

---

## 🚀 Features

### Core Platform Capabilities
- **User Session Management**: Redis-based session storage with secure cookie authentication.
- **Smart Recommendations Engine**: Suggests courses based on user learning goals, past progress, and knowledge gaps (backed by Redis caching).
- **Goal-Based Enrollments**: 
  - Manage up to **2 active courses** simultaneously to maintain focus.
  - Features dynamic study plans with both AI-generated and user-customizable to-do tasks.
  - Enforces a **75% mastery gate** (quiz score) to complete a course and free up an enrollment slot.
- **Visual Progress & Analytics**: 
  - **Radar Charts**: Maps your continuous knowledge vectors across core disciplines (Programming, Web Dev, CS Theory, AI & ML, DevOps).
  - **Bar Charts**: Tracks your recent course and quiz scores.
- **Modern Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS, Recharts.
- **Code Quality**: Biome.js for blazing fast linting and formatting.
- **Docker Ready**: Complete containerized setup with docker-compose.

### 🤖 AI-Powered Intelligence (NEW!)

- **Real-Time Knowledge Checks**:
  - Automatically targets your highest-priority topics based on your recommendation profile.
  - Generates unique multiple-choice and written questions on the fly.
  - Difficulty dynamically adjusts (beginner, intermediate, advanced) based on your historical scores.
- **Interactive AI Tutor Chat**: 
  - Local model integration via Ollama (Llama 3.2, Mistral, Phi, etc.) or Groq API.
  - System prompt strictly tuned for educational guidance and Socratic questioning.
  - Real-time streaming token-by-token for an optimal UX.
  - Context-aware: understands the user's specific knowledge vectors to personalize explanations.
- **Smart Topic Extraction**: AI analyzes free-form user learning goals during onboarding to extract and map them to standard platform course topics.

📖 **[AI Tutor Documentation](./AI_TUTOR_CHAT.md)** | 🚀 **[Quick Start Guide](./CHAT_QUICKSTART.md)**

---

## 📁 Project Structure

```
personalized-platform/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, logout, session validation
│   │   ├── recommend/      # Course recommendations & goal extraction
│   │   ├── progress/       # Progress tracking & knowledge vector updates
│   │   ├── enrollments/    # Active course slots & study to-dos
│   │   └── generate-quiz/  # AI quiz generation endpoint
│   ├── chat/               # Interactive AI Tutor UI
│   ├── dashboard/          # Main dashboard UI (Charts, Active Courses, Recommendations)
│   ├── onboarding/         # Initial goal-setting flow
│   └── page.tsx            # Landing page
├── src/
│   ├── db/
│   │   ├── index.ts        # Database connection
│   │   └── schema.ts       # Drizzle schema (users, content, progress, enrollments)
│   └── lib/                # Redis client, session helpers, AI provider utilities
├── scripts/                # DB migrations, seeding, PPT generators
├── docker-compose.yml      # Multi-container setup
├── Dockerfile              # App container image
└── package.json            # Dependencies & scripts
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: PostgreSQL 16 (Alpine)
- **ORM**: Drizzle ORM
- **Cache**: Redis 7 (Alpine)
- **Styling**: Tailwind CSS
- **Code Quality**: Biome.js
- **Runtime**: Node.js 20 (Alpine)
- **Containerization**: Docker & Docker Compose

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**:
   ```bash
   cp .env.example .env
   ```

2. **Start all services**:
   ```bash
   docker compose up --build
   ```

3. **In a new terminal, run migrations and seed**:
   ```bash
   docker compose exec app npm run db:generate
   docker compose exec app npm run db:push
   docker compose exec app npm run db:seed
   ```

4. **Visit**: http://localhost:3000
5. **Login with demo account**: Username: `demo` | Password: `password123`

### Option 2: Local Development

1. **Install dependencies**: `npm install`
2. **Setup environment**: `cp .env.example .env` (Update with your local PostgreSQL/Redis URLs)
3. **Start PostgreSQL and Redis** (if not using Docker).
4. **Generate and run migrations**: `npm run db:generate && npm run db:push`
5. **Seed the database**: `npm run db:seed`
6. **Start development server**: `npm run dev`
7. **Visit**: http://localhost:3000

---

## 🗄️ Database Schema Highlights

- **Users Table**: Tracks credentials, active learning `goal`, and `knowledgeVec` (array representing skill dimensions).
- **Content Table**: Courses categorized by topic, difficulty, and keywords.
- **Progress Table**: Tracks completed learning scores and time spent.
- **Enrollments Table**: Limits users to 2 active courses. Tracks current course status and final `quizScore`.
- **Enrollment Todos Table**: Actionable study plans per enrollment. Tracks completion of `isCustom` (user-added) and AI-generated tasks.

---

## 🔌 API Endpoints Summary

### Authentication & Users
- `POST /api/auth/login` - Create user session
- `POST /api/user/goal` - Set/update user learning goal

### Learning & Progress
- `GET /api/recommend` - Get goal-aligned course recommendations (cached in Redis)
- `GET /api/enrollments` - Fetch active courses and their study to-dos
- `POST /api/enrollments/todos` - Add custom study tasks
- `POST /api/generate-quiz` - Generate adaptive AI quizzes based on topics/todos
- `POST /api/progress` - Update progress, triggering automatic recalculation of the user's `knowledgeVec`

---

## 🔄 Redis Caching Strategy

- **Session Storage**: `session:{sessionId}` (24 hours TTL).
- **Recommendation Cache**: `recommend:{userId}` (10 minutes TTL). Automatically cleared when goals or enrollments change.

---

## 🔮 Phase 2 Preparation

The architecture is explicitly designed for seamless ML integration in Phase 2:
1. **FastAPI ML Service**: To replace the heuristic recommendation engine with deep collaborative filtering.
2. **Advanced Analytics**: Continuous, real-time recalculation of knowledge vectors using simulated hydrological-style mechanics.
3. **Adaptive Difficulty**: AI adjustments that respond instantaneously to quiz performance without page reloads.

---

## 🎯 Success Criteria ✅

- [x] Docker Compose launches all containers successfully
- [x] Dashboard displays dynamically adjusting course recommendations
- [x] Redis caches recommendation responses and sessions
- [x] Biome detects and auto-fixes linting issues
- [x] Enrollment system restricts to 2 slots & enforces 75% quiz gates
- [x] Real-time AI quizzes generated seamlessly on the client

**Built with ❤️ using Next.js, Drizzle, PostgreSQL, Redis, and Biome.js**
