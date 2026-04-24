# Personalized Smart Learning Platform - Phase 1This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



A full-stack intelligent learning platform built with Next.js 15, Drizzle ORM, PostgreSQL, Redis, and Biome.js.## Getting Started



## 🚀 Features

### Core Features (Phase 1)

- **User Session Management**: Redis-based session storage with cookie authentication
- **Database Models**: PostgreSQL with Drizzle ORM (users, content, progress tables)
- **Smart Caching**: Redis caching for recommendations and sessions
- **Course Recommendations**: Placeholder recommendation system (ready for ML integration in Phase 2)
- **Progress Tracking**: Track user learning progress and scores
- **Modern Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS
- **Code Quality**: Biome.js for linting and formatting
- **Docker Ready**: Complete containerized setup with docker-compose

### 🤖 AI Tutor Chat (NEW!)

- **Ollama Integration**: Chat with AI models locally (Llama 3.2, Mistral, Phi, etc.)
- **Educational Focus**: Domain-aware system prompt designed for learning assistance
- **Real-time Streaming**: Responses stream token-by-token for better UX
- **Configurable Endpoint**: Set custom Ollama API endpoint with persistence
- **Clean UI**: Modern chat interface with message bubbles, typing indicators
- **Conversation Management**: Clear history, auto-scroll, keyboard shortcuts
- **Mobile Friendly**: Responsive design works on all devices

📖 **[AI Tutor Documentation](./AI_TUTOR_CHAT.md)** | 🚀 **[Quick Start Guide](./CHAT_QUICKSTART.md)**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev

```

## 📁 Project Structure

```
personalized-platform/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # User authentication
│   │   │   ├── logout/route.ts     # Session destruction
│   │   │   └── session/route.ts    # Session validation
│   │   ├── recommend/route.ts      # Course recommendations
│   │   └── progress/route.ts       # Progress tracking
│   ├── chat/                       # 🤖 AI Tutor Chat (NEW!)
│   │   ├── page.tsx                # Chat page with settings
│   │   ├── components/
│   │   │   ├── ChatBox.tsx         # Chat interface
│   │   │   └── MessageBubble.tsx   # Message display
│   │   └── hooks/
│   │       └── useOllamaChat.ts    # Ollama API integration
│   ├── dashboard/page.tsx          # Main dashboard UI
│   └── page.tsx                    # Landing page

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

```

personalized-platform/You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

├── app/

│   ├── api/This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

│   │   ├── auth/

│   │   │   ├── login/route.ts      # User authentication## Learn More

│   │   │   ├── logout/route.ts     # Session destruction

│   │   │   └── session/route.ts    # Session validationTo learn more about Next.js, take a look at the following resources:

│   │   ├── recommend/route.ts      # Course recommendations

│   │   └── progress/route.ts       # Progress tracking- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

│   ├── dashboard/page.tsx          # Main dashboard UI- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

│   └── page.tsx                    # Landing page

├── src/You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

│   ├── db/

│   │   ├── index.ts                # Database connection## Deploy on Vercel

│   │   └── schema.ts               # Drizzle schema definitions

│   └── lib/The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

│       ├── redis.ts                # Redis client & helpers

│       └── session.ts              # Session managementCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

├── scripts/
│   ├── migrate.ts                  # Database migration script
│   └── seed.ts                     # Database seeding script
├── docker-compose.yml              # Multi-container setup
├── Dockerfile                      # App container image
├── drizzle.config.ts              # Drizzle ORM configuration
├── biome.json                      # Biome linting/formatting config
├── .env.example                    # Environment variables template
└── package.json                    # Dependencies & scripts
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: PostgreSQL 16 (Alpine)
- **ORM**: Drizzle ORM
- **Cache**: Redis 7 (Alpine)
- **Styling**: Tailwind CSS
- **Code Quality**: Biome.js
- **Runtime**: Node.js 20 (Alpine)
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 16+ (if running locally without Docker)
- Redis 7+ (if running locally without Docker)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**:
   ```bash
   cd personalized-platform
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

5. **Login with demo account**:
   - Username: `demo`
   - Password: `password123`

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your local PostgreSQL and Redis URLs:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lernova
   REDIS_URL=redis://localhost:6379
   ```

3. **Start PostgreSQL and Redis** (if not using Docker):
   ```bash
   # Using Docker for just DB and Redis
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lernova postgres:16-alpine
   docker run -d -p 6379:6379 redis:7-alpine
   ```

4. **Generate and run migrations**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Seed the database**:
   ```bash
   npm run db:seed
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

7. **Visit**: http://localhost:3000

8. **Login with demo account**:
   - Username: `demo`
   - Password: `password123`

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build production application |
| `npm start` | Start production server |
| `npm run lint` | Run Biome linter with auto-fix |
| `npm run format` | Format code with Biome |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations programmatically |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |
| `npm run db:seed` | Seed database with sample data |

## 🗄️ Database Schema

### Users Table
- `id`: Primary key
- `name`: User's display name
- `email`: Unique email address
- `knowledgeVec`: JSON array representing knowledge vector (for future ML)
- `createdAt`, `updatedAt`: Timestamps

### Content Table (Courses)
- `id`: Primary key
- `title`: Course title
- `topic`: Course category
- `difficulty`: beginner | intermediate | advanced
- `keywords`: JSON array of keywords
- `description`: Course description
- `createdAt`, `updatedAt`: Timestamps

### Progress Table
- `id`: Primary key
- `userId`: Foreign key to users
- `contentId`: Foreign key to content
- `score`: Learning score (0-100)
- `timeSpent`: Time in minutes
- `completed`: Boolean flag (0 or 1)
- `createdAt`, `updatedAt`: Timestamps

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Create user session
  ```json
  { "email": "user@example.com", "name": "User Name" }
  ```

- `POST /api/auth/logout` - Destroy session

- `GET /api/auth/session` - Check current session

### Recommendations
- `GET /api/recommend?userId={id}` - Get course recommendations
  - Returns cached results if available (1 hour TTL)
  - Falls back to database query

- `POST /api/recommend` - ML recommendations (placeholder for Phase 2)

### Progress
- `GET /api/progress?userId={id}` - Get user progress

- `POST /api/progress` - Update progress
  ```json
  {
    "userId": 1,
    "contentId": 5,
    "score": 85,
    "timeSpent": 45,
    "completed": 1
  }
  ```

## 🎨 UI Pages

### Landing Page (`/`)
Beautiful gradient hero with feature highlights and CTA to dashboard.

### Authentication Page (`/auth`)
Login and registration interface for user authentication.

### Dashboard (`/dashboard`)
- Displays personalized course recommendations
- Shows course cards with:
  - Title, topic, difficulty badge
  - Description and keywords
  - "Start Learning" button (updates progress)
- Navigation to AI Tutor Chat
- Logout functionality

### AI Tutor Chat (`/chat`) 🤖 NEW!
- **Interactive AI chat interface** powered by Ollama
- **Educational assistant** for learning support
- **Features:**
  - Real-time streaming responses
  - Configurable Ollama endpoint
  - Conversation history with clear option
  - Example prompts to get started
  - Mobile-responsive design
  - Dark mode support

**Setup AI Tutor:**
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3.2`
3. Open `/chat` and start learning!

📖 See [AI Tutor Documentation](./AI_TUTOR_CHAT.md) for detailed setup and usage.
- Shows cache source indicator (cache vs database)

## 🔄 Redis Caching Strategy

### Session Storage
- **Key**: `session:{sessionId}`
- **TTL**: 24 hours (configurable via `SESSION_DURATION`)
- **Data**: userId, email, name, createdAt

### Recommendation Cache
- **Key**: `recommend:{userId}`
- **TTL**: 1 hour (3600 seconds)
- **Data**: Array of course recommendations
- **Invalidation**: Automatically cleared when progress is updated

## 🐳 Docker Services

The `docker-compose.yml` defines three services:

1. **app** (Next.js Application)
   - Port: 3000
   - Multi-stage build with node:20-alpine
   - Depends on `db` and `cache`

2. **db** (PostgreSQL 16)
   - Port: 5432
   - Volume: `pg_data`
   - Health check enabled

3. **cache** (Redis 7)
   - Port: 6379
   - Volume: `redis_data`
   - Persistence: AOF enabled

All services communicate via `lernova-network` bridge network.

## 🔮 Phase 2 Preparation

The architecture is ready for ML integration:

### Planned Enhancements
1. **FastAPI ML Service**
   - Deep learning recommendation model
   - User knowledge vector analysis
   - Content similarity matching

2. **Enhanced Recommendations**
   - Replace placeholder logic in `/api/recommend`
   - Add endpoint to call ML service
   - Implement collaborative filtering

3. **Advanced Features**
   - Real-time progress analytics
   - Adaptive difficulty adjustment
   - Learning path optimization

### Integration Points
- `POST /api/recommend` endpoint ready for ML service calls
- Knowledge vectors stored in database
- Redis caching supports complex recommendation objects

## 🧹 Code Quality

This project uses **Biome.js** for:
- Fast linting (10-20x faster than ESLint)
- Automatic code formatting
- Import organization
- TypeScript-aware rules

Run checks:
```bash
npm run lint    # Check and auto-fix issues
npm run format  # Format all files
```

## 🔒 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Redis
REDIS_URL=redis://host:port

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session
SESSION_SECRET=your-secret-key-change-in-production
SESSION_DURATION=86400
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs lernova-db
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it lernova-redis redis-cli ping
```

### Migration Issues
```bash
# Reset database (⚠️ destroys all data)
docker compose down -v
docker compose up -d db cache
npm run db:push
npm run db:seed
```

## 📊 Database Management

### Drizzle Studio
Launch the visual database browser:
```bash
npm run db:studio
```
Visit: https://local.drizzle.studio

### Manual Queries
```bash
# Connect to PostgreSQL
docker exec -it lernova-db psql -U postgres -d lernova

# Connect to Redis
docker exec -it lernova-redis redis-cli
```

## 🎯 Success Criteria ✅

- [x] Docker Compose launches all 3 containers successfully
- [x] Dashboard displays course recommendations
- [x] Redis caches recommendation responses
- [x] Biome detects and auto-fixes linting issues
- [x] Drizzle connects to PostgreSQL successfully
- [x] Session management works with cookies
- [x] Progress tracking updates database and invalidates cache

## 📚 Additional Resources

### Project Documentation
- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** - Complete authentication system documentation
- **[TEST_AUTH.md](./TEST_AUTH.md)** - Quick start guide for testing authentication
- **[RECOMMENDATION_SYSTEM.md](./RECOMMENDATION_SYSTEM.md)** - How the recommendation engine works
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Visual step-by-step system flow
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design
- **[AUTH_COMPLETE.md](./AUTH_COMPLETE.md)** - Authentication implementation summary

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Biome.js](https://biomejs.dev)
- [Redis Commands](https://redis.io/commands)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📄 License

MIT

## 👥 Contributing

This is Phase 1 of the Personalized Smart Learning Platform. Contributions welcome!

---

**Built with ❤️ using Next.js, Drizzle, PostgreSQL, Redis, and Biome.js**
