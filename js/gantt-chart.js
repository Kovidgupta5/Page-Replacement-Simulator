/**
 * Gantt Chart Visualization using Chart.js
 * Creates horizontal bar chart showing process execution timeline
 */

let ganttChartInstance = null;
let comparisonChartInstance = null;

// Process colors for consistent visualization
const processColors = [
    '#4f46e5', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#06b6d4', // Cyan
];

/**
 * Render Gantt chart for scheduling results
 * @param {Array} ganttData - Array of {process, start, end} objects
 * @param {string} canvasId - Canvas element ID
 */
function renderGanttChart(ganttData, canvasId = 'ganttChart') {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart
    if (ganttChartInstance) {
        ganttChartInstance.destroy();
    }

    if (!ganttData || ganttData.length === 0) {
        return;
    }

    // Prepare chart data
    const datasets = [];
    const processSet = new Set();

    // Get unique processes in order
    ganttData.forEach(segment => processSet.add(segment.process));
    const processes = Array.from(processSet);

    // Create dataset for each process
    processes.forEach((proc, idx) => {
        const color = processColors[idx % processColors.length];
        const segments = ganttData.filter(s => s.process === proc);

        const data = segments.map(s => ({
            x: [s.start, s.end],
            y: proc
        }));

        datasets.push({
            label: proc,
            data: data,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 30
        });
    });

    // Find max time for scale
    const maxTime = Math.max(...ganttData.map(s => s.end));

    // Create chart
    ganttChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: processes,
            datasets: datasets
        },
        config: {
            type: 'bar',
            data: {
                labels: processes,
                datasets: datasets
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const segment = ganttData.find(s =>
                                    s.process === context.label &&
                                    s.start === context.raw.x[0]
                                );
                                return `Time: ${segment.start} - ${segment.end} (Duration: ${segment.end - segment.start}ms)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: 0,
                        max: maxTime + 1,
                        title: {
                            display: true,
                            text: 'Time (ms)',
                            color: '#94a3b8'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 1
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#f1f5f9'
                        },
                        grid: {
                            color: '#334155'
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render comparison bar chart for multiple algorithms
 * @param {Object} comparisonData - Metrics for each algorithm
 * @param {string} canvasId - Canvas element ID
 */
function renderComparisonChart(comparisonData, canvasId = 'comparisonChart') {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing chart
    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }

    const algorithms = Object.keys(comparisonData);
    const algorithmNames = {
        'fcfs': 'FCFS',
        'sjf': 'SJF',
        'srtf': 'SRTF',
        'priority': 'Priority',
        'rr': 'Round Robin',
        'mlq': 'Multilevel'
    };

    const colors = {
        'fcfs': '#4f46e5',
        'sjf': '#10b981',
        'srtf': '#06b6d4',
        'priority': '#f59e0b',
        'rr': '#8b5cf6',
        'mlq': '#ec4899'
    };

    const datasets = [
        {
            label: 'Avg Waiting Time',
            data: algorithms.map(a => comparisonData[a].avgWaitingTime),
            backgroundColor: algorithms.map(a => colors[a] || '#666'),
            borderColor: algorithms.map(a => colors[a] || '#666'),
            borderWidth: 1
        }
    ];

    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: algorithms.map(a => algorithmNames[a] || a),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#f1f5f9'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (ms)',
                        color: '#94a3b8'
                    },
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: '#334155'
                    }
                },
                x: {
                    ticks: {
                        color: '#f1f5f9'
                    },
                    grid: {
                        color: '#334155'
                    }
                }
            }
        }
    });
}

/**
 * Update chart colors based on theme
 */
function updateChartTheme() {
    if (ganttChartInstance) {
        ganttChartInstance.update();
    }
    if (comparisonChartInstance) {
        comparisonChartInstance.update();
    }
}

// Export functions
const GanttChart = {
    renderGanttChart,
    renderComparisonChart,
    updateChartTheme
};
