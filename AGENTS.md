# MUSIC DJ AGENT — Agentic Coding Guide

## Project Overview

Monorepo with npm workspaces (`apps/*`). Two packages:
- `apps/web` — Next.js 15 (app router) + React 19 + TailwindCSS 3
- `apps/server` — Express 4 + OpenAI SDK + ytmusic-api + better-sqlite3 (TypeScript ESM)

## Build / Lint / Test Commands

```bash
# Install all workspace dependencies (from repo root)
npm install

# Run both dev servers concurrently
npm run dev

# Dev per-package
npm run dev -w apps/server      # tsx watch src/index.ts (port 4000)
npm run dev -w apps/web         # next dev (port 3000)

# No lint/typecheck/test scripts exist yet. Add them via:
#   npm pkg set scripts.typecheck="tsc --noEmit" -w apps/server
#   npm pkg set scripts.lint="eslint ." -w apps/web
# Run TypeScript check manually:
npx -w apps/server tsc --noEmit
```

**Guideline**: If you add a new npm script, also register it in the root `package.json` under `"scripts"` so agents can discover it easily.

## Project Structure

```
music-dj-agent/
├── apps/
│   ├── web/                    # Next.js frontend (app router)
│   │   └── app/
│   │       ├── layout.tsx      # Root layout
│   │       └── page.tsx        # Home page (use client)
│   └── server/                 # Express API server (ESM)
│       ├── src/
│       │   ├── index.ts        # Express app entry
│       │   ├── llm.ts          # OpenAI chat completions
│   │   ├── music.ts        # YouTube Music search via ytmusic-api
│       │   ├── router.ts       # Intent detection
│       │   └── prompts/        # System prompt files
│       └── .env.example
├── data/                       # SQLite / local data
└── package.json                # Root (workspaces + concurrently)
```

## Code Style Conventions

### Imports
- `import x from "y"` (default imports), `import { a, b } from "y"` (named)
- No semicolons at end of statements
- Double quotes only (never single quotes)
- Blank line between std/external and local imports:
```ts
import express from "express"
import cors from "cors"

import { detectIntent } from "./router.js"
```
- Server uses ESM with `.js` extensions in relative imports (compiled from `.ts`)
- React `"use client"` directive on its own line (no semicolon)

### Formatting & Semicolons
- **No semicolons** — this is the single most important style rule
- No trailing commas in objects/arrays
- 2-space indentation (infer from existing files)
- Line length: soft limit ~80, hard limit ~100

### TypeScript
- Server `tsconfig`: `"strict": true`, `"moduleResolution": "Bundler"`, `"target": "ES2022"`
- Prefer `string` over `String`, `number` over `Number`
- Use `any` sparingly; prefer `unknown` when type is truly unknown
- Add explicit return types on `export`ed functions
- Use `Promise<T>` for async return types
- Avoid type assertions (`as X`) when possible

### Naming
- `camelCase` for variables, functions, parameters
- `PascalCase` for types, interfaces, classes, React components
- `kebab-case` for file names (this project currently uses flat names, prefer descriptive)
- Booleans: `isLoaded`, `hasError`, `shouldRetry`
- Async functions: `fetchThing`, `loadData`, `sendMessage`

### React / Next.js
- Use `"use client"` directive when using hooks or browser APIs
- Default exports for pages (e.g., `export default function HomePage()`)
- Inline styles for simple UIs; TailwindCSS utility classes for complex layouts
- Prefer `async function` in components over `useEffect` for data fetching (when possible)
- No default `index.ts` barrel files — import directly

### Error Handling
- Use early returns instead of nested `if`:
```ts
if (intent !== "play_music") {
  return res.json({ say: "今晚想聽什麼？" })
}
```
- Use try/catch blocks explicitly rather than `.catch()` chaining
- Server errors: return structured JSON (`{ say: string, track?: ... }`)
- Log errors with `console.error` in development, structured logging in production

### API Conventions
- Base URL: `http://localhost:4000`
- All API routes prefixed with `/api/`
- Request/response: JSON only (`Content-Type: application/json`)
- Response shape: `{ say: string, track?: { title, artist, videoId, album? } }`
- Frontend plays YouTube embed via `https://www.youtube.com/embed/{videoId}?autoplay=1`
- LLM output JSON schema (defined in `prompts/dj-system.txt`):
  `{ "say": string, "search": string }` — `search` is fed to YouTube Music

### Environment Variables
- Store in `apps/server/.env` (copy from `.env.example`)
- Access via `process.env.VAR_NAME`
- `OPENAI_API_KEY` — required for `openai` and `deepseek` providers
- `GEMINI_API_KEY` — required for `gemini` provider
- `LLM_PROVIDER` — `openai` (default) | `deepseek` | `gemini` | `local`
- `LLM_MODEL` — override the default model per provider
- `LLM_BASE_URL` — base URL for `local` provider (e.g. `http://localhost:11434/v1`)
- `LLM_API_KEY` — optional for `local` provider

### No Cursor / Copilot rules exist yet in this repository. If you add them, place at:
- `.cursor/rules/*.mdc` for Cursor
- `.github/copilot-instructions.md` for GitHub Copilot
