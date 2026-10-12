/**
 * Performance Metrics Calculator
 * Calculates waiting time, turnaround time, response time, CPU utilization, throughput
 */

/**
 * Calculate all performance metrics from processed results
 * @param {Array} processes - Array of process objects with timing data
 * @param {number} totalTime - Total simulation time
 * @returns {Object} Metrics object
 */
function calculateMetrics(processes, totalTime) {
    const n = processes.length;

    if (n === 0) {
        return {
            avgWaitingTime: 0,
            avgTurnaroundTime: 0,
            avgResponseTime: 0,
            cpuUtilization: 0,
            throughput: 0,
            totalBurstTime: 0,
            idleTime: 0
        };
    }

    // Sum up metrics
    let totalWaiting = 0;
    let totalTurnaround = 0;
    let totalResponse = 0;
    let totalBurst = 0;
    let maxCompletion = 0;
    let minArrival = Infinity;

    processes.forEach(p => {
        totalWaiting += p.waiting || 0;
        totalTurnaround += p.turnaround || 0;
        totalResponse += p.response || 0;
        totalBurst += p.burst;
        maxCompletion = Math.max(maxCompletion, p.completionTime || 0);
        minArrival = Math.min(minArrival, p.arrival);
    });

    // Calculate idle time (gaps in scheduling)
    const idleTime = totalTime - totalBurst;

    return {
        avgWaitingTime: totalWaiting / n,
        avgTurnaroundTime: totalTurnaround / n,
        avgResponseTime: totalResponse / n,
        cpuUtilization: ((totalBurst / totalTime) * 100).toFixed(2),
        throughput: (n / totalTime).toFixed(2),
        totalBurstTime: totalBurst,
        idleTime: Math.max(0, idleTime),
        minArrival,
        maxCompletion
    };
}

/**
 * Format metric value for display
 * @param {number} value - Metric value
 * @param {string} suffix - Optional suffix (e.g., 'ms', '%')
 * @returns {string} Formatted value
 */
function formatMetric(value, suffix = '', decimals = 2) {
    if (typeof value === 'number') {
        return value.toFixed(decimals) + suffix;
    }
    return value + suffix;
}

/**
 * Get performance grade based on metrics
 * @param {Object} metrics - Metrics object
 * @returns {Object} Grade info with color and message
 */
function getPerformanceGrade(metrics) {
    const avgWait = metrics.avgWaitingTime;
    const cpuUtil = parseFloat(metrics.cpuUtilization);

    let grade, color, message;

    if (avgWait < 5 && cpuUtil > 80) {
        grade = 'Excellent';
        color = '#10b981';
        message = 'Optimal scheduling performance!';
    } else if (avgWait < 10 && cpuUtil > 60) {
        grade = 'Good';
        color = '#06b6d4';
        message = 'Above average performance';
    } else if (avgWait < 20 && cpuUtil > 40) {
        grade = 'Average';
        color = '#f59e0b';
        message = 'Acceptable performance';
    } else {
        grade = 'Needs Improvement';
        color = '#ef4444';
        message = 'Consider different algorithm or process mix';
    }

    return { grade, color, message };
}

/**
 * Compare metrics between two algorithms
 * @param {Object} metrics1 - First algorithm metrics
 * @param {Object} metrics2 - Second algorithm metrics
 * @returns {Object} Comparison results
 */
function compareMetrics(metrics1, metrics2) {
    const comparisons = {
        waitingTime: {
            better: metrics1.avgWaitingTime <= metrics2.avgWaitingTime ? 1 : 2,
            diff: Math.abs(metrics1.avgWaitingTime - metrics2.avgWaitingTime).toFixed(2)
        },
        turnaroundTime: {
            better: metrics1.avgTurnaroundTime <= metrics2.avgTurnaroundTime ? 1 : 2,
            diff: Math.abs(metrics1.avgTurnaroundTime - metrics2.avgTurnaroundTime).toFixed(2)
        },
        responseTime: {
            better: metrics1.avgResponseTime <= metrics2.avgResponseTime ? 1 : 2,
            diff: Math.abs(metrics1.avgResponseTime - metrics2.avgResponseTime).toFixed(2)
        },
        cpuUtilization: {
            better: parseFloat(metrics1.cpuUtilization) >= parseFloat(metrics2.cpuUtilization) ? 1 : 2,
            diff: Math.abs(parseFloat(metrics1.cpuUtilization) - parseFloat(metrics2.cpuUtilization)).toFixed(2)
        }
    };

    // Count wins
    let wins1 = 0, wins2 = 0;
    Object.values(comparisons).forEach(comp => {
        if (comp.better === 1) wins1++;
        else wins2++;
    });

    return {
        comparisons,
        winner: wins1 >= wins2 ? 1 : 2,
        score: `${wins1}-${wins2}`
    };
}

// Export functions
const MetricsCalculator = {
    calculateMetrics,
    formatMetric,
    getPerformanceGrade,
    compareMetrics
};
