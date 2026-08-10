# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR on localhost:5173)
npm run build     # Type-check (tsc -b) then production build
npm run preview   # Serve production build locally
npm run lint      # ESLint
npm run test      # Vitest (unit tests)

# GitHub Pages deploy status (run on user request)
gh run list --workflow=deploy.yml --limit=1 --json status,conclusion,displayTitle,updatedAt,url
```

## Tech constraints

- **Node.js 16** — the machine runs v16.14.2. Packages must be compatible. `vite` is pinned to `^4.x` because v5+ requires Node 18+.
- ESLint 9 uses flat config (`eslint.config.js`).

## Project documentation

- [README.md](README.md) — цели, функциональность, модель данных, схема компонентов
- [TODO.md](TODO.md) — план задач и отложенные

## Architecture

Single-page React app. No router, no server. Data lives in IndexedDB via Dexie.js (`src/db/db.ts`).

### Data flow

See [README.md § Data flow](README.md#data-flow) for the full diagram.

### Key files

| File | Role |
|---|---|
| `src/types/index.ts` | All TS interfaces (`Activity`, `SeriesDefinition`, `Completion`, `ActivityWithStreak`, `ComputedSeries`) |
| `src/db/db.ts` | Dexie instance, schema v2 (activities, seriesDefinitions, completions, rewardIssues) |
| `src/hooks/useActivities.ts` | Single data hook: `liveQuery`, mutations, `latestDef()` |
| `src/hooks/VirtualTodayContext.tsx` | Virtual today — provider + `useVirtualToday` |
| `src/utils/date.ts` | `today()`, `dayDiff()` |
| `src/utils/series.ts` | `computeSeries()`, `isGapBreak()`, `findCurrentSeries()` |
| `src/utils/rewards.ts` | `calcEarnedByCurrency()`, `calcIssuedByCurrency()`, `calcUnissuedByCurrency()`, `getCurrencies()` |
| `src/i18n/` | `LocaleContext` + translations (en/ru) |
| `src/App.tsx` | Root: page switching (`dashboard` / `monitoring` / `archive`) |
| `src/App.css` | All component styles, BEM-like naming, CSS custom properties for dark mode |
| `src/index.css` | CSS reset, custom properties (`--color-*`, `--radius`, `--shadow`, `--font`) |

### Database schema

Current schema is described in [README.md § Структура данных](README.md#структура-данных).

## Workflow constraints

- **Task-driven development** — code changes (add/modify/delete) are only allowed when there is a corresponding task in [TODO.md](TODO.md). Without a task, only documentation files may be edited: `CLAUDE.md`, `TODO.md`, `README.md`, `DONE.md`, `JOURNAL.md`.
- **Never read `.env` files** — `.env` contains real secrets (DB passwords, API keys). NEVER use Read, Grep, Bash (`cat`, `Get-Content`), or any other tool to read `.env` or `.env.*` files. If you need to know which environment variables exist, read `.env.example` instead — it has the same structure with placeholder values.
- **Per-component CSS** — each new component must have its own CSS file for styles that belong exclusively to that component (e.g. `ComponentName.css` in the same directory). Shared/global styles remain in `App.css` or `index.css`.
- **Import aliases** — use path aliases instead of relative imports in `.ts`/`.tsx` files:
  - `@/` (`src/`) — for cross-cutting modules: hooks (`@/hooks/...`), utils (`@/utils/...`), types (`@/types`), i18n (`@/i18n/...`), db (`@/db/...`)
  - `@components/` (`src/components/`) — for components (`@components/ComponentName/ComponentName`)
  - Relative imports (`./` or `../`) are only allowed within the same component directory (e.g. `./ChildComponent` from `ParentComponent.tsx`)
- **Take next task** — when the user asks to take a new/next/another task («возьми новую задачу», «следующую», «очередную»), take the first unchecked (`- [ ]`) item from the «Взять в работу» section in [TODO.md](TODO.md) (including subsections), mark it as «в работе» before making any code changes, and begin working on it.
- **Mark in-progress before starting** — when the next step is identified and the user explicitly says to begin work, mark the step as «в работе» in [TODO.md](TODO.md) before making any code changes.
- **User verifies before done** — after implementation, the user reviews the result. Only mark a step as `[x]` done after the user's explicit confirmation.
- **Update component schema** — after completing a TODO item that changes the component tree (new components, new nesting, removed components), update the implemented component hierarchy in [README.md](README.md) § «Реализованная схема вложенности компонентов».
- **Failing test = stop** — if any test fails, do NOT proceed with a fix without the user's explicit command. Only offer a suggested solution and wait for approval.
- **Bug workflow** — bugs are handled in a separate cycle:
  1. User describes the bug
  2. Find the root cause (investigation)
  3. Write a step-by-step fix plan (numbered steps)
  4. Either the user or Claude, upon request, adds the fix steps to the «Взять в работу» section of [TODO.md](TODO.md)

## Design decisions

- **No routing** — page switching via `Page` state (`'dashboard' | 'monitoring' | 'archive'`).
- **No CSS framework** — plain CSS with BEM-like naming. Themes via `prefers-color-scheme: dark` media query and CSS custom properties.
- **No `dexie-react-hooks`** — uses Dexie's built-in `liveQuery()` + React `useEffect`/`useState` to avoid an extra dependency.
- **`toggleDone` is an undo** — clicking "Mark done" adds a completion; clicking again on the same day removes it.
- **Soft-delete** — `deleteActivity` sets `archived: true` if completions exist, otherwise hard-deletes. Archived activities are filtered out in `liveQuery`.
- **Series are computed, not stored** — no Series table. Status, streak counts, and completion history are derived from `Completion` records + `SeriesDefinition` parameters. See [README § Как формируются серии](README.md#как-формируются-серии).
- **SeriesDefinition versioning** — `seriesLength`, `reward`, `currency` are not on `Activity`. They live in `SeriesDefinition` with `createdAt`. Changing params creates a new version; old series keep their old params.
- **Time travel** — `TimeOffsetContext` stores day offset; `today()` and `getDateRange()` accept optional offset parameter.
- **i18n via LocaleContext** — language detected from browser, persisted to `localStorage`. Translations in `src/i18n/translations.ts`.
