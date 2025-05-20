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

## Project Structure

```
vite-ts-datalake-dashboard/
├── index.html
├── package.json
├── tsconfig.json
├── .gitignore
├── public/
│   └── vite.svg
└── src/
    ├── main.ts                # Main dashboard logic and entry point
    ├── chartPanelConfig.ts    # Offcanvas panel for widget/chart configuration
    ├── dashboardWidgetConfig.ts # Default widget definitions
    ├── style.css              # Custom styles
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

## Customization

- **Adding Widgets:** Edit [`src/dashboardWidgetConfig.ts`](src/dashboardWidgetConfig.ts) to add, remove, or modify widgets.
- **Widget Model:** See [`src/model/dashboard-widget-config.ts`](src/model/dashboard-widget-config.ts) for the widget interface.
- **Chart Types:** Supports any Chart.js chart type. Update the `chartConfig` property in widget definitions.

## Dependencies

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Bootstrap 5](https://getbootstrap.com/)
- [Chart.js](https://www.chartjs.org/)
- [SortableJS](https://sortablejs.github.io/Sortable/)

## File References

- Main logic: [`src/main.ts`](src/main.ts)
- Widget config: [`src/dashboardWidgetConfig.ts`](src/dashboardWidgetConfig.ts)
- Widget model: [`src/model/dashboard-widget-config.ts`](src/model/dashboard-widget-config.ts)
- Chart config panel: [`src/chartPanelConfig.ts`](src/chartPanelConfig.ts)
- Styles: [`src/style.css`](src/style.css)

---

*Made with Vite, TypeScript, Bootstrap, and Chart.js.*
