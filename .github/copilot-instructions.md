# Copilot Instructions for task_manager_api

This file gives focused guidance for AI coding agents working on this repo.

# Copilot Instructions for task_manager_api

This file gives focused guidance for AI coding agents working on this repo.

Summary

- Type: Express + TypeScript (ESM) REST API. Entry points: `src/app.ts` and `src/server.ts`.
- Versioned API mounted at `/api/v${API_VERSION}` via `src/api/v1.0/index.ts`.
- Uses Mongoose for persistence (`src/models/*.ts`) with `toJSON` transforming `_id -> id`.

Required environment variables

- `PORT`, `MONGO_URI`, `JWT_SECRET`, `API_VERSION` are required at runtime (see `src/utils/getEnv.ts`).
- For many unit tests you can set `AUTH_SKIP_DB=true` and provide a `.env.test` (tests load it from `tests/utils/unitTestSetup.ts`).

Key patterns & examples

- Route organization: each resource folder under `src/api/v1.0/<resource>/` exposes handlers in an `index.ts` and a `routes.ts` file. Example: [src/api/v1.0/task/index.ts](src/api/v1.0/task/index.ts) and [src/api/v1.0/task/routes.ts](src/api/v1.0/task/routes.ts).

- Handler pattern: each handler is a named export from the resource `index.ts` (e.g. `getAllTasks`, `createTask`) and route files import them together with `asyncHandler` from `src/utils/asyncHandler.ts`. Keep exports in `index.ts` synchronized with `routes.ts` imports.

- Route examples:
    - `GET /api/v${API_VERSION}/task` -> `src/api/v1.0/task/getAllTasks.ts`
    - `GET /api/v${API_VERSION}/task/:id` -> `src/api/v1.0/task/getTask.ts` (uses `validateTaskId`)
    - `POST /api/v${API_VERSION}/task` -> `src/api/v1.0/task/createTask.ts` (uses `validateCreateTask`)

- Validation: validators live in `src/middleware/validators/*` and are applied in `routes.ts` before handler calls (see `validateCreateTask.ts`, `validateUpdateTask.ts`, `validateTaskId.ts`).

- Auth: `src/middleware/auth.ts` defines `authenticateJWT` and `requireUser`. Tests use `AUTH_SKIP_DB=true` to short-circuit DB `User.findById` and use token payload directly — preserve that flag in unit tests that don't require real DB lookups.

- DB connect: `src/config/database.ts` uses `MONGO_URI` read via `src/utils/getEnv.ts`. `getEnv` will throw if required vars are missing, so tests and local dev must provide `.env` or `.env.test` when running.

Routes: a short JSDoc example

```ts
/**
 * @swagger
 * /api/task:
 *   post:
 *     summary: Create a new task
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 */
app.post('/api/task', validateCreateTask, asyncHandler(createTask));
```

Testing & local dev

- Scripts: `npm run dev` (nodemon), `npm run build` (tsc), `npm test` (vitest run). See `package.json`.

- Test types & locations:
    - Unit tests: `tests/v1.0/.../*.test.ts` — fast, often stub envs and `AUTH_SKIP_DB=true`.
    - Integration tests: `tests/v1.0/.../*.integration.test.ts` — expect DB behavior and use `mongodb-memory-server`.
    - Test helpers: `tests/utils/mongoMemoryServer.ts` (in-memory DB connect/disconnect) and `tests/utils/unitTestSetup.ts` (common mocks and `dotenv.config({ path: '.env.test' })`).

- Running tests locally:

```bash
# Run all tests
npm test

# Run a single test file
npx vitest tests/v1.0/task/createTask.test.ts
```

- Common test patterns:
    - Use `vi.stubEnv('VAR', 'value')` in tests to override env vars.
    - Use `AUTH_SKIP_DB=true` for auth unit tests (see `tests/middleware/auth.test.ts`).
    - Mock `console.error` or spies in tests to avoid noisy logs (`vi.fn()`).

Example Vitest unit test template

```ts
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Task routes', () => {
	it('returns 200 for GET /api/task', async () => {
		const res = await request(app).get('/api/v1.0/task');
		expect(res.status).toBe(200);
	});
});
```

Integration test template (in-memory DB)

```ts
import request from 'supertest';
import app from '../../src/app';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../tests/utils/mongoMemoryServer';

beforeAll(async () => await connectInMemoryDB());
afterAll(async () => await disconnectInMemoryDB());

test('POST /api/v1.0/task creates a task', async () => {
	const res = await request(app).post('/api/v1.0/task').send({
		/* payload */
	});
	expect(res.status).toBe(201);
});
```

Auth unit test snippet (pattern)

```ts
// tests/middleware/auth.test.ts
import { authenticateJWT } from '../../src/middleware/auth';
import { res, next } from '../utils/unitTestSetup';
import jwt from 'jsonwebtoken';

vi.stubEnv('JWT_SECRET', 'testSecret');
vi.stubEnv('AUTH_SKIP_DB', 'true');

// Create token and call middleware, assert `req.user` and `next()` called
```

README / run snippets

```bash
# Start dev server (nodemon)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test
```

Swagger & docs

- Location: Swagger config lives in `src/config/swagger/index.ts` and per-version config in `src/config/swagger/v1.0/index.ts`.

- How it works:
    - `setupSwagger(app, API_VERSION)` builds Swagger specs from JSDoc comments found via the `apis` glob `./src/api/**/*.ts`.
    - Versioned docs are mounted at `/api-docs/v<version>` and the latest version at `/api-docs`.

- To update docs:
    - Edit the JSDoc blocks in the route files (example in `src/api/v1.0/task/routes.ts`). Keep `@swagger` blocks in routes so `swagger-jsdoc` picks them up.
    - If you add a new API version, add a new config in `src/config/swagger/` and update `src/config/swagger/index.ts` mapping.

- Note: JSDoc references to schemas (e.g. `#/components/schemas/Task`) rely on consistent request/response shapes; changing model output (for example the `toJSON` transform) should be reflected in the docs.

Conventions & gotchas (be precise)

- Imports include explicit `.ts` file extension (ESM). Preserve this style when adding imports.
- Environment access uses `src/utils/getEnv.ts`; avoid reading `process.env` directly for required vars unless intentionally bypassing the check.
- Mongoose models include `toJSON` transforms — when returning records, code expects `id` instead of `_id`.
- Passwords are hashed in `User` pre-save hook. Use `User.comparePassword` in auth flows where needed.
- Rate limiting is applied per-route via `createRateLimiter` from `src/middleware/rateLimiter.ts` — be consistent with how routers apply limiters.

When changing APIs

- Keep route paths and Swagger JSDoc in sync. Add/modify handler exports in the folder `index.ts` so `routes.ts` imports remain consistent.
- If adding env variables, add them to `.env.example` (if present) and update `src/utils/getEnv.ts` usages.

Docs & versioning maintenance

- When bumping API version: add a new swagger config under `src/config/swagger/`, update the `swaggerVersions` mapping in `src/config/swagger/index.ts`, and mount the new router in `src/api` if needed.

PR & testing guidance for agents

- Run `npm test` to execute unit & integration tests (Vitest). Integration tests expect a running in-memory DB (handled by tests). Use `npm run dev` for local manual testing.
- For auth-related unit tests, set `AUTH_SKIP_DB=true` in the test environment or stub via `vi.stubEnv`.

If anything is unclear here, ask for the specific area you want more examples for (routes, models, tests, or swagger).

Developer workflow (checks, commits, PRs, CI)

- **Install & hooks:** Run `npm install` to install dependencies and set up Husky hooks via the existing `prepare` script. If hooks ever need reinstalling, run `npx husky install`.
- **Format & lint:** Use `npm run format` to auto-fix style. Use `npm run format:check` and `npm run lint` to verify style and lint rules.
- **CI-like precheck:** Run `npm run check` locally to run the same checks the CI workflow runs (format check, ESLint for `src` and `tests`, and `vitest run`).
- **Commit / pre-commit:** The repo uses Husky + `lint-staged`. Commits will run linters/formatters automatically. If you need to bypass hooks (not recommended), use `git commit --no-verify`.
- **Conventional commits / commitlint:** A `commitlint.config.cjs` is present; follow conventional commit messages (e.g. `chore(repo): ...`, `feat(api): ...`).
- **Open a PR:** Push your branch and open a PR from your branch into `main`. Quick browser compare URL pattern:
    - https://github.com/JSantucci/task_manager_api/compare/main...<your-branch>?expand=1
      Or use the GitHub CLI: `gh pr create --base main --head <your-branch>` (requires `gh auth login`).
- **CI:** The CI workflow `.github/workflows/ci.yml` runs Prettier check, ESLint, and Vitest. Consider updating the workflow to run `npm run build` before tests if you want to validate compiled output as part of CI.

If you add new environment variables, update `.env.example` and `src/utils/getEnv.ts` so CI and contributors know about them.
