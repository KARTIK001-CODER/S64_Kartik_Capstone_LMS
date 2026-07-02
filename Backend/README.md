# LMS Backend

Express.js REST API for the Learning Management System.

## Structure

```
Backend/
├── config/          # MongoDB, Passport, Swagger configuration
├── controllers/     # HTTP request handlers (thin layer)
├── middleware/      # Auth, validation, upload, error handling, request ID
├── models/          # Mongoose schemas with indexes (7 models)
├── routes/          # Express routers with OpenAPI annotations (11 files)
├── services/        # Business logic (7 services)
└── utils/           # AppError, logger, validation utilities
```

## Key Architecture Decisions

- **Controllers are thin** — they parse the request and delegate to services.
- **Services contain all business logic** — independently testable with mocked models.
- **All async handlers use `express-async-handler`** — errors propagate to centralized `errorHandler`.
- **Error responses** use `{ success: false, message, errorCode }`.
- **Success responses** return data directly (no wrapper) for frontend compatibility.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | — | Refresh JWT |
| GET | `/api/auth/google` | — | Google OAuth |
| GET | `/api/courses` | — | List published courses |
| GET | `/api/courses/:id` | — | Get course details |
| POST | `/api/courses` | Educator | Create course |
| PUT | `/api/courses/:id` | Educator | Update course |
| DELETE | `/api/courses/:id` | Educator | Delete course |
| PUT | `/api/courses/:id/rating` | Student | Add rating |
| DELETE | `/api/courses/:id/rating` | Student | Delete rating |
| GET | `/api/enrollments` | User | Get enrolled courses |
| POST | `/api/enrollments/enroll/:courseId` | User | Enroll in course |
| GET | `/api/enrollments/:courseId/progress` | User | Get progress |
| PUT | `/api/enrollments/:courseId/progress` | User | Update progress |
| POST | `/api/payments/create-order` | User | Create payment order |
| POST | `/api/payments/verify` | User | Verify payment |
| GET | `/api/educator/dashboard/stats` | Educator | Dashboard stats |
| GET | `/api/educator/learners` | Educator | Learner list |
| GET | `/api/educator/reports` | Educator | Report data |
| GET | `/api/notifications` | User | Get notifications |
| POST | `/api/certificates/generate/:courseId` | User | Generate certificate |
| GET | `/api/certificates/download/:id` | User | Download PDF |
| GET | `/api/llm/complete` | — | AI autocomplete |
| GET | `/api/health` | — | Health check |

## Environment Variables

See `.env.example` for all required variables.

Key variables:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) |
| `RAZORPAY_KEY_ID` | Razorpay API key (set to placeholder for dev mode) |
| `MOCK_MODE` | Set `true` to use mock LLM responses |
| `NODE_ENV` | `development` or `production` |

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with nodemon |
| `npm test` | Run tests (64 tests, 7 suites) |
| `npm run test:coverage` | Run tests with coverage report |

## Testing

- Tests use Jest with `jest.unstable_mockModule` for ESM mocking.
- No database required — all models are mocked.
- Coverage is collected for controllers, models, middleware, services, and utils.
