// src/main.ts
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sortable from 'sortablejs';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import './style.css';
import { dashboardWidgetsConfig as initialWidgets } from './dashboardWidgetConfig'; // Import the model
import { ChartConfigPanel, type PanelWidgetUpdate } from './chartPanelConfig'; // Import new module

Chart.register(...registerables);

const DASHBOARD_STATE_KEY = 'dashboardState';

// Make DashboardWidgetConfig exportable if ChartConfigPanel needs the full type,
// but for now, ChartConfigPanel defines its own `WidgetDataForPanel` which is a subset.
export interface DashboardWidgetConfig { // Export if needed by other modules directly
    id: string;
    title: string;
    content: string;
    columnClass: string;
    chartConfig?: ChartConfiguration;
}

// --- Global State & DOM Elements ---
const dashboardGrid = document.getElementById('dashboard-grid');
let currentWidgets: DashboardWidgetConfig[] = [];
const activeCharts: Map<string, Chart> = new Map();
let chartConfigPanel: ChartConfigPanel; // Instance of our new panel class

/**
 * Creates an HTML element for a single widget.
 */
function createWidgetElement(widget: DashboardWidgetConfig): HTMLElement {
    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = `dashboard-widget ${widget.columnClass} mb-3`;
    widgetWrapper.setAttribute('data-id', widget.id);

    let chartCanvasHtml = '';
    let configureButtonHtml = ''; // This will hold the button HTML string

    // Only add the configure button if the widget has chartConfig
    if (widget.chartConfig) {
        chartCanvasHtml = `
            <div class="chart-container mt-2" style="position: relative; height:250px; width:100%;">
                <canvas id="chart-${widget.id}"></canvas>
            </div>`;

        // THE IMPORTANT PART: HTML for the configure button
        // It uses Bootstrap Icons (bi-gear-fill) and has the class 'widget-configure-btn'
        // It does NOT directly use data-bs-toggle or data-bs-target here,
        // because the click is handled by JavaScript to call chartConfigPanel.open()
        configureButtonHtml = `
            <button type="button" class="btn btn-sm btn-outline-secondary widget-configure-btn" title="Configure Widget">
                <i class="bi bi-gear-fill"></i>
            </button>
        `;
    }

    widgetWrapper.innerHTML = `
        <div class="card h-100">
            <div class="card-header"> <!-- Bootstrap card-header -->
                <h5 class="card-title mb-0">${widget.title}
                    ${configureButtonHtml} <!-- Insert the button HTML here -->
                </h5>
            </div>
            <div class="card-body d-flex flex-column">
                ${widget.content ? `<p class="card-text">${widget.content}</p>` : ''}
                ${chartCanvasHtml}
            </div>
        </div>
    `;

    // Add event listener for the dynamically created configure button
    const configureBtnElement = widgetWrapper.querySelector('.widget-configure-btn');
    if (configureBtnElement) {
        configureBtnElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card header drag or other parent event handlers

            // Find the full widget data from currentWidgets to pass to the panel
            // The 'widget' passed to createWidgetElement is the correct one here.
            if (widget) { // We already have the widget object for this specific element
                chartConfigPanel.open(widget); // Use the panel instance and pass the widget data
            } else {
                console.error("Could not find widget data for configure button.");
            }
        });
    }
    return widgetWrapper;
}

/**
 * Renders all widgets and initializes charts.
 */
function renderWidgets(widgetsToRender: DashboardWidgetConfig[]): void {
    // ... (renderWidgets implementation remains the same as before)
    if (!dashboardGrid) return;
    dashboardGrid.innerHTML = '';

    activeCharts.forEach(chart => chart.destroy());
    activeCharts.clear();

    widgetsToRender.forEach(widget => {
        const widgetEl = createWidgetElement(widget);
        dashboardGrid.appendChild(widgetEl);

        if (widget.chartConfig) {
            const canvas = document.getElementById(`chart-${widget.id}`) as HTMLCanvasElement | null;
            if (canvas) {
                const chartInstance = new Chart(canvas, widget.chartConfig);
                activeCharts.set(widget.id, chartInstance);
            }
        }
    });
}

/**
 * Saves the entire dashboard state to localStorage.
 */
function saveDashboardState(): void {
    // ... (saveDashboardState implementation remains the same)
    localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(currentWidgets));
    console.log('Dashboard state saved:', currentWidgets);
}

/**
 * Loads the dashboard state from localStorage.
 */
function loadDashboardState(): DashboardWidgetConfig[] {
    // ... (loadDashboardState implementation remains the same)
    const savedStateJSON = localStorage.getItem(DASHBOARD_STATE_KEY);
    if (savedStateJSON) {
        try {
            const savedWidgets: DashboardWidgetConfig[] = JSON.parse(savedStateJSON);
            if (Array.isArray(savedWidgets) && savedWidgets.every(w => w.id)) {
                const initialWidgetsMap = new Map(initialWidgets.map(w => [w.id, JSON.parse(JSON.stringify(w))]));
                const reconciledWidgets = savedWidgets.map(savedWidget => {
                    const initialDef = initialWidgetsMap.get(savedWidget.id);
                    if (initialDef) {
                        return { ...initialDef, ...savedWidget };
                    }
                    return savedWidget;
                }).filter(Boolean) as DashboardWidgetConfig[];

                initialWidgetsMap.forEach((initialWidget, id) => {
                    if (!reconciledWidgets.find(rw => rw.id === id)) {
                        reconciledWidgets.push(initialWidget);
                    }
                });
                return reconciledWidgets;
            }
        } catch (e) {
            console.error('Error parsing saved dashboard state:', e);
            localStorage.removeItem(DASHBOARD_STATE_KEY);
        }
    }
    return initialWidgets.map(w => JSON.parse(JSON.stringify(w)));
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

    if (widgetToUpdate.chartConfig && widgetToUpdate.chartConfig.data.datasets[0]) {
        const chartConfig = widgetToUpdate.chartConfig;
        const dataset = chartConfig.data.datasets[0];

        if (updates.datasetLabel !== undefined) dataset.label = updates.datasetLabel;

        // Ensure colors are arrays if we are styling a specific slice/bar
        // or if the chart type typically uses arrays (pie/doughnut)
        const needsColorArray = (chartConfig.type === 'pie' || chartConfig.type === 'doughnut') ||
                                (updates.selectedColorIndex !== undefined && updates.selectedColorIndex >= 0);

        if (needsColorArray) {
            if (!Array.isArray(dataset.backgroundColor)) {
                // Convert to array, repeating the single color or initializing with placeholders
                const singleColor = dataset.backgroundColor || 'rgba(200, 200, 200, 0.5)'; // Default placeholder
                dataset.backgroundColor = new Array(dataset.data?.length || 1).fill(singleColor);
            }
            if (!Array.isArray(dataset.borderColor)) {
                const singleColor = dataset.borderColor || 'rgba(100, 100, 100, 1)'; // Default placeholder
                dataset.borderColor = new Array(dataset.data?.length || 1).fill(singleColor);
            }
        }

        if (updates.selectedColorIndex !== undefined && updates.selectedColorIndex >= 0) {
            // Apply to specific index
            const idx = updates.selectedColorIndex;
            if (Array.isArray(dataset.backgroundColor) && idx < dataset.backgroundColor.length) {
                if (updates.datasetBgColor !== undefined) dataset.backgroundColor[idx] = updates.datasetBgColor;
            }
            if (Array.isArray(dataset.borderColor) && idx < dataset.borderColor.length) {
                if (updates.datasetBorderColor !== undefined) dataset.borderColor[idx] = updates.datasetBorderColor;
            }
        } else {
            // Apply as single color (or first element if it somehow became an array for a non-slice chart)
            if (updates.datasetBgColor !== undefined) {
                dataset.backgroundColor = Array.isArray(dataset.backgroundColor) ? [updates.datasetBgColor, ...dataset.backgroundColor.slice(1)] : updates.datasetBgColor;
            }
            if (updates.datasetBorderColor !== undefined) {
                dataset.borderColor = Array.isArray(dataset.borderColor) ? [updates.datasetBorderColor, ...dataset.borderColor.slice(1)] : updates.datasetBorderColor;
            }
        }


        if (!chartConfig.options) chartConfig.options = {};
        if (!chartConfig.options.scales) chartConfig.options.scales = {};
        if (!chartConfig.options.scales.y) chartConfig.options.scales.y = {};

        if (updates.yAxisBeginAtZero !== undefined &&
            chartConfig.type !== 'doughnut' &&
            chartConfig.type !== 'pie') {
            // Chart.js v3+ supports multiple scale types; set beginAtZero only for linear scale
            if (!chartConfig.options.scales.y) {
                chartConfig.options.scales.y = {};
            }
            (chartConfig.options.scales.y as any).beginAtZero = updates.yAxisBeginAtZero;
        }
    }

    renderWidgets(currentWidgets);
    saveDashboardState();
}


// --- Initialization ---
function initializeDashboard(): void {
    if (!dashboardGrid) {
        console.error('Dashboard grid element not found. Cannot initialize.');
        return;
    }

    // Initialize the Chart Configuration Panel
    try {
        chartConfigPanel = new ChartConfigPanel('configPanel', handlePanelApply);
    } catch (error) {
        console.error("Failed to initialize ChartConfigPanel:", error);
        // Potentially display an error to the user or disable config functionality
        return; // Stop initialization if panel fails
    }

    currentWidgets = loadDashboardState();
    renderWidgets(currentWidgets);

    new Sortable(dashboardGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        // ... (rest of SortableJS config as before)
        handle: '.card-header',
        onEnd: (evt) => {
            if (evt.oldDraggableIndex === undefined || evt.newDraggableIndex === undefined) return;
            const movedItem = currentWidgets.splice(evt.oldDraggableIndex, 1)[0];
            currentWidgets.splice(evt.newDraggableIndex, 0, movedItem);
            saveDashboardState();
        },
    });

    // The form submission is now handled within ChartConfigPanel
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});