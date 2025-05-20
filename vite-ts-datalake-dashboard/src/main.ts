// src/main.ts
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sortable from 'sortablejs';
import { Chart, registerables, type ChartConfiguration, type ChartOptions } from 'chart.js'; // Ensure all needed types are here
import './style.css';
import { ChartConfigPanel, type PanelWidgetUpdate } from './chartPanelConfig';
import { fetchAllChartData, type RawChartConfig } from './service'; // Import service

Chart.register(...registerables);

const DASHBOARD_STATE_KEY = 'dashboardState';

export interface DashboardWidgetConfig {
    id: string;
    title: string;
    content: string; // General description
    columnClass: string;
    chartConfig?: ChartConfiguration; // Will be populated or loaded
    hasChart?: boolean; // New flag to indicate if a widget is intended to have a chart
}

// Initial state of widgets - الآن بدون بيانات مخطط مضمنة بشكل مباشر
// We'll use 'hasChart: true' to know which widgets should try to load chart data.
const baseInitialWidgets: Omit<DashboardWidgetConfig, 'chartConfig'>[] = [
    {
        id: 'widget-analytics',
        title: 'Website Visits',
        content: 'Monthly visits to the website.',
        columnClass: 'col-md-6 col-lg-4',
        hasChart: true,
    },
    {
        id: 'widget-sales',
        title: 'Sales Distribution',
        content: 'Sales by product category.',
        columnClass: 'col-md-6 col-lg-4',
        hasChart: true,
    },
    {
        id: 'widget-activity',
        title: 'User Activity',
        content: 'Feed of latest user actions.',
        columnClass: 'col-md-12 col-lg-4',
        hasChart: false,
    },
    {
        id: 'widget-tasks',
        title: 'Open Tasks',
        content: 'You have 5 open tasks.',
        columnClass: 'col-md-6 col-lg-3',
        hasChart: false,
    },
    {
        id: 'widget-server',
        title: 'Server Status (Line)',
        content: 'CPU Utilization over time.',
        columnClass: 'col-md-6 col-lg-9',
        hasChart: true,
    },
];


const dashboardGrid = document.getElementById('dashboard-grid');
let currentWidgets: DashboardWidgetConfig[] = [];
const activeCharts: Map<string, Chart> = new Map();
let chartConfigPanel: ChartConfigPanel;


/**
 * Merges fetched chart data into a widget's configuration.
 */
function createChartConfigFromRaw(rawData: RawChartConfig): ChartConfiguration {
    // Define default options that can be overridden by localStorage or panel
    const defaultOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true } // Common default
        },
        plugins: {
            legend: { position: 'top' }
        }
    };

    // If chart type is pie or doughnut, y-axis usually not needed
    if (rawData.type === 'pie' || rawData.type === 'doughnut') {
        if (defaultOptions.scales) delete defaultOptions.scales.y;
    }
     // For line charts, specific tension might be in rawData, otherwise default
    if (rawData.type === 'line' && defaultOptions.scales?.y && rawData.datasets[0]?.tension === undefined) {
        // rawData.datasets[0].tension = 0.1; // Or let Chart.js default handle it
    }


    return {
        type: rawData.type,
        data: {
            labels: rawData.labels,
            datasets: rawData.datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.backgroundColor,
                borderColor: ds.borderColor,
                borderWidth: ds.borderWidth,
                tension: ds.tension, // For line charts
                fill: ds.fill,       // For line charts
            }))
        },
        options: defaultOptions // Start with defaults, localStorage will override
    };
}


async function initializeWidgetsWithData(): Promise<DashboardWidgetConfig[]> {
    let loadedWidgets = loadDashboardState(); // Load from localStorage first

    if (loadedWidgets.length > 0) {
        // If we have saved state, use it.
        // We might still want to refresh data for existing charts if their structure in localStorage
        // doesn't have data, or if we implement a "refresh data" feature.
        // For now, we assume localStorage holds the complete desired state including data.
        console.log("Loaded widgets from localStorage.");
        return loadedWidgets;
    }

    // If no localStorage state, build from baseInitialWidgets and fetched data
    console.log("No localStorage state found. Building from initial config and fetched data.");
    const fetchedChartData = await fetchAllChartData();
    const initialConfiguredWidgets: DashboardWidgetConfig[] = baseInitialWidgets.map(baseWidget => {
        const widget: DashboardWidgetConfig = { ...baseWidget, chartConfig: undefined }; // Initialize with undefined chartConfig
        if (baseWidget.hasChart && fetchedChartData[baseWidget.id]) {
            widget.chartConfig = createChartConfigFromRaw(fetchedChartData[baseWidget.id]);
        }
        return widget;
    });
    return initialConfiguredWidgets;
}


// ... (createWidgetElement, renderWidgets, saveDashboardState functions remain largely the same)
// Make sure createWidgetElement checks for widget.chartConfig before trying to access its properties.

function createWidgetElement(widget: DashboardWidgetConfig): HTMLElement {
    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = `dashboard-widget ${widget.columnClass} mb-3`;
    widgetWrapper.setAttribute('data-id', widget.id);

    let chartCanvasHtml = '';
    let configureButtonHtml = '';

    // Check if chartConfig exists AND if the widget is intended to have a chart
    if (widget.hasChart && widget.chartConfig) { // Modified condition
        chartCanvasHtml = `
            <div class="chart-container mt-2" style="position: relative; height:250px; width:100%;">
                <canvas id="chart-${widget.id}"></canvas>
            </div>`;
        configureButtonHtml = `
            <i class="bi bi-gear-fill widget-configure-btn" role="button" title="Configure Widget"></i>
        `;
    }
    // ... rest of createWidgetElement (innerHTML, event listener) ...
    widgetWrapper.innerHTML = `
        <div class="card h-100">
            <div class="card-header">
                <h5 class="card-title mb-0">${widget.title}</h5>
                ${configureButtonHtml}
            </div>
            <div class="card-body d-flex flex-column">
                ${widget.content ? `<p class="card-text">${widget.content}</p>` : ''}
                ${chartCanvasHtml}
            </div>
        </div>
    `;

    const configureBtnElement = widgetWrapper.querySelector('.widget-configure-btn');
    if (configureBtnElement) {
        configureBtnElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (widget) {
                chartConfigPanel.open(widget);
            } else {
                console.error("Could not find widget data for configure button.");
            }
        });
    }
    return widgetWrapper;
}

function renderWidgets(widgetsToRender: DashboardWidgetConfig[]): void {
    if (!dashboardGrid) return;
    dashboardGrid.innerHTML = '';

    activeCharts.forEach(chart => chart.destroy());
    activeCharts.clear();

    widgetsToRender.forEach(widget => {
        const widgetEl = createWidgetElement(widget);
        dashboardGrid.appendChild(widgetEl);

        // Also check widget.hasChart here
        if (widget.hasChart && widget.chartConfig) {
            const canvas = document.getElementById(`chart-${widget.id}`) as HTMLCanvasElement | null;
            if (canvas) {
                try {
                    const chartInstance = new Chart(canvas, widget.chartConfig);
                    activeCharts.set(widget.id, chartInstance);
                } catch(error) {
                    console.error(`Error creating chart for widget ${widget.id}:`, error, widget.chartConfig);
                    // Optionally display an error message in the widget card itself
                    const cardBody = widgetEl.querySelector('.card-body');
                    if (cardBody) {
                        cardBody.innerHTML += `<p class="text-danger mt-2">Error loading chart data.</p>`;
                    }
                }
            }
        }
    });
}

function saveDashboardState(): void {
    localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(currentWidgets));
    console.log('Dashboard state saved:', currentWidgets);
}

function loadDashboardState(): DashboardWidgetConfig[] {
    const savedStateJSON = localStorage.getItem(DASHBOARD_STATE_KEY);
    if (savedStateJSON) {
        try {
            const savedWidgets: DashboardWidgetConfig[] = JSON.parse(savedStateJSON);
            if (Array.isArray(savedWidgets) && savedWidgets.every(w => w.id)) {
                console.log("Successfully loaded widgets from localStorage.");
                return savedWidgets; // Return them directly
            }
        } catch (e) {
            console.error('Error parsing saved dashboard state:', e);
            localStorage.removeItem(DASHBOARD_STATE_KEY);
        }
    }
    return []; // Return empty if nothing valid loaded, so initializeWidgetsWithData fetches.
}

/**
 * Callback function for when the configuration panel applies changes.
 */
function handlePanelApply(widgetId: string, updates: PanelWidgetUpdate): void {
    const widgetToUpdate = currentWidgets.find(w => w.id === widgetId);
    if (!widgetToUpdate) {
        console.error("Widget to update not found after panel apply:", widgetId);
        return;
    }

    widgetToUpdate.title = updates.title;

    // Ensure chartConfig exists if we are trying to update chart properties
    if (widgetToUpdate.hasChart && !widgetToUpdate.chartConfig && (updates.datasetLabel || updates.datasetBgColor || updates.datasetBorderColor || updates.yAxisBeginAtZero !== undefined)) {
        // This case might occur if a chart widget was somehow saved without a chartConfig
        // or if we want to allow adding a chart to a widget that didn't have one.
        // For now, we'll assume if it's a chart widget, it should have a chartConfig.
        // If not, we might need to fetch its base chart data again.
        console.warn(`Widget ${widgetId} is marked as chart widget but has no chartConfig. Panel updates might not apply correctly to chart.`);
        // A more robust solution: if !chartConfig, fetch base data for this widgetId
        // and then apply panel updates. For now, we proceed cautiously.
        // For this to work, we might need a default chartConfig structure.
        // For simplicity, we'll assume chartConfig is initialized if hasChart is true.
    }


    if (widgetToUpdate.chartConfig && widgetToUpdate.chartConfig.data.datasets[0]) {
        const chartConfig = widgetToUpdate.chartConfig;
        const dataset = chartConfig.data.datasets[0];

        if (updates.datasetLabel !== undefined) dataset.label = updates.datasetLabel;

        const needsColorArray = (chartConfig.type === 'pie' || chartConfig.type === 'doughnut') ||
                                (updates.selectedColorIndex !== undefined && updates.selectedColorIndex >= 0);

        if (needsColorArray) {
            if (!Array.isArray(dataset.backgroundColor) || dataset.backgroundColor.length < (dataset.data?.length || 0) ) {
                const singleColor = (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) || 'rgba(200, 200, 200, 0.5)';
                dataset.backgroundColor = new Array(dataset.data?.length || 1).fill(null).map((_, i) =>
                    (Array.isArray(dataset.backgroundColor) && dataset.backgroundColor[i]) ? dataset.backgroundColor[i] : singleColor
                );
            }
            if (!Array.isArray(dataset.borderColor) || dataset.borderColor.length < (dataset.data?.length || 0) ) {
                const singleColor = (Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor) || 'rgba(100, 100, 100, 1)';
                dataset.borderColor = new Array(dataset.data?.length || 1).fill(null).map((_, i) =>
                    (Array.isArray(dataset.borderColor) && dataset.borderColor[i]) ? dataset.borderColor[i] : singleColor
                );
            }
        }


        if (updates.selectedColorIndex !== undefined && updates.selectedColorIndex >= 0) {
            const idx = updates.selectedColorIndex;
            if (Array.isArray(dataset.backgroundColor) && idx < dataset.backgroundColor.length) {
                if (updates.datasetBgColor !== undefined) dataset.backgroundColor[idx] = updates.datasetBgColor;
            } else if (Array.isArray(dataset.backgroundColor)) { // Index out of bounds, append? Or error?
                console.warn("Selected color index out of bounds for background colors.");
            }

            if (Array.isArray(dataset.borderColor) && idx < dataset.borderColor.length) {
                if (updates.datasetBorderColor !== undefined) dataset.borderColor[idx] = updates.datasetBorderColor;
            } else if (Array.isArray(dataset.borderColor)) {
                console.warn("Selected color index out of bounds for border colors.");
            }
        } else {
            if (updates.datasetBgColor !== undefined) {
                dataset.backgroundColor = Array.isArray(dataset.backgroundColor) && dataset.backgroundColor.length > 0 ? [updates.datasetBgColor, ...dataset.backgroundColor.slice(1)] : updates.datasetBgColor;
            }
            if (updates.datasetBorderColor !== undefined) {
                dataset.borderColor = Array.isArray(dataset.borderColor) && dataset.borderColor.length > 0 ? [updates.datasetBorderColor, ...dataset.borderColor.slice(1)] : updates.datasetBorderColor;
            }
        }

        if (!chartConfig.options) chartConfig.options = {};
        // ... (rest of options updates as before)
        if (!chartConfig.options.scales) chartConfig.options.scales = {};
        if (!chartConfig.options.scales.y) chartConfig.options.scales.y = {};

        if (updates.yAxisBeginAtZero !== undefined &&
            chartConfig.type !== 'doughnut' &&
            chartConfig.type !== 'pie') {
            // Use type assertion to ensure TypeScript knows this is a Cartesian scale
            (chartConfig.options.scales.y as import('chart.js').ScaleOptionsByType<'linear'>).beginAtZero = updates.yAxisBeginAtZero;
        }
    }

    renderWidgets(currentWidgets);
    saveDashboardState();
}


async function initializeDashboard(): Promise<void> { // Make async
    if (!dashboardGrid) {
        console.error('Dashboard grid element not found. Cannot initialize.');
        return;
    }

    try {
        chartConfigPanel = new ChartConfigPanel('configPanel', handlePanelApply);
    } catch (error) {
        console.error("Failed to initialize ChartConfigPanel:", error);
        return;
    }

    currentWidgets = await initializeWidgetsWithData(); // Await the data loading and widget setup
    renderWidgets(currentWidgets);

    new Sortable(dashboardGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.card-header',
        onEnd: (evt) => {
            if (evt.oldDraggableIndex === undefined || evt.newDraggableIndex === undefined) return;
            const movedItem = currentWidgets.splice(evt.oldDraggableIndex, 1)[0];
            currentWidgets.splice(evt.newDraggableIndex, 0, movedItem);
            saveDashboardState();
        },
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard().catch(error => { // Handle potential errors from async init
        console.error("Error during dashboard initialization:", error);
        // Display a user-friendly error message on the page if needed
        if (dashboardGrid) {
            dashboardGrid.innerHTML = `<div class="alert alert-danger" role="alert">Failed to initialize dashboard. Please try again later.</div>`;
        }
    });
});