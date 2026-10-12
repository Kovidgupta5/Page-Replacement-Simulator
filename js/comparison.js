/**
 * Algorithm Comparison and CFS Scheduler Analysis
 */

/**
 * Run all algorithms and collect results
 * @param {Array} processes - Input processes
 * @returns {Object} Results for each algorithm
 */
function runAllAlgorithms(processes) {
    const results = {};
    const quantum = 2;
    const mlqThreshold = 4;

    // FCFS
    const fcfsResult = SchedulingAlgorithms.fcfs(processes);
    results.fcfs = {
        ganttData: fcfsResult.ganttData,
        processes: fcfsResult.processes,
        metrics: MetricsCalculator.calculateMetrics(
            fcfsResult.processes,
            Math.max(...fcfsResult.ganttData.map(g => g.end))
        )
    };

    // SJF
    const sjfResult = SchedulingAlgorithms.sjf(processes);
    results.sjf = {
        ganttData: sjfResult.ganttData,
        processes: sjfResult.processes,
        metrics: MetricsCalculator.calculateMetrics(
            sjfResult.processes,
            Math.max(...sjfResult.ganttData.map(g => g.end))
        )
    };

    // SRTF
    const srtfResult = SchedulingAlgorithms.srtf(processes);
    results.srtf = {
        ganttData: srtfResult.ganttData,
        processes: srtfResult.processes,
        metrics: MetricsCalculator.calculateMetrics(
            srtfResult.processes,
            Math.max(...srtfResult.ganttData.map(g => g.end))
        )
    };

    // Priority
    const priorityResult = SchedulingAlgorithms.priority(processes);
    results.priority = {
        ganttData: priorityResult.ganttData,
        processes: priorityResult.processes,
        metrics: MetricsCalculator.calculateMetrics(
            priorityResult.processes,
            Math.max(...priorityResult.ganttData.map(g => g.end))
        )
    };

    // Round Robin
    const rrResult = SchedulingAlgorithms.roundRobin(processes, quantum);
    results.rr = {
        ganttData: rrResult.ganttData,
        processes: rrResult.processes,
        metrics: MetricsCalculator.calculateMetrics(
            rrResult.processes,
            Math.max(...rrResult.ganttData.map(g => g.end))
        )
    };

    // Multilevel Queue
    const mlqResult = SchedulingAlgorithms.multilevelQueue(processes, mlqThreshold);
    results.mlq = {
        ganttData: mlqResult.ganttData,
        processes: mlqResult.processes,
        metrics: MetricsCalculator.calculateMetrics(
            mlqResult.processes,
            Math.max(...mlqResult.ganttData.map(g => g.end))
        )
    };

    return results;
}

/**
 * Generate comparison table HTML
 * @param {Object} results - Results from all algorithms
 * @returns {string} HTML table
 */
function generateComparisonTable(results) {
    const algorithmNames = {
        'fcfs': 'FCFS',
        'sjf': 'SJF (Non-preemptive)',
        'srtf': 'SRTF (Preemptive SJF)',
        'priority': 'Priority (Non-preemptive)',
        'rr': 'Round Robin (Q=2)',
        'mlq': 'Multilevel Queue'
    };

    let html = '';
    let bestWaiting = Infinity;
    let bestTurnaround = Infinity;
    let bestResponse = Infinity;

    // Find best values
    Object.values(results).forEach(r => {
        bestWaiting = Math.min(bestWaiting, r.metrics.avgWaitingTime);
        bestTurnaround = Math.min(bestTurnaround, r.metrics.avgTurnaroundTime);
        bestResponse = Math.min(bestResponse, r.metrics.avgResponseTime);
    });

    Object.entries(results).forEach(([key, result]) => {
        const m = result.metrics;
        const isBestWaiting = Math.abs(m.avgWaitingTime - bestWaiting) < 0.01;
        const isBestTurnaround = Math.abs(m.avgTurnaroundTime - bestTurnaround) < 0.01;
        const isBestResponse = Math.abs(m.avgResponseTime - bestResponse) < 0.01;

        html += `
            <tr class="${isBestWaiting || isBestTurnaround || isBestResponse ? 'best-value' : ''}">
                <td><strong>${algorithmNames[key]}</strong></td>
                <td class="${isBestWaiting ? 'highlight' : ''}">${m.avgWaitingTime.toFixed(2)} ms</td>
                <td class="${isBestTurnaround ? 'highlight' : ''}">${m.avgTurnaroundTime.toFixed(2)} ms</td>
                <td class="${isBestResponse ? 'highlight' : ''}">${m.avgResponseTime.toFixed(2)} ms</td>
                <td>${m.cpuUtilization}%</td>
                <td>${m.throughput} proc/ms</td>
            </tr>
        `;
    });

    return html;
}

/**
 * Get CFS scheduler comparison data
 * @returns {Object} CFS comparison information
 */
function getCFSComparison() {
    return {
        title: 'Traditional vs CFS Scheduler',
        description: 'Comparison of traditional scheduling algorithms with Linux/Android CFS',
        differences: [
            {
                aspect: 'Scheduling Basis',
                traditional: 'Fixed priorities or time slices',
                cfs: 'Virtual runtime (vruntime) - dynamic allocation'
            },
            {
                aspect: 'Fairness',
                traditional: 'May cause starvation (Priority, SJF)',
                cfs: 'Guarantees fairness - lowest vruntime runs first'
            },
            {
                aspect: 'Complexity',
                traditional: 'O(n) to O(n log n) depending on algorithm',
                cfs: 'O(log n) using red-black tree'
            },
            {
                aspect: 'Context Switches',
                traditional: 'Fixed (RR) or variable',
                cfs: 'Minimized for battery efficiency'
            },
            {
                aspect: 'Use Case',
                traditional: 'General purpose, batch processing',
                cfs: 'Interactive systems, mobile devices'
            }
        ],
        advantages: [
            'Better battery life on mobile devices',
            'Improved responsiveness for interactive apps',
            'Automatic I/O priority boosting',
            'Fair CPU distribution among all processes',
            'Scalable to many cores'
        ]
    };
}

/**
 * Simulate CFS-like behavior for comparison
 * @param {Array} processes - Input processes
 * @returns {Object} Simulated CFS metrics
 */
function simulateCFS(processes) {
    // Simplified CFS simulation
    // In reality, CFS uses vruntime and red-black trees
    const procs = processes.map(p => ({
        ...p,
        vruntime: 0,
        weight: 1024 / p.priority, // Nice value weight approximation
        remaining: p.burst
    }));

    let currentTime = 0;
    const targetLatency = 12; // ms - typical CFS target
    const minGranularity = 1.5; // ms

    while (procs.some(p => p.remaining > 0)) {
        const runnable = procs.filter(p => p.arrival <= currentTime && p.remaining > 0);

        if (runnable.length === 0) {
            const nextArrival = procs.filter(p => p.remaining > 0)
                .reduce((min, p) => Math.min(min, p.arrival), Infinity);
            currentTime = nextArrival;
            continue;
        }

        // Select process with lowest vruntime
        runnable.sort((a, b) => a.vruntime - b.vruntime);
        const selected = runnable[0];

        // Calculate time slice based on weight
        const totalWeight = runnable.reduce((sum, p) => sum + p.weight, 0);
        let timeSlice = (selected.weight / totalWeight) * targetLatency;
        timeSlice = Math.max(minGranularity, Math.min(timeSlice, selected.remaining));

        // Update vruntime (simplified)
        selected.vruntime += timeSlice / selected.weight;
        selected.remaining -= timeSlice;
        currentTime += timeSlice;

        if (selected.remaining <= 0.1) {
            selected.completionTime = currentTime;
            selected.turnaround = selected.completionTime - selected.arrival;
            selected.waiting = selected.turnaround - selected.burst;
        }
    }

    const n = procs.length;
    return {
        avgWaitingTime: procs.reduce((sum, p) => sum + (p.waiting || 0), 0) / n,
        avgTurnaroundTime: procs.reduce((sum, p) => sum + (p.turnaround || 0), 0) / n,
        avgResponseTime: procs.reduce((sum, p) => sum + (p.turnaround - p.burst) / 2, 0) / n, // Approximation
        cpuUtilization: 100,
        throughput: (n / currentTime).toFixed(2),
        isCFS: true
    };
}

// Export functions
const ComparisonTool = {
    runAllAlgorithms,
    generateComparisonTable,
    getCFSComparison,
    simulateCFS
};
