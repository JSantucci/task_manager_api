## Contributing

Thanks for your interest in contributing. This repo is a portfolio project — please follow these guidelines so contributions are consistent.

Before you start

- Run the test suite locally: `npm test`
- Run lint & format checks: `npm run check`
- Install Git hooks (one-time): `npx husky init`

Branching and PRs

- Create feature branches from `develop`: `git checkout -b feat/short-description`
- Open a PR from `develop` → `main` when ready for review (use draft PRs for WIP).

Commits

- Follow conventional commits briefly: `chore:`, `feat:`, `fix:`, `docs:`.
- Run `npm run format` and ensure `npm run lint` passes before committing.

Pre-commit hooks

- This repo uses Husky + lint-staged to run Prettier / ESLint on staged files. If you cloned the repo, run `npx husky init`.

Testing

- Unit tests are under `tests/v1.0/.../*.test.ts`.
- Integration tests use an in-memory MongoDB (no external DB required).

CI

- The project runs Prettier, ESLint (src & tests), and Vitest on PRs. Fix issues locally and push commits to update the PR.

Thanks — maintainers will review PRs and provide feedback.
