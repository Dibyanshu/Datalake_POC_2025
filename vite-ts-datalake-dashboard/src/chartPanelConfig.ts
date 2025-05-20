// src/chartPanelConfig.ts
import { Offcanvas } from 'bootstrap';
import type { ChartConfiguration } from 'chart.js'; // We'll need this for type hints
 // We'll need this for type hints

// Interface for the data that main.ts needs to update a widget.
// The panel will provide these details from its form.
export interface PanelWidgetUpdate {
    title: string;
    datasetLabel?: string;       // For the first dataset
    datasetBgColor?: string;     // For the first dataset or first color in array
    datasetBorderColor?: string; // For the first dataset or first color in array
    yAxisBeginAtZero?: boolean;
}

// This is the widget structure the panel needs to read from.
// It's a subset of the full DashboardWidgetConfig from main.ts.
// To avoid circular dependencies or overly complex imports, we define what's needed.
// Alternatively, DashboardWidgetConfig could be in a shared types.ts file.
interface WidgetDataForPanel {
    id: string;
    title: string;
    chartConfig?: ChartConfiguration;
}

export class ChartConfigPanel {
    private panelElement: HTMLElement;
    private offcanvasInstance: Offcanvas;
    private formElement: HTMLFormElement;
    private widgetIdInput: HTMLInputElement;
    private widgetTitleInput: HTMLInputElement;
    private chartSpecificConfigDiv: HTMLElement;
    private datasetLabelInput: HTMLInputElement;
    private datasetBgColorInput: HTMLInputElement;
    private datasetBorderColorInput: HTMLInputElement;
    private yAxisBeginAtZeroInput: HTMLInputElement;

    private currentEditingWidgetId: string | null = null;
    private onApply: (widgetId: string, updates: PanelWidgetUpdate) => void;

    constructor(
        panelId: string,
        onApplyCallback: (widgetId: string, updates: PanelWidgetUpdate) => void
    ) {
        const element = document.getElementById(panelId);
        if (!element) {
            throw new Error(`Configuration panel element with ID "${panelId}" not found.`);
        }
        this.panelElement = element;
        this.offcanvasInstance = new Offcanvas(this.panelElement);
        this.onApply = onApplyCallback;

        // Query for form elements within the panel
        this.formElement = this.panelElement.querySelector('#widgetConfigForm') as HTMLFormElement;
        this.widgetIdInput = this.panelElement.querySelector('#configWidgetId') as HTMLInputElement;
        this.widgetTitleInput = this.panelElement.querySelector('#configWidgetTitle') as HTMLInputElement;
        this.chartSpecificConfigDiv = this.panelElement.querySelector('#chartSpecificConfig') as HTMLElement;
        this.datasetLabelInput = this.panelElement.querySelector('#configDatasetLabel') as HTMLInputElement;
        this.datasetBgColorInput = this.panelElement.querySelector('#configDatasetBgColor') as HTMLInputElement;
        this.datasetBorderColorInput = this.panelElement.querySelector('#configDatasetBorderColor') as HTMLInputElement;
        this.yAxisBeginAtZeroInput = this.panelElement.querySelector('#configYAxisBeginAtZero') as HTMLInputElement;

        if (!this.formElement || !this.widgetIdInput || !this.widgetTitleInput || !this.chartSpecificConfigDiv ||
            !this.datasetLabelInput || !this.datasetBgColorInput || !this.datasetBorderColorInput || !this.yAxisBeginAtZeroInput) {
            throw new Error("One or more form elements within the config panel are missing.");
        }

        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));
    }

    public open(widget: WidgetDataForPanel): void {
        this.currentEditingWidgetId = widget.id;
        this.widgetIdInput.value = widget.id;
        this.widgetTitleInput.value = widget.title;

        const hasChartConfig = !!widget.chartConfig;
        this.chartSpecificConfigDiv.style.display = hasChartConfig ? 'block' : 'none';

        if (hasChartConfig && widget.chartConfig) {
            const firstDataset = widget.chartConfig.data.datasets[0];
            if (firstDataset) {
                this.datasetLabelInput.value = firstDataset.label || '';
                this.datasetBgColorInput.value = this.getColorValue(firstDataset.backgroundColor);
                this.datasetBorderColorInput.value = this.getColorValue(firstDataset.borderColor);
            } else {
                this.datasetLabelInput.value = '';
                this.datasetBgColorInput.value = '';
                this.datasetBorderColorInput.value = '';
            }

            const yScales = widget.chartConfig.options?.scales?.y;
            this.yAxisBeginAtZeroInput.checked = yScales?.beginAtZero || false;

             // Disable Y-axis option for chart types that don't use it
            const yAxisControlGroup = this.yAxisBeginAtZeroInput.closest('.form-check');
            if (widget.chartConfig.type === 'doughnut' || widget.chartConfig.type === 'pie') {
                this.yAxisBeginAtZeroInput.disabled = true;
                if (yAxisControlGroup) yAxisControlGroup.style.display = 'none';
            } else {
                this.yAxisBeginAtZeroInput.disabled = false;
                if (yAxisControlGroup) yAxisControlGroup.style.display = 'block';
            }
        } else {
             // Reset chart fields if no chartConfig
            this.datasetLabelInput.value = '';
            this.datasetBgColorInput.value = '';
            this.datasetBorderColorInput.value = '';
            this.yAxisBeginAtZeroInput.checked = false;
            this.yAxisBeginAtZeroInput.disabled = true;
            const yAxisControlGroup = this.yAxisBeginAtZeroInput.closest('.form-check');
            if (yAxisControlGroup) yAxisControlGroup.style.display = 'none';
        }
        this.offcanvasInstance.show();
    }

    private getColorValue(color: string | string[] | undefined): string {
        if (Array.isArray(color)) {
            return color[0] || ''; // Take first if array
        }
        return (color as string) || '';
    }

    private handleSubmit(event: SubmitEvent): void {
        event.preventDefault();
        if (!this.currentEditingWidgetId) return;

        const updates: PanelWidgetUpdate = {
            title: this.widgetTitleInput.value,
            // Only include chart specific updates if the section was visible (i.e., it's a chart widget)
        };

        if (this.chartSpecificConfigDiv.style.display !== 'none') {
            updates.datasetLabel = this.datasetLabelInput.value;
            updates.datasetBgColor = this.datasetBgColorInput.value;
            updates.datasetBorderColor = this.datasetBorderColorInput.value;
            updates.yAxisBeginAtZero = this.yAxisBeginAtZeroInput.checked && !this.yAxisBeginAtZeroInput.disabled;
        }

        this.onApply(this.currentEditingWidgetId, updates);
        this.offcanvasInstance.hide();
        this.currentEditingWidgetId = null;
    }

    public hide(): void {
        this.offcanvasInstance.hide();
    }
}