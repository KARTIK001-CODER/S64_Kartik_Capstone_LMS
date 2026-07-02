# Changelog

## [1.0.0] — 2026-07-02

### Added
- Authentication: email/password registration and login, JWT with refresh tokens.
- Google OAuth integration.
- Course management: full CRUD with chapters, lectures, and rich content.
- Course enrollment with Razorpay payment processing (dev mode available).
- Progress tracking: mark lectures completed, resume from last-watched.
- Educator dashboard with statistics, learner analytics, and reports.
- CSV and PDF report export.
- Course completion certificates as auto-generated PDFs.
- Notifications: enrollment, review, and course completion alerts.
- AI-powered course search autocomplete via Ollama / Llama (mock mode for dev).
- Role-based access control (student / educator).
- Rating and review system with educator replies.
- Swagger API documentation at `/api/docs`.
- Rate limiting (auth: 20/15min, general: 200/15min, LLM: 30/min).
- Security headers (helmet CSP + HSTS, hpp, mongo-sanitize).
- Request validation via express-validator on all routes.

### Infrastructure
- CI pipeline (GitHub Actions): backend tests on Node 18/20/22, frontend build.
- Structured JSON logging with pino and request correlation IDs.
- Health check endpoint at `/api/health`.
- Code coverage thresholds with Jest.

### Changed
- Standardized API response format: success returns data directly, errors use `{ success: false, message, errorCode }`.
- Consolidated duplicate login attempt logic into `utils/validation.js`.
- Enrollment routes simplified (removed `/student/` prefix).
- Error responses use consistent error codes across all endpoints.
- All controllers return data without `{ success: true }` wrapper.

### Security
- Password policy: minimum 8 characters, uppercase, lowercase, digit, special character.
- Account lockout after 5 failed login attempts (15-minute cooldown).
- Sensitive fields redacted from logs (passwords, tokens, secrets).
- `select: false` on User password field.
