# Contributing

Thank you for considering contributing to this project.

## Development Setup

1. Fork and clone the repository.
2. Run `npm install` in both `Backend/` and `client/`.
3. Copy `Backend/.env.example` to `Backend/.env` and fill in the required values.
4. Start the backend: `cd Backend && npm run dev`.
5. Start the frontend: `cd client && npm run dev`.

## Code Style

- Backend: ES modules, async/await, consistent error codes via `AppError`.
- Frontend: React functional components with hooks, Tailwind CSS classes.
- No semicolons in frontend code (project convention).

## Pull Request Process

1. Create a feature branch from `main`.
2. Write or update tests for any new functionality.
3. Ensure all existing tests pass: `cd Backend && npm test`.
4. Ensure the frontend builds: `cd client && npm run build`.
5. Keep PRs focused on a single concern — avoid bundled changes.

## Commit Messages

Use conventional commits format:

```
type(scope): description

feat(courses): add bulk archive action
fix(auth): handle token expiry correctly
docs(readme): add deployment section
test(payment): cover signature verification
```

## Testing

- Backend tests use Jest with `jest.unstable_mockModule` for ESM compatibility.
- Run with `cd Backend && npm test`.
- Coverage: `cd Backend && npm run test:coverage`.
