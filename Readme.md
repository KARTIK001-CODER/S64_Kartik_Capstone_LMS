# LMS — Learning Management System

A full-stack MERN LMS with educator dashboards, student enrollments, Razorpay payments, and progress tracking.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Recharts, React YouTube
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Passport (Google OAuth)
- **Payments:** Razorpay
- **Media:** Cloudinary (with local dev-mode fallback)

## Setup

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Razorpay account (dev mode works without keys)
- Cloudinary account (optional — falls back to local storage)

### Environment

```bash
cd Backend
cp .env.example .env
# Edit .env with your values
```

Key variables:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Server port |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS origin |
| `RAZORPAY_KEY_ID` | No | — | Razorpay key (placeholder = dev mode) |
| `RAZORPAY_KEY_SECRET` | No | — | Razorpay secret (placeholder = dev mode) |
| `CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud name (placeholder = local storage) |
| `CLOUDINARY_API_KEY` | No | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | — | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |

### Install

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../client
npm install
```

### Run

```bash
# Terminal 1 — Backend
cd Backend
npm run server

# Terminal 2 — Frontend
cd client
npm run dev
```

Open http://localhost:5173

## API Docs

Once running, visit http://localhost:5000/api/docs for Swagger UI.

## Docker

```bash
# Build and start all services
docker compose up --build

# Backend: http://localhost:5000
# Frontend: http://localhost:80
# API Docs: http://localhost:5000/api/docs
# MongoDB:  localhost:27017
```

Environment variables are loaded from `Backend/.env`. Update the `MONGO_URI` to point to a local or Atlas cluster. The compose file includes a MongoDB container for local development.

## CI

GitHub Actions workflow in `.github/workflows/ci.yml`:
- **Backend:** `npm ci` → `npm test` (runs on push/PR to main)
- **Frontend:** `npm ci --legacy-peer-deps` → `npm run build`

## Architecture

```
Backend/
├── config/          # DB, Passport, Swagger, Cloudinary config
├── controllers/     # Thin request/response handlers
├── middleware/       # Auth, error handling, file upload
├── models/          # Mongoose schemas with indexes
├── routes/          # Express routers with Swagger JSDoc annotations
├── services/        # Business logic layer
├── uploads/         # Dev-mode local file storage
└── server.js        # Entry point

client/src/
├── components/      # Reusable UI components
├── context/         # React context (auth, courses, etc.)
├── pages/           # Page-level components (educator/, student/)
└── assets/          # Static assets
```
