import type { ChartType } from 'chart.js';

// Interface for the raw chart data structure from our JSON
export interface RawChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    tension?: number; // For line charts
    fill?: boolean;   // For line charts
}

export interface RawChartConfig {
    type: ChartType; // 'bar', 'line', 'doughnut', etc.
    labels: string[];
    datasets: RawChartDataset[];
}

// Interface for the entire JSON response
export interface AllChartDataResponse {
    [widgetId: string]: RawChartConfig;
}

const API_URL = '/mock-chart-data.json'; // Path to our mock data in the public folder

/**
 * Fetches all chart data configurations from the mock JSON file.
 * In a real app, this would fetch from a backend API.
 */
export async function fetchAllChartData(): Promise<AllChartDataResponse> {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} when fetching ${API_URL}`);
        }
        const data: AllChartDataResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch chart data:", error);
        // Return an empty object or re-throw to let the caller handle it
        // For this example, returning an empty object to prevent app crash
        return {};
    }
}

/**
 * Fetches chart data for a specific widget ID.
 */
export async function fetchChartDataForWidget(widgetId: string): Promise<RawChartConfig | null> {
    try {
        const allData = await fetchAllChartData();
        return allData[widgetId] || null;
    } catch (error) {
        console.error(`Failed to fetch chart data for widget ${widgetId}:`, error);
        return null;
    }
}