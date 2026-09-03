# AGENTS.md

## Layout

- `v1/` — the real application: a single-package Next.js 15 e-commerce app (`ecom-dz`), with its own `package.json`, `src/`, `prisma/`, and deployment files. **Do all work here.** Open `v1/AGENTS.md` for its commands and conventions.
- `v2/` — empty; future version placeholder. Nothing to build here.
- `.opencode/` — multi-agent OpenCode config (`default_agent: orchestrator`). Agent definitions in `.opencode/agent/*.md`.
- Used skills are locked in `v1/skills-lock.json`.

The app must be run from `v1/` (its scripts and Prisma schema live there). Never run npm/ui commands from the repo root.

## Git

- The git repo root is `/home/abdelghani/Bureau/ecom`; changes to `v1/` are tracked normally from the root.
- **Transitional state:** `v1/` is currently untracked and the move from repo root into `v1/` is uncommitted. Root-level files (package.json, prisma/, src/, etc.) will appear as deleted. Treat `v1/` as the source of truth and do not commit the mass deletion of root-level files prematurely.
- No CI workflows exist. Husky enforces lint-staged (eslint + prettier) on commit.
