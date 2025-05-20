# Vite TypeScript Datalake Dashboard

A customizable, drag-and-drop dashboard built with Vite, TypeScript, Bootstrap 5, and Chart.js. This project demonstrates a modular dashboard with configurable widgets, persistent state, and chart editing via an offcanvas panel.

## Features

- **Drag & Drop Widgets:** Reorder dashboard widgets using SortableJS.
- **Chart.js Integration:** Visualize data with bar, doughnut, and line charts.
- **Widget Configuration Panel:** Edit widget titles and chart dataset properties via a Bootstrap offcanvas panel.
- **Persistent State:** Dashboard layout and widget settings are saved to `localStorage`.
- **Responsive Design:** Uses Bootstrap grid for adaptive layouts.
- **TypeScript:** Strongly typed codebase for reliability and maintainability.
- **Vite:** Fast development server and optimized builds.
- **Dynamic Chart Data:** Chart data is loaded from a mock JSON file (`public/mock-chart-data.json`) via the service layer.
- **Widget Model Separation:** Widget configuration and model are separated for clarity and extensibility.
- **Error Handling:** User-friendly error messages for failed data loads or dashboard initialization.

## Project Structure

```
vite-ts-datalake-dashboard/
├── index.html
├── package.json
├── tsconfig.json
├── .gitignore
├── public/
│   ├── mock-chart-data.json      # Mock chart data for widgets
│   ├── SphereWms.svg
│   └── vite.svg
└── src/
    ├── main.ts                   # Main dashboard logic and entry point
    ├── chartPanelConfig.ts       # Offcanvas panel for widget/chart configuration
    ├── dashboardWidgetConfig.ts  # (Legacy) Example static widget definitions
    ├── service.ts                # Chart data fetching logic
    ├── style.css                 # Custom styles
    ├── vite-env.d.ts
    ├── typescript.svg
    └── model/
        └── dashboard-widget-config.ts # Widget config interface
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/vite-ts-datalake-dashboard.git
   cd vite-ts-datalake-dashboard
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

### Development

Start the Vite development server:

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) in your browser.

### Building for Production

To build the project for production:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

## Usage

- **Reordering Widgets:** Drag any widget by its card header to rearrange.
- **Configuring Charts:** Click the gear icon on a chart widget to open the configuration panel. Edit the title, dataset label, colors, or Y-axis settings, then apply changes.
- **Persistence:** All changes are saved to your browser's `localStorage` and persist across reloads.
- **Dynamic Chart Data:** Chart data is loaded from `public/mock-chart-data.json` at first load, and can be extended or replaced with real API calls in [`src/service.ts`](src/service.ts).

## Customization

- **Adding Widgets:** Edit the `baseInitialWidgets` array in [`src/main.ts`](src/main.ts) to add, remove, or modify widgets. Chart data for widgets with `hasChart: true` should be provided in [`public/mock-chart-data.json`](public/mock-chart-data.json).
- **Widget Model:** See [`src/model/dashboard-widget-config.ts`](src/model/dashboard-widget-config.ts) for the widget interface.
- **Chart Types:** Supports any Chart.js chart type. Update the chart data in the mock JSON or your API.
- **Widget Configuration Panel:** The configuration panel logic is in [`src/chartPanelConfig.ts`](src/chartPanelConfig.ts).

## Dependencies

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Bootstrap 5](https://getbootstrap.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Chart.js](https://www.chartjs.org/)
- [SortableJS](https://sortablejs.github.io/Sortable/)

## File References

- Main logic: [`src/main.ts`](src/main.ts)
- Chart data service: [`src/service.ts`](src/service.ts)
- Widget config (legacy/static): [`src/dashboardWidgetConfig.ts`](src/dashboardWidgetConfig.ts)
- Widget model: [`src/model/dashboard-widget-config.ts`](src/model/dashboard-widget-config.ts)
- Chart config panel: [`src/chartPanelConfig.ts`](src/chartPanelConfig.ts)
- Styles: [`src/style.css`](src/style.css)
- Mock chart data: [`public/mock-chart-data.json`](public/mock-chart-data.json)

---

*Made with Vite, TypeScript, Bootstrap, and Chart.js.*
