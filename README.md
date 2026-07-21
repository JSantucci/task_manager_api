# 🚀 Enterprise Task Management API (Node.js + TypeScript + MongoDB)

[![CI](https://github.com/JSantucci/task_manager_api/actions/workflows/ci.yml/badge.svg)](https://github.com/JSantucci/task_manager_api/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Swagger](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=flat&logo=swagger&logoColor=black)](#-api-overview--documentation)

> A production-ready, highly maintainable RESTful API built with **TypeScript, Express, and MongoDB**. Engineered with strict software principles: versioned API routes, JWT authentication, end-to-end integration testing via `mongodb-memory-server`, Docker orchestration, automated CI/CD workflows, and interactive OpenAPI/Swagger documentation.

> 🔗 Frontend APP Repository: [JSantucci/task_manager_app](https://github.com/JSantucci/task_manager_app)

## 🌟 Key Engineering Highlights

* 🏗️ **Clean Architecture & Design:** ESM-native TypeScript implementation with explicit router separation, request validators, and model transforms.
* 🔐 **Secure Authentication:** Stateless JWT authorization with custom `requireUser` middleware and route-level guards.
* 🧪 **Zero-External-Dependency Testing:** Powered by **Vitest** and `mongodb-memory-server` for blazing-fast, isolated integration and unit testing.
* ⚡ **Production-Ready CI/CD Pipelines:** GitHub Actions workflow executing formatting, linting (ESLint + Prettier), and full test suite run on every PR.
* 📦 **Containerized Development:** Fully configured `docker-compose` environment for single-command setup.
* 📖 **Automated API Documentation:** Interactive Swagger interface dynamically generated from JSDoc route annotations.
* 🛡️ **Strict Code Standards:** Pre-commit validation hooks via **Husky**, `lint-staged`, and conventional commit enforceability (`commitlint`).

## 📑 Table of contents

- [📋 Requirements](#-requirements)
- [⚡ Quick Start Docker](#-quick-start-docker)
- [🛠️ Development](#%EF%B8%8F-local-development)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [📚 API Overview & Documentation](#-api-overview--documentation)
- [📐 Project Structure](#-project-structure)
- [🤝 Contributing & Commit Standards](#-contributing--commit-standards)
- [📄 License & Maintainer](#-license--maintainer)

## 📋 Requirements

- Node.js 24+ (recommended)
- npm
- MongoDB (Local instance or Docker)

**Required environment variables**
Create a `.env` for local development or `.env.test` for tests. The app will throw if the required variables are missing (see `src/utils/getEnv.ts`).

- `PORT` — HTTP port (e.g. `3000`)
- `MONGO_URI` — MongoDB connection string (for local dev or CI)
- `JWT_SECRET` — secret used to sign JWTs
- `API_VERSION` — API major version (e.g. `1.0`)

**Optional environment variable:**

- `CORS_ORIGIN` — allowed frontend origin for credentialed CORS requests (default `http://localhost:5173`)

Tip for tests: Put test-specific values in `.env.test`. Unit tests sometimes set `AUTH_SKIP_DB=true` to avoid DB lookups in the auth middleware.

## ⚡ Quick Start Docker

Spin up the API and MongoDB instances locally with a single command:

1. Clone repository:
   ```bash
   git clone https://github.com/JSantucci/task_manager_api.git
   ```

2. Navigate to project:
   ```bash
   cd task_manager_api
   ```

3. Run Docker stack:
   ```bash
   docker-compose up --build
   ```

The API will be available at http://localhost:3000/api/v1.0 and Swagger docs at http://localhost:3000/api-docs.

## 🛠️ Local Development

**Install**

```bash
npm install
```

**Development**

Start dev server (nodemon + ts-node):

```bash
npm run dev
```

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

## 🧪 Testing & Quality Assurance

**Run a single test file**

```bash
npx vitest tests/v1.0/task/createTask.test.ts
```

**Testing notes**

- Integration tests use `mongodb-memory-server` so no external DB is required.
- Tests load `.env.test` via `tests/utils/unitTestSetup.ts`. If you see missing env errors, create `.env.test` with at least `JWT_SECRET` and `API_VERSION`.
- Auth unit tests commonly set `AUTH_SKIP_DB=true` so the JWT payload is used directly instead of loading `User` from Mongo.

> **Testing Strategy Note:** Integration tests utilize `mongodb-memory-server`, ensuring tests run entirely in-memory without requiring an active external MongoDB process.

## 📚 API Overview & Documentation

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
## 📐 Project Structure

```
task_manager_api/
├── .github/workflows/   # CI/CD GitHub Actions pipelines
├── src/
│   ├── api/             # Versioned controllers & routes (v1.0, etc.)
│   ├── config/          # Database, Swagger & Env configurations
│   ├── middleware/      # Auth guards, request validators & handlers
│   ├── models/          # Mongoose schemas & data transformations
│   ├── utils/           # Helper functions & env validators
│   ├── app.ts           # Express application setup
│   └── server.ts        # HTTP server entrypoint
├── tests/               # Unit, Integration & In-memory DB utilities
├── docker-compose.yml   # Multi-container orchestration
└── vitest.config.ts     # Vitest configuration
```

## 🤝 Contributing & Commit Standards

Contributions and improvements are welcome — open a PR and run tests locally before submitting. Follow the project's linting and commit conventions.

**Commits & PRs**

- Husky + `lint-staged` run format and lint targets on staged files. Commits must follow the repository's `commitlint` rules (see `commitlint.config.cjs`). Use conventional commit messages like `feat(...)`, `fix(...)`, `chore(...)`.
- Create a PR by pushing your branch and using the GitHub compare UI: `https://github.com/JSantucci/task_manager_api/compare/main...<your-branch>?expand=1` or create it via the `gh` CLI (`gh pr create`).
  
**CI**

- The GitHub Actions workflow `.github/workflows/ci.yml` runs a Prettier check, ESLint (on `src` and `tests`), and the test suite (`vitest`). If you want CI to verify compiled TypeScript, update `ci.yml` to run `npm run build` before tests.

## 📄 License & Maintainer

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full terms. (SPDX: MIT)

- Report issues or feature requests at: https://github.com/JSantucci/task_manager_api/issues
- Pull requests are welcome — please run the test suite and linters before opening a PR.
- Maintainer: JSantucci — https://github.com/JSantucci
