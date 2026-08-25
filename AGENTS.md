# AGENTS.md

## Project status

Greenfield e-commerce project. No source code, build commands, or CI yet. The repo currently contains only the OpenCode multi-agent configuration.

## Agent architecture

OpenCode orchestrator pattern with 5 sub-agents:

- **orchestrator** (primary, `edit: deny`) — Plans, decomposes, delegates. Never writes code directly. Uses `task` to invoke sub-agents, then verifies results.
- **backend-agent** — API, DB, auth, business logic. Has `edit` and `bash` permissions.
- **frontend-agent** — UI components, styles, accessibility. Has `edit` and `bash` permissions.
- **test-agent** — Unit, integration, E2E tests. Has `edit` and `bash` permissions.
- **review-agent** (`edit: deny`) — Code review only. Never modifies files. Reports issues by priority (CRITIQUE > MAJEUR > MINEUR > SUGGESTION).
- **docs-agent** — Documentation (README, JSDoc, ADR). Has `edit` and `bash` permissions.

Agent definitions: `.opencode/agent/*.md`

## Language

The project uses French for documentation and agent instructions. Agents should write in French when communicating with the user, unless the codebase language is clearly English.

## Installed skills

- `agent-browser` — Browser automation (Playwright-based)
- `frontend-design` — UI/UX design guidance
- `graphify` — Codebase AST indexing for navigation
- `grill-me` — Iterative interview for plan/design refinement
- `vercel-react-best-practices` — React/Next.js performance
- `vercel-react-native-skills` — React Native / Expo
- `webapp-testing` — Playwright-based webapp testing

## Orchestration rules

When the orchestrator agent is active:
1. Never write code directly — delegate via `task`
2. Decompose into atomic, independent steps when possible
3. Respect dependencies (DB schema → API → frontend)
4. Verify each sub-agent result before proceeding
5. Ask for user confirmation on destructive operations (migrations, deletes, deploys)

## What's not yet set up

No build/test/lint/CI commands exist yet. When application code is added, update this file with exact commands and required order (e.g. `lint → typecheck → test`).
