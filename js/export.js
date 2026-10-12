/**
 * Export Functionality - CSV and PDF
 */

let lastResults = null;

/**
 * Store results for export
 * @param {Object} results - Simulation results
 */
function storeResultsForExport(results) {
    lastResults = results;
}

/**
 * Export simulation results to CSV
 */
function exportToCSV() {
    if (!lastResults) {
        alert('Please run a simulation first!');
        return;
    }

    const { processes, metrics, algorithm } = lastResults;

    // Create CSV content
    let csv = 'CPU Scheduling Simulator Results\n';
    csv += `Algorithm: ${algorithm}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Process details
    csv += 'Process Details\n';
    csv += 'Process ID,Arrival Time,Burst Time,Priority,Completion Time,Turnaround Time,Waiting Time,Response Time\n';

    processes.forEach(p => {
        csv += `${p.pid},${p.arrival},${p.burst},${p.priority},${p.completionTime || 'N/A'},${p.turnaround || 'N/A'},${p.waiting || 'N/A'},${p.response || 'N/A'}\n`;
    });

    // Metrics summary
    csv += '\nPerformance Metrics\n';
    csv += `Metric,Value\n`;
    csv += `Average Waiting Time,${metrics.avgWaitingTime.toFixed(2)} ms\n`;
    csv += `Average Turnaround Time,${metrics.avgTurnaroundTime.toFixed(2)} ms\n`;
    csv += `Average Response Time,${metrics.avgResponseTime.toFixed(2)} ms\n`;
    csv += `CPU Utilization,${metrics.cpuUtilization}%\n`;
    csv += `Throughput,${metrics.throughput} processes/ms\n`;

    // Download
    downloadFile(csv, `cpu-scheduling-${algorithm}-${Date.now()}.csv`, 'text/csv');
}

/**
 * Export simulation results to PDF
 */
async function exportToPDF() {
    if (!lastResults) {
        alert('Please run a simulation first!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const { processes, metrics, algorithm, ganttData } = lastResults;

    // Create PDF
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text('CPU Scheduling Simulator', pageWidth / 2, 15, { align: 'center' });

    // Algorithm
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Algorithm: ${algorithm.toUpperCase()}`, pageWidth / 2, 22, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    // Capture chart
    try {
        const chartCanvas = document.getElementById('ganttChart');
        if (chartCanvas) {
            const chartImage = await html2canvas(document.getElementById('chartContainer'), {
                backgroundColor: '#1e293b',
                scale: 1
            });
            const chartImgData = chartCanvas.toDataURL('image/png');
            doc.addImage(chartImgData, 'PNG', 10, 35, pageWidth - 20, 50);
        }
    } catch (e) {
        console.log('Chart export skipped:', e);
    }

    // Process table
    let yPos = 90;
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text('Process Details', 10, yPos);
    yPos += 8;

    // Table header
    doc.setFontSize(9);
    doc.setTextColor(100);
    const headers = ['Process', 'Arrival', 'Burst', 'Completion', 'TAT', 'Waiting', 'Response'];
    const colWidths = [20, 20, 20, 25, 25, 25, 25];
    let xPos = 10;

    headers.forEach((h, i) => {
        doc.text(h, xPos, yPos);
        xPos += colWidths[i];
    });

    // Table rows
    yPos += 7;
    doc.setTextColor(0);
    processes.forEach(p => {
        xPos = 10;
        const row = [
            p.pid,
            p.arrival,
            p.burst,
            p.completionTime || 'N/A',
            (p.turnaround || 0).toFixed(2),
            (p.waiting || 0).toFixed(2),
            (p.response || 0).toFixed(2)
        ];
        row.forEach((cell, i) => {
            doc.text(String(cell), xPos, yPos);
            xPos += colWidths[i];
        });
        yPos += 6;
    });

    // Metrics
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text('Performance Metrics', 10, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0);
    const metricList = [
        `Average Waiting Time: ${metrics.avgWaitingTime.toFixed(2)} ms`,
        `Average Turnaround Time: ${metrics.avgTurnaroundTime.toFixed(2)} ms`,
        `Average Response Time: ${metrics.avgResponseTime.toFixed(2)} ms`,
        `CPU Utilization: ${metrics.cpuUtilization}%`,
        `Throughput: ${metrics.throughput} processes/ms`
    ];

    metricList.forEach(m => {
        doc.text(m, 10, yPos);
        yPos += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Educational CPU Scheduling Simulator', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save
    doc.save(`cpu-scheduling-${algorithm}-${Date.now()}.pdf`);
}

/**
 * Export comparison results to CSV
 */
function exportComparisonToCSV(comparisonResults) {
    let csv = 'CPU Scheduling Algorithm Comparison\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    csv += 'Algorithm,Avg Waiting Time,Avg Turnaround Time,Avg Response Time,CPU Utilization,Throughput\n';

    Object.entries(comparisonResults).forEach(([key, result]) => {
        const m = result.metrics;
        csv += `${key.toUpperCase()},${m.avgWaitingTime.toFixed(2)},${m.avgTurnaroundTime.toFixed(2)},${m.avgResponseTime.toFixed(2)},${m.cpuUtilization}%,${m.throughput}\n`;
    });

    downloadFile(csv, `cpu-scheduling-comparison-${Date.now()}.csv`, 'text/csv');
}

/**
 * Helper function to download file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export functions
const ExportTool = {
    storeResultsForExport,
    exportToCSV,
    exportToPDF,
    exportComparisonToCSV,
    downloadFile
};
