import type { DashboardWidgetConfig } from "./model/dashboard-widget-config";

export const dashboardWidgetsConfig: DashboardWidgetConfig[] = [
    {
        id: 'widget-analytics',
        title: 'Website Visits',
        content: 'Monthly visits to the website.',
        columnClass: 'col-md-6 col-lg-4',
        chartConfig: {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: '# of Visits',
                    data: [1200, 1900, 3000, 5000, 2300, 3200],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Important for fitting chart in card
                scales: { y: { beginAtZero: true } }
            }
        }
    },
    {
        id: 'widget-sales',
        title: 'Sales Distribution',
        content: 'Sales by product category.',
        columnClass: 'col-md-6 col-lg-4',
        chartConfig: {
            type: 'doughnut',
            data: {
                labels: ['Electronics', 'Books', 'Clothing', 'Home Goods'],
                datasets: [{
                    label: 'Sales ($)',
                    data: [300, 150, 200, 180],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false, text: 'Sales Categories' } // Can add chart-specific title
                }
            }
        }
    },
    {
        id: 'widget-activity',
        title: 'User Activity',
        content: 'Feed of latest user actions. This widget does not have a chart.',
        columnClass: 'col-md-12 col-lg-4' // Full width on medium, 1/3 on large
    },
    {
        id: 'widget-tasks',
        title: 'Open Tasks',
        content: 'You have 5 open tasks.',
        columnClass: 'col-md-6 col-lg-3'
    },
    {
        id: 'widget-server',
        title: 'Server Status (Line)',
        content: 'CPU Utilization over time.',
        columnClass: 'col-md-6 col-lg-9', // Wider widget
        chartConfig: {
            type: 'line',
            data: {
                labels: ['12:00', '12:05', '12:10', '12:15', '12:20', '12:25', '12:30'],
                datasets: [{
                    label: 'CPU %',
                    data: [15, 20, 18, 25, 22, 30, 28],
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.1,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        }
    },
];