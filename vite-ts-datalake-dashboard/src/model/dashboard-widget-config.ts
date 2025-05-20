import type { ChartConfiguration } from "chart.js";

export interface DashboardWidgetConfig {
    id: string;
    title: string;
    content: string; // Fallback content or description for the chart
    columnClass: string;
    chartConfig?: ChartConfiguration; // Chart.js configuration object (type, data, options)
}