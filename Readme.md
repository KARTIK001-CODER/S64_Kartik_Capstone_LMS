# LMS — Learning Management System

A full-stack Learning Management System with course creation, enrollment, payments, certificates, and AI-powered course search.

## Tech Stack

| Area      | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS, Lucide    |
| Backend   | Node.js, Express.js, Mongoose           |
| Database  | MongoDB (Atlas or local)                |
| Auth      | JWT, Google OAuth                       |
| Payments  | Razorpay (dev mode available)           |
| AI/LLM    | Ollama, Llama 3.2 (mock mode for dev)   |
| Media     | Cloudinary                              |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Docker (optional — for containerized deployment)

### Local Development

```bash
# Backend
cd Backend
cp .env.example .env
# Edit .env with your MongoDB connection string
npm install
npm run dev

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

Backend: `http://localhost:5000`  
Frontend: `http://localhost:5173`  
API Docs: `http://localhost:5000/api/docs`

### Docker (Production)

```bash
# Start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

- Frontend: `http://localhost:80`  
- Backend API: `http://localhost:5000`

### Docker (Development with hot-reload)

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

## Project Structure

```
├── Backend/
│   ├── config/          # MongoDB, Passport, Swagger config
│   ├── controllers/     # Route handlers (9 files, thin layer)
│   ├── middleware/       # Auth, validation, upload, error, request ID
│   ├── models/          # Mongoose schemas (7 models)
│   ├── routes/          # Express routers (11 files, OpenAPI annotated)
│   ├── services/        # Business logic (7 services)
│   ├── utils/           # AppError, logger, validation
│   └── Dockerfile       # Production container
├── client/
│   ├── src/
│   │   ├── components/  # Reusable UI (CourseCard, Avatar, etc.)
│   │   ├── context/     # AppContext (global state)
│   │   ├── pages/       # Lazy-loaded page components
│   │   └── assets/      # Static assets
│   ├── Dockerfile       # Multi-stage: build + nginx
│   └── nginx.conf       # Production reverse proxy
├── docker-compose.yml      # Production: backend + frontend + MongoDB
├── docker-compose.dev.yml  # Development: hot-reload volumes
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
└── .github/workflows/ci.yml
```

## API Endpoints

| Prefix              | Auth Required | Description                     |
|---------------------|---------------|---------------------------------|
| `/api/auth`         | No            | Register, login, refresh, OAuth |
| `/api/courses`      | Mixed         | Browse, CRUD, ratings           |
| `/api/enrollments`  | Yes           | Enroll, progress, last-watched  |
| `/api/payments`     | Yes           | Razorpay order + verify         |
| `/api/educator`     | Educator      | Dashboard, reports, learners    |
| `/api/student`      | Yes           | Dashboard, profile              |
| `/api/notifications`| Yes           | List, create, mark read         |
| `/api/certificates` | Yes           | Generate, download PDF          |
| `/api/reports`      | Educator      | Summary, CSV/PDF export         |
| `/api/llm`          | No            | AI autocomplete, health check   |
| `/api/health`       | No            | Server health status            |

Full documentation available at `/api/docs` with Swagger UI.

## Environment Variables

Key variables (see `Backend/.env.example` for all):

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (min 32 chars) |
| `RAZORPAY_KEY_ID` | Dev | Set to placeholder for dev mode (no real payment) |
| `MOCK_MODE` | No | `true` to use mock LLM responses |
| `NODE_ENV` | No | `development` or `production` |

## Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm start` | Production server |
| `npm run dev` | Dev server with nodemon |
| `npm test` | Run 64 tests across 7 suites |
| `npm run test:coverage` | Tests with coverage report |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Docker

### Services

| Service | Image | Port |
|---------|-------|------|
| `backend` | Node.js 22 Alpine | 5000 |
| `frontend` | Nginx (serves React build) | 80 |
| `mongo` | MongoDB 7 | 27017 |

The frontend Nginx proxies `/api/` and `/uploads/` requests to the backend.

### Production `docker-compose.yml`

```yaml
# Key overrides in compose:
# - MONGO_URI automatically set to mongodb://mongo:27017/lms
# - NODE_ENV=production
# - FRONTEND_URL=http://localhost:80
```

### Volumes

- `mongo-data` — persists database across restarts
- `uploads` — persists course thumbnails and avatars

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

- Backend: tests on Node 18, 20, 22
- Frontend: production build verification

## Testing

```bash
cd Backend
npm test           # 64 tests
npm run test:coverage  # With coverage thresholds
```

## Features

- Authentication: email/password + Google OAuth, JWT with refresh tokens
- Course management: full CRUD with chapters/lectures
- Enrollment: Razorpay payments, progress tracking, completion
- Educator dashboard: stats, learner analytics, CSV/PDF reports
- Certificates: auto-generated PDFs on course completion
- Notifications: enrollment, review, and completion alerts
- AI search: autocomplete via Ollama or mock mode
- Security: rate limiting, helmet CSP, input validation, account lockout
- Observability: structured JSON logging, request IDs, health check
