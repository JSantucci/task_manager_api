# Task Manager API

[![CI](https://github.com/JSantucci/task_manager_api/actions/workflows/ci.yml/badge.svg)](https://github.com/JSantucci/task_manager_api/actions/workflows/ci.yml) [![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)

Lightweight REST API for managing tasks (Express + TypeScript + Mongoose). This repository is a portfolio-quality project demonstrating a versioned API design, JWT auth, validation, unit and integration tests, and generated Swagger docs.

![Typescript](https://img.shields.io/badge/-TypeScript-333333?style=flat&logo=typescript)
![Node.js](https://img.shields.io/badge/-Node.js-333333?style=flat&logo=nodedotjs)
![Express](https://img.shields.io/badge/-Express.js-333333?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/-MongoDB-333333?style=flat&logo=mongodb)
![Swagger](https://img.shields.io/badge/-Swagger-333333?style=flat&logo=swagger)
![VItest](https://img.shields.io/badge/-Vitest-333333?style=flat&logo=vitest)

**Table of contents**

- [Quick Start](#quick-start)
- [Core features](#core-features)
- [API overview](#api-overview)
- [Development](#development)
- [Docker](#docker)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

**Core features**

- Versioned API mounted at `/api/v${API_VERSION}`
- JWT authentication and `requireUser` middleware
- Per-route validation using `express-validator`
- Mongoose models with `toJSON` transforms (returns `id` instead of `_id`)
- Swagger docs generated from JSDoc route comments
- Unit and integration tests using Vitest and `mongodb-memory-server`

**Quick links**

- App entry: `src/app.ts`
- Server + DB connect: `src/server.ts`, `src/config/database.ts`
- API: `src/api/v1.0/`
- Models: `src/models/`
- Middleware: `src/middleware/`
- Validators: `src/middleware/validators/`
- Tests: `tests/`

**Requirements**

- Node.js 24+ (recommended)
- npm

Required environment variables
Create a `.env` for local development or `.env.test` for tests. The app will throw if the required variables are missing (see `src/utils/getEnv.ts`).

- `PORT` — HTTP port (e.g. `3000`)
- `MONGO_URI` — MongoDB connection string (for local dev or CI)
- `JWT_SECRET` — secret used to sign JWTs
- `API_VERSION` — API major version (e.g. `1.0`)

Optional environment variable:

- `CORS_ORIGIN` — allowed frontend origin for credentialed CORS requests (default `http://localhost:5173`)

Tip for tests: Put test-specific values in `.env.test`. Unit tests sometimes set `AUTH_SKIP_DB=true` to avoid DB lookups in the auth middleware.

**Quick Start**

Install dependencies and run locally:

```bash
npm install
npm run dev
```

**Install**

```bash
npm install
```

**Development**

Start dev server (nodemon + ts-node):

```bash
npm run dev
```

**Docker**

A simple `docker-compose.yml` is included for running the service and a local MongoDB. Start the stack with:

```bash
docker-compose up --build
```

The API will be available at `http://localhost:3000` (or the port set in `PORT`).

**Build**

```bash
npm run build
```

**Run tests**

All tests (unit + integration):

```bash
npm test
```

**CI-like checks (format, lint, tests)**

- The project includes an opinionated check script that mirrors CI: `npm run check`.
- Run the checks locally before opening a PR:

```bash
# install deps
npm install

# enable husky hooks once (one-time)
npx husky init

# auto-fix formatting
npm run format

# run the full local check (format check, lint, tests)
npm run check
```

**Commits & PRs**

- Husky + `lint-staged` run format and lint targets on staged files. Commits must follow the repository's `commitlint` rules (see `commitlint.config.cjs`). Use conventional commit messages like `feat(...)`, `fix(...)`, `chore(...)`.
- Create a PR by pushing your branch and using the GitHub compare UI: `https://github.com/JSantucci/task_manager_api/compare/main...<your-branch>?expand=1` or create it via the `gh` CLI (`gh pr create`).

**CI**

- The GitHub Actions workflow `.github/workflows/ci.yml` runs a Prettier check, ESLint (on `src` and `tests`), and the test suite (`vitest`). If you want CI to verify compiled TypeScript, update `ci.yml` to run `npm run build` before tests.

**Run a single test file:**

```bash
npx vitest tests/v1.0/task/createTask.test.ts
```

**Testing notes**

- Integration tests use `mongodb-memory-server` so no external DB is required.
- Tests load `.env.test` via `tests/utils/unitTestSetup.ts`. If you see missing env errors, create `.env.test` with at least `JWT_SECRET` and `API_VERSION`.
- Auth unit tests commonly set `AUTH_SKIP_DB=true` so the JWT payload is used directly instead of loading `User` from Mongo.

**API overview**

- Root: `GET /api/v${API_VERSION}/` returns a simple health message
- Task resource mounted at: `GET/POST /api/v${API_VERSION}/task`
- Task detail: `GET/PUT/DELETE /api/v${API_VERSION}/task/:id`

**Example: create a task (requires auth)**

```bash
curl -X POST http://localhost:3000/api/v1.0/task \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Example", "priority": "medium", "deadline": "2026-12-31" }'
```

**Swagger / API Docs**

- Generated from JSDoc in `src/api/**/*.ts` via `src/config/swagger/index.ts`.
- Docs are available at `/api-docs` (latest) and `/api-docs/v<version>` (versioned).

**Coding conventions & notes for contributors**

- All imports use explicit `.ts` extensions (ESM). Keep this style when adding files.
- Handlers: export named functions from the resource folder `index.ts` and import them in `routes.ts`.
- Validators: add route validators under `src/middleware/validators/` and apply them in `routes.ts` before the handler.
- Models: Mongoose models set `toJSON` transforms. API output expects `id` instead of `_id`.
- Auth: `src/middleware/auth.ts` implements `authenticateJWT` and `requireUser`. Be mindful of `AUTH_SKIP_DB` used in unit tests.

**How to add a new API version**

1. Add a new swagger config under `src/config/swagger/` (e.g. `v2.0/index.ts`).
2. Update `src/config/swagger/index.ts`'s `swaggerVersions` mapping.
3. Mount your new versioned router in `src/api/v2.0/index.ts` and in `src/app.ts` (if you want it exposed as latest, update the `API_VERSION` you pass to `setupSwagger`).

**Example test templates**

- Unit test (Vitest + Supertest):

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

- Integration test template (in-memory Mongo):

```ts
import request from 'supertest';
import app from '../../src/app';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../tests/utils/mongoMemoryServer';

beforeAll(async () => await connectInMemoryDB());
afterAll(async () => await disconnectInMemoryDB());

test('POST /api/v1.0/task creates a task', async () => {
	const res = await request(app)
		.post('/api/v1.0/task')
		.send({ title: 'x', priority: 'low', deadline: '2026-12-31' });
	expect(res.status).toBe(201);
});
```

**Contributing**

Contributions and improvements are welcome — open a PR and run tests locally before submitting. Follow the project's linting and commit conventions.

**License**

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full terms. (SPDX: MIT)

**Contact**

- Report issues or feature requests at: https://github.com/JSantucci/task_manager_api/issues
- Pull requests are welcome — please run the test suite and linters before opening a PR.
- Maintainer: JSantucci — https://github.com/JSantucci
