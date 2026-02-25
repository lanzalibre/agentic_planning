# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Type-check with tsc, then Vite production build
npm run preview   # Preview the production build locally
```

There are no tests or linting scripts configured in this project.

## Architecture

This is a **pure frontend demo** — no API calls, no backend. All data lives in `src/data/mockData.ts`.

### Layout

`App.tsx` renders a single shell:
- **Right sidebar** (`RightNavbar`) — icon-only by default, expands on toggle. Navigation drives `currentPage` in context.
- **Main content area** — renders the active page component based on `currentPage`.
- **Bottom chat bar** (`BottomQueryBox`) — always-visible; overlaps page content (`pb-40` padding compensates). Contains collapsible AI Playbooks strip and chat history panel.

### State Management

All global state is in `src/context/AppContext.tsx` via a single React context (`useApp()` hook):
- `currentPage` — active `PageId`
- `kpiWidgets` — KPI widget config (visibility, order)
- `queryMessages` — chat history
- `planningConfigTab` — `'lead-times' | 'throughput'` (sub-tab in Planning Config)
- `demandAnalysisTab` — `'abc-xyz' | 'sunburst'`
- `pendingMention` — set by Shift+click on any list row; consumed by `BottomQueryBox` to append to input

AI responses are **hardcoded strings** in `AppContext.tsx` (`aiResponses` map), matched by keyword patterns in `addQuery()`.

### Page Routing

Navigation is a `switch` on `currentPage` in `AppShell`. The `PageId` type in `src/types/index.ts` is the canonical list:

| PageId | Component | Notes |
|---|---|---|
| `overview` | `Overview` | KPI widgets, configurable via modal |
| `exception-analysis` | `ExceptionAnalysis` | "Planning Runs" in nav |
| `planning-config` | `PlanningConfiguration` | Tab wrapper for Lead Times + Throughput |
| `lead-times` | `LeadTimesValidation` | Also reachable directly; nav highlights `planning-config` |
| `throughput` | `ThroughputValidation` | Same as above |
| `demand-analysis` | `DemandAnalysis` | ABC-XYZ and Sunburst tabs |
| `long-term` | `LongTermPlanning` | Fishbone diagram |
| `connections` | `Connections` | External integrations list |

### Key Shared Components

**`InfiniteListGrid<T>`** (`src/components/shared/InfiniteListGrid.tsx`) — generic table with:
- `IntersectionObserver`-based infinite scroll (default batch size 30)
- Optional Shift+click callback (`onShiftClick`) — used to append `@mention` to chat
- Optional CSV export

**`BottomQueryBox` Playbooks** — `PlaybookItem` from `mockData.ts` is either a navigation item (`page` + optional `tab`) or a chat query prefill (`query`). Blue chips navigate, grey chips populate the input.

### Mention Format (Shift+click → chat input)

- Lead time row: `@LT:{fromLocation_underscored}-{toLocation_underscored}`
- Resource row: `@Resource:{name_underscored}`
- Exception row: `@Product:{productHierarchy}` (slashes kept as-is)

### Icons

All icons come from `lucide-react`. Planning Config nav icon: `SlidersHorizontal`. Avoid importing from other icon libraries.

### Styling

Tailwind CSS only — no CSS modules or styled-components. No custom Tailwind theme extensions beyond what's in `tailwind.config.js`.
