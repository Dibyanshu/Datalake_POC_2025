// src/chartPanelConfig.ts
import { Offcanvas } from 'bootstrap';
import type { ChartConfiguration } from 'chart.js';

export interface PanelWidgetUpdate {
    title: string;
    datasetLabel?: string;
    // These will now potentially apply to a specific index
    datasetBgColor?: string;
    datasetBorderColor?: string;
    selectedColorIndex?: number; // Index of the slice/bar being styled
    yAxisBeginAtZero?: boolean;
}

interface WidgetDataForPanel {
    id: string;
    title: string;
    chartConfig?: ChartConfiguration;
}

function rgbaToHex(rgba: string): string {
    if (rgba.startsWith('#')) return rgba; // Already hex
    if (!rgba.startsWith('rgba')) return '#000000'; // Default if not rgba or hex

    const parts = rgba.substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')')).split(/,\s*/);
    if (parts.length < 3) return '#000000'; // Invalid rgba

    const r = parseInt(parts[0], 10).toString(16).padStart(2, '0');
    const g = parseInt(parts[1], 10).toString(16).padStart(2, '0');
    const b = parseInt(parts[2], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

export class ChartConfigPanel {
    private panelElement: HTMLElement;
    private offcanvasInstance: Offcanvas;
    private formElement: HTMLFormElement;
    private widgetIdInput: HTMLInputElement;
    private widgetTitleInput: HTMLInputElement;
    private chartSpecificConfigDiv: HTMLElement;
    private datasetLabelInput: HTMLInputElement;

    // New elements for slice/bar selection and color
    private sliceSelectorGroup: HTMLElement;
    private sliceIndexSelect: HTMLSelectElement;
    private datasetBgColorInput: HTMLInputElement;
    private datasetBorderColorInput: HTMLInputElement;
    private bgColorHelpText: HTMLElement;
    private borderColorHelpText: HTMLElement;

    private yAxisBeginAtZeroInput: HTMLInputElement;
    private yAxisBeginAtZeroGroup: HTMLElement;


    private currentEditingWidgetData: WidgetDataForPanel | null = null; // Store full widget data for easier access
    private onApply: (widgetId: string, updates: PanelWidgetUpdate) => void;

    constructor(
        panelId: string,
        onApplyCallback: (widgetId: string, updates: PanelWidgetUpdate) => void
    ) {
        const element = document.getElementById(panelId);
        if (!element) throw new Error(`Configuration panel element with ID "${panelId}" not found.`);
        this.panelElement = element;
        this.offcanvasInstance = new Offcanvas(this.panelElement);
        this.onApply = onApplyCallback;

        this.formElement = this.panelElement.querySelector('#widgetConfigForm') as HTMLFormElement;
        this.widgetIdInput = this.panelElement.querySelector('#configWidgetId') as HTMLInputElement;
        this.widgetTitleInput = this.panelElement.querySelector('#configWidgetTitle') as HTMLInputElement;
        this.chartSpecificConfigDiv = this.panelElement.querySelector('#chartSpecificConfig') as HTMLElement;
        this.datasetLabelInput = this.panelElement.querySelector('#configDatasetLabel') as HTMLInputElement;

        this.sliceSelectorGroup = this.panelElement.querySelector('#configSliceSelectorGroup') as HTMLElement;
        this.sliceIndexSelect = this.panelElement.querySelector('#configSliceIndex') as HTMLSelectElement;
        this.datasetBgColorInput = this.panelElement.querySelector('#configDatasetBgColor') as HTMLInputElement;
        this.datasetBorderColorInput = this.panelElement.querySelector('#configDatasetBorderColor') as HTMLInputElement;
        this.bgColorHelpText = this.panelElement.querySelector('#bgColorHelpText') as HTMLElement;
        this.borderColorHelpText = this.panelElement.querySelector('#borderColorHelpText') as HTMLElement;

        this.yAxisBeginAtZeroInput = this.panelElement.querySelector('#configYAxisBeginAtZero') as HTMLInputElement;
        this.yAxisBeginAtZeroGroup = this.panelElement.querySelector('#yAxisBeginAtZeroGroup') as HTMLElement;


        if (!this.formElement || !this.widgetIdInput || !this.widgetTitleInput || !this.chartSpecificConfigDiv ||
            !this.datasetLabelInput || !this.sliceSelectorGroup || !this.sliceIndexSelect ||
            !this.datasetBgColorInput || !this.datasetBorderColorInput || !this.bgColorHelpText ||
            !this.borderColorHelpText || !this.yAxisBeginAtZeroInput || !this.yAxisBeginAtZeroGroup
        ) {
            throw new Error("One or more form elements within the config panel are missing.");
        }

        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));
        this.sliceIndexSelect.addEventListener('change', this.handleSliceSelectionChange.bind(this));
    }

    public open(widget: WidgetDataForPanel): void {
        this.currentEditingWidgetData = widget; // Store the widget data
        this.widgetIdInput.value = widget.id;
        this.widgetTitleInput.value = widget.title;

        const hasChartConfig = !!widget.chartConfig;
        this.chartSpecificConfigDiv.style.display = hasChartConfig ? 'block' : 'none';

        if (hasChartConfig && widget.chartConfig) {
            const chart = widget.chartConfig;
            const firstDataset = chart.data.datasets[0];

            this.datasetLabelInput.value = firstDataset?.label || '';

            // Populate slice/bar selector
            this.populateSliceSelector(
                firstDataset?.data?.length || 0,
                Array.isArray(chart.data.labels)
                    ? chart.data.labels.filter(
                        (l): l is string | number | Date =>
                            typeof l === 'string' || typeof l === 'number' || l instanceof Date
                    )
                    : undefined
            );

            // Show/hide slice selector based on chart type
            // Useful for Pie, Doughnut, and potentially Bar charts if we want individual bar styling
            if (chart.type === 'pie' || chart.type === 'doughnut' || chart.type === 'bar') {
                this.sliceSelectorGroup.style.display = (firstDataset?.data?.length || 0) > 0 ? 'block' : 'none';
            } else {
                this.sliceSelectorGroup.style.display = 'none';
            }

            // Update color fields based on the (newly set) selected slice/bar index
            this.updateColorFieldsForSelectedSlice();


            const yScales = chart.options?.scales?.y;
            this.yAxisBeginAtZeroInput.checked = typeof (yScales as any)?.beginAtZero === 'boolean' ? (yScales as any).beginAtZero : false;

            if (chart.type === 'doughnut' || chart.type === 'pie') {
                this.yAxisBeginAtZeroInput.disabled = true;
                this.yAxisBeginAtZeroGroup.style.display = 'none';
            } else {
                this.yAxisBeginAtZeroInput.disabled = false;
                this.yAxisBeginAtZeroGroup.style.display = 'block';
            }
        } else {
            this.sliceSelectorGroup.style.display = 'none';
            this.datasetLabelInput.value = '';
            this.datasetBgColorInput.value = '#000000'; // Default hex for color picker
            this.datasetBorderColorInput.value = '#000000'; // Default hex for color picker
            this.yAxisBeginAtZeroInput.checked = false;
            this.yAxisBeginAtZeroGroup.style.display = 'none';
            this.bgColorHelpText.textContent = 'For the selected slice/bar.'; // Reset help text
            this.borderColorHelpText.textContent = 'For the selected slice/bar.'; // Reset help text
        }
        this.offcanvasInstance.show();
    }

    private populateSliceSelector(dataLength: number, labels?: (string | number | Date)[]): void {
        this.sliceIndexSelect.innerHTML = ''; // Clear existing options
        if (dataLength === 0) {
            this.sliceSelectorGroup.style.display = 'none';
            return;
        }

        for (let i = 0; i < dataLength; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            const labelText = labels && labels[i] ? labels[i].toString() : `Item ${i + 1}`;
            option.textContent = `${i}: ${labelText}`;
            this.sliceIndexSelect.appendChild(option);
        }
        // Default to the first slice/bar if available
        if (dataLength > 0) {
            this.sliceIndexSelect.value = "0";
        }
    }

    private handleSliceSelectionChange(): void {
        this.updateColorFieldsForSelectedSlice();
    }

    private updateColorFieldsForSelectedSlice(): void {
        if (!this.currentEditingWidgetData || !this.currentEditingWidgetData.chartConfig) return;

        const chartConfig = this.currentEditingWidgetData.chartConfig;
        const firstDataset = chartConfig.data.datasets[0];
        if (!firstDataset) return;

        const selectedIndex = parseInt(this.sliceIndexSelect.value, 10);
        const isSliceSelectorVisible = this.sliceSelectorGroup.style.display !== 'none';

        let currentBgColor = '#563d7c'; // Default picker color
        let currentBorderColor = '#563d7c'; // Default picker color

        if (isSliceSelectorVisible && !isNaN(selectedIndex) && firstDataset.data && selectedIndex < firstDataset.data.length) {
            const bgColors = Array.isArray(firstDataset.backgroundColor) ? firstDataset.backgroundColor : [firstDataset.backgroundColor];
            const borderColors = Array.isArray(firstDataset.borderColor) ? firstDataset.borderColor : [firstDataset.borderColor];

            const rawBgColor = (bgColors[selectedIndex] as string) || '';
            const rawBorderColor = (borderColors[selectedIndex] as string) || '';

            currentBgColor = rgbaToHex(rawBgColor) || '#563d7c'; // Convert to HEX for picker
            currentBorderColor = rgbaToHex(rawBorderColor) || '#563d7c'; // Convert to HEX for picker

            const selectedLabel = chartConfig.data.labels?.[selectedIndex] || `Item ${selectedIndex + 1}`;
            this.bgColorHelpText.textContent = `Background for: ${selectedLabel}`;
            this.borderColorHelpText.textContent = `Border for: ${selectedLabel}`;
        } else {
            // Overall dataset color
            const rawBgColor = this.getColorValue(firstDataset.backgroundColor);
            const rawBorderColor = this.getColorValue(firstDataset.borderColor);

            currentBgColor = rgbaToHex(rawBgColor) || '#563d7c'; // Convert to HEX
            currentBorderColor = rgbaToHex(rawBorderColor) || '#563d7c'; // Convert to HEX

            this.bgColorHelpText.textContent = 'Overall background color.';
            this.borderColorHelpText.textContent = 'Overall border color.';
        }
        this.datasetBgColorInput.value = currentBgColor;
        this.datasetBorderColorInput.value = currentBorderColor;
    }

    private getColorValue(
        color:
            | string
            | string[]
            | undefined
            | ((...args: any[]) => any)
            | object
            | null
    ): string {
        // Only handle string or string[]; otherwise return empty string
        if (Array.isArray(color)) {
            return color[0] || '';
        }
        if (typeof color === 'string') {
            return color;
        }
        return '';
    }

    private handleSubmit(event: SubmitEvent): void {
        event.preventDefault();
        if (!this.currentEditingWidgetData) return;

        const widgetId = this.currentEditingWidgetData.id;
        const updates: PanelWidgetUpdate = {
            title: this.widgetTitleInput.value,
        };

        if (this.chartSpecificConfigDiv.style.display !== 'none') {
            updates.datasetLabel = this.datasetLabelInput.value;
            // Values from <input type="color"> are already in hex format (e.g., #RRGGBB)
            // Chart.js can typically consume these directly.
            updates.datasetBgColor = this.datasetBgColorInput.value;
            updates.datasetBorderColor = this.datasetBorderColorInput.value;

            if (this.sliceSelectorGroup.style.display !== 'none') {
                updates.selectedColorIndex = parseInt(this.sliceIndexSelect.value, 10);
            }
            updates.yAxisBeginAtZero = this.yAxisBeginAtZeroInput.checked && !this.yAxisBeginAtZeroInput.disabled;
        }

        this.onApply(widgetId, updates);
        this.offcanvasInstance.hide();
        this.currentEditingWidgetData = null;
    }

    public hide(): void {
        this.offcanvasInstance.hide();
    }
}