# AGENTS.md

This is the `ecom-dz` app inside `v1/`. The parent repo (`/home/abdelghani/Bureau/ecom/AGENTS.md`) explains how `v1/` relates to the repo root. Open the root file for repo-level layout and Git notes.

## Language

Communicate with the user in **French** (UI copy, comments, and agent instructions are all French). The app ships FR/AR/EN via next-intl.

## Key stack

- Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind v4 (CSS-first, `@import "tailwindcss"`).
- **next-intl v4 with cookie-based locale detection — no `[locale]` URL segment.** Locale is resolved in `src/middleware.ts` (cookie → Accept-Language → `fr`), persisted in the `NEXT_LOCALE` cookie, read server-side in `src/i18n/request.ts`, and set on the root layout (anti-FOUC script). Separate admin/storefront locale cookies.
- NextAuth v5 (beta) Credentials provider, JWT strategy, bcrypt. Admin routes (`/admin/*`) are guarded in middleware.
- Prisma 6 (PostgreSQL), path alias `@/*` → `./src/*`.

## Run (from `v1/`)

```bash
npm install            # after clone
npm run dev            # next dev (used by Playwright webServer too)
```

Commands live in `v1/package.json`. Important ones:

- `npm run lint` / `npm run lint:fix` — ESLint 9 flat config (`eslint.config.mjs`)
- `npm run format` / `npm run format:check` — Prettier (semi, double quotes, 2-space)
- DB: `db:generate`, `db:push`, `db:migrate`, `db:migrate:prod` (deploy), `db:seed`, `db:studio`, `db:import-wilayas`
- Tests: `npm test` (Vitest, jsdom, tests in `src/**` + `scripts/**`), `npm run test:e2e` (Playwright, in `e2e/`, Chromium only, auto-starts `npm run dev`)
- `npm run build` / `npm start` — standalone output for Docker deploy

Run `npm run lint` after editing `.ts/.tsx` (Husky/lint-staged enforces this on commit).

## Prisma / DB

- Schema: `prisma/schema.prisma` (15 models + enums). Migrations are gitignored — `.gitignore` excludes `prisma/migrations/`, so schema changes are tracked via `db push` locally; use `db:migrate:prod` only on the deployed Postgres.
- Env (`.env` at repo root, loaded by Prisma/Next): `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ENCRYPTION_KEY`, `CREDENTIALS_ENCRYPTION_KEY`, provider creds (Meta/TikTok/dzship), `UPLOAD_DIR`, `MAX_FILE_SIZE`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`. See `.env.example`. Default seed admin credentials come from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- `prisma/seed.ts`: admin user + 69 wilayas + 1541 communes (from `prisma/data/wilayas-communes.json`) + default settings/theme + delivery matrix + 4 categories + 8 test products.

## Structure

- `src/app/` — App Router routes: `(storefront)/`, `admin/`, `api/` (15 route groups). Root layout pulls theme + locale from DB/cookies.
- `src/lib/` — `auth.ts` (NextAuth), `prisma.ts` (singleton), `validators.ts` (Zod: phone is Algerian `05/06/07`), `delivery/`, `logistics/` (dzship providers), `pixels/` (encrypted Meta/TikTok tokens).
- `src/i18n/`, `src/messages/{fr,ar,en}.json`, `src/middleware.ts` — trilingual setup.
- `src/styles/themes.css` — 5 themes (NEUMORPHISM, LUXURY, VIBRANT, ORGANIC, TECH) as `data-theme` CSS variables.
- `src/components/{ui,admin,storefront}/`, `src/hooks/`, `src/providers/`.
- Currency is DZD throughout.

## Patterns / gotchas

- Marketing pixel tokens and delivery provider credentials are **encrypted at rest** via AES keys in env; don't store them plaintext and never rotate `ENCRYPTION_KEY`/`CREDENTIALS_ENCRYPTION_KEY` without re-encrypting existing rows.
- API routes don't go through i18n locale prefixing (see middleware).
- Do not commit secrets; `.env` is checked in at repo root — handle carefully.
- Deploy guides (Docker standalone + nginx, AlwaysData) live in `v1/` (`guid.md`, `DEPLOIEMENT_ALWAYSDATA.md`).

## Agent architecture (OpenCode)

Orchestrator pattern via `.opencode/agent/*.md`; `default_agent: orchestrator`:

- **orchestrator** (primary, `edit: deny`) — plans, decomposes, delegates via `task`; never writes code directly.
- **backend-agent** / **frontend-agent** / **test-agent** / **docs-agent** — sub-agents with `edit`+`bash` for their domains.
- **review-agent** (`edit: deny`) — code review only; reports by priority (CRITIQUE > MAJEUR > MINEUR > SUGGESTION).

Installed skills (locked in `.agents/skills-lock.json`): `agent-browser`, `frontend-design`, `graphify`, `grill-me`, `vercel-react-best-practices`, `vercel-react-native-skills`, `webapp-testing`.

When orchestrator is active, delegate via `task` (don't edit directly) and ask for confirmation on destructive ops (migrations, deletes, deploys).
