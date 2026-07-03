# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR on localhost:5173)
npm run build     # Type-check (tsc -b) then production build
npm run preview   # Serve production build locally
npm run lint      # ESLint
```

No test runner is configured yet.

## Tech constraints

- **Node.js 16** — the machine runs v16.14.2. Packages must be compatible. `vite` is pinned to `^4.x` because v5+ requires Node 18+.
- ESLint 9 uses flat config (`eslint.config.js`).

## Architecture

Single-page React app. No router, no server. Data lives in IndexedDB via Dexie.js (`src/db/db.ts`).

### Data flow

```
User action (add / toggle done / delete)
  → useActivities hook method
    → Dexie CRUD on IndexedDB tables
      → liveQuery subscription fires
        → recomputes ActivityWithStreak[] (streaks recalculated)
          → React re-renders
```

All data mutations go through `useActivities()` — components never touch `db` directly.

### Streak calculation

Pure functions in `src/utils/streak.ts`:
- `currentStreak` — consecutive days ending at the most recent completion. Returns 0 if the most recent completion is more than 1 day before today.
- `longestStreak` — historical max consecutive run across all completions.

Both operate on sorted `string[]` of `"YYYY-MM-DD"` dates. Timezone-local; `src/utils/date.ts` provides `today()` using the local clock.

### Component tree

```
App
├── AddActivity          # Text input + "Add" button
├── Dashboard             # Grid of cards, or loading/empty state
│   └── StreakCard (×N)   # Name, streak count 🔥, mark-done toggle, delete
└── HistoryModal          # 60-day grid + stats overlay (conditional)
```

### Key files

| File | Role |
|---|---|
| `src/types/index.ts` | All TS interfaces (`Activity`, `Completion`, `ActivityWithStreak`) |
| `src/db/db.ts` | Dexie instance, schema v1, compound index `[activityId+date]` |
| `src/hooks/useActivities.ts` | Single data hook: queries via `liveQuery`, mutations, streak computation |
| `src/utils/date.ts` | `today()`, `dayDiff()`, `formatDate()`, `getDateRange()` |
| `src/utils/streak.ts` | `calculateStreak()`, `calculateLongestStreak()` — pure, testable |
| `src/App.tsx` | Root: wires hook → components, owns `historyTarget` modal state |
| `src/App.css` | All component styles, BEM-like naming, CSS custom properties for dark mode |
| `src/index.css` | CSS reset, custom properties (`--color-*`, `--radius`, `--shadow`, `--font`) |

### Database schema

Two tables in IndexedDB (`RoutineSeriesDB`):

- **activities**: `++id, name, createdAt`
- **completions**: `++id, activityId, date, [activityId+date]`

The compound index `[activityId+date]` enables efficient `toggleDone` lookups (check if today's completion already exists).

## Design decisions

- **No routing** — single-page dashboard, modal for detail. Unnecessary complexity for this scope.
- **No CSS framework** — plain CSS with BEM-like naming. Themes via `prefers-color-scheme: dark` media query and CSS custom properties.
- **No `dexie-react-hooks`** — uses Dexie's built-in `liveQuery()` + React `useEffect`/`useState` to avoid an extra dependency.
- **`toggleDone` is an undo** — clicking "Mark done" adds a completion; clicking again on the same day removes it (the completed button shows "✓ Done today").
- **Delete is cascading** — removes the activity and all its completions, with a `confirm()` guard.
