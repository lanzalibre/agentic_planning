# Supply Chain Planning Demo UI

A React-based dashboard for supply chain planning analysis and exception management. Built with TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Recharts** - Data visualization

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dev server will start at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── App.tsx                    # Main app component
├── main.tsx                   # Entry point
├── context/
│   └── AppContext.tsx          # Global state management
├── types/
│   └── index.ts               # Shared TypeScript types
├── data/
│   └── mockData.ts             # Mock data for demo
├── pages/                      # Full-page components
│   ├── Overview.tsx
│   ├── PlanningRuns.tsx
│   ├── PlanningConfiguration.tsx
│   ├── LongTermPlanning.tsx
│   ├── Connections.tsx
│   └── DemandAnalysis.tsx
├── components/
│   ├── layout/
│   │   ├── RightNavbar.tsx     # Main navigation
│   │   └── BottomQueryBox.tsx  # Chat input panel
│   ├── overview/
│   │   ├── KPIWidget.tsx
│   │   └── KPIConfigModal.tsx
│   ├── planning/
│   │   ├── FishboneDiagram.tsx
│   │   ├── LeadTimesValidation.tsx
│   │   └── ThroughputValidation.tsx
│   ├── demand/
│   └── shared/
│       ├── InfiniteListGrid.tsx
│       ├── Badge.tsx
│       └── Modal.tsx
```

## Features

- **Overview Dashboard** - KPI widgets with configurable metrics
- **Planning Runs** - Exception management with 3 groups (252/161/109 exceptions)
- **Planning Configuration** - Lead times and throughput validation with tab navigation
- **Long Term Planning** - Strategic planning views with fishbone diagrams
- **Connections** - External system integrations
- **Demand Analysis** - Demand planning and forecasting
- **Query Interface** - Chat-based input with @mention support
- **Infinite Scroll** - Efficient list rendering with batch loading (20 items)

## Mention Format

Use `Shift+click` on any entity row to append @mentions to the chat input:

- Lead time row: `@LT:{from_location}-{to_location}`
- Resource row: `@Resource:{name}`
- Exception row: `@Product:{product_hierarchy}`

## Deviation Window Selector

Available on validation pages for filtering:
- 1 week
- 1 month
- 3 months

## License

Private
