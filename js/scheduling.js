/**
 * CPU Scheduling Algorithms Implementation
 * FCFS, SJF, SRTF, Priority, Round Robin, Multilevel Queue
 */

// Deep clone processes to avoid modifying original data
function cloneProcesses(processes) {
    return processes.map(p => ({ ...p }));
}

/**
 * FCFS - First Come First Serve
 * Non-preemptive: processes execute in arrival order
 */
function fcfs(processes) {
    const procs = cloneProcesses(processes);
    const n = procs.length;

    // Sort by arrival time
    procs.sort((a, b) => a.arrival - b.arrival);

    let currentTime = 0;
    const ganttData = [];

    for (let proc of procs) {
        // If CPU is idle, jump to arrival time
        if (currentTime < proc.arrival) {
            currentTime = proc.arrival;
        }

        proc.startTime = currentTime;
        proc.completionTime = currentTime + proc.burst;
        proc.turnaround = proc.completionTime - proc.arrival;
        proc.waiting = proc.turnaround - proc.burst;
        proc.response = proc.startTime - proc.arrival;

        ganttData.push({
            process: proc.pid,
            start: currentTime,
            end: proc.completionTime
        });

        currentTime = proc.completionTime;
    }

    return { ganttData, processes: procs };
}

/**
 * SJF - Shortest Job First (Non-preemptive)
 * Selects process with shortest burst time among arrived processes
 */
function sjf(processes) {
    const procs = cloneProcesses(processes);
    const n = procs.length;
    const completed = new Array(n).fill(false);
    const ganttData = [];
    let currentTime = 0;
    let completedCount = 0;

    // Initialize remaining burst times
    procs.forEach(p => p.remaining = p.burst);

    while (completedCount < n) {
        // Find all arrived processes that aren't completed
        const available = procs.filter((p, i) =>
            p.arrival <= currentTime && !completed[i]
        );

        if (available.length === 0) {
            // CPU idle - jump to next arrival
            const nextArrival = procs.filter((p, i) => !completed[i])
                .reduce((min, p) => Math.min(min, p.arrival), Infinity);
            currentTime = nextArrival;
            continue;
        }

        // Select shortest job
        available.sort((a, b) => a.burst - b.burst);
        const selected = available[0];
        const idx = procs.findIndex(p => p.pid === selected.pid);

        selected.startTime = currentTime;
        currentTime += selected.burst;
        selected.completionTime = currentTime;
        selected.turnaround = selected.completionTime - selected.arrival;
        selected.waiting = selected.turnaround - selected.burst;
        selected.response = selected.startTime - selected.arrival;

        ganttData.push({
            process: selected.pid,
            start: selected.startTime,
            end: currentTime
        });

        completed[idx] = true;
        completedCount++;
    }

    return { ganttData, processes: procs };
}

/**
 * SRTF - Shortest Remaining Time First (Preemptive SJF)
 * Preempts if a new process has shorter remaining time
 */
function srtf(processes) {
    const procs = cloneProcesses(processes);
    const n = procs.length;
    const ganttData = [];
    let currentTime = 0;
    let completedCount = 0;
    const completed = new Array(n).fill(false);

    // Initialize remaining times
    procs.forEach(p => p.remaining = p.burst);

    // Track first execution for response time
    procs.forEach(p => p.firstExec = null);

    while (completedCount < n) {
        // Find process with shortest remaining time
        const available = procs.filter((p, i) =>
            p.arrival <= currentTime && !completed[i]
        );

        if (available.length === 0) {
            // CPU idle
            const nextArrival = procs.filter((p, i) => !completed[i])
                .reduce((min, p) => Math.min(min, p.arrival), Infinity);
            currentTime = nextArrival;
            continue;
        }

        available.sort((a, b) => a.remaining - b.remaining);
        const selected = available[0];
        const idx = procs.findIndex(p => p.pid === selected.pid);

        // Record first execution time
        if (selected.firstExec === null) {
            selected.firstExec = currentTime;
        }

        // Find next process arrival or completion
        let timeSlice = selected.remaining;
        const futureArrivals = procs.filter(p => p.arrival > currentTime);
        if (futureArrivals.length > 0) {
            const nextArrival = Math.min(...futureArrivals.map(p => p.arrival));
            timeSlice = Math.min(timeSlice, nextArrival - currentTime);
        }

        // Record Gantt entry
        const startTime = currentTime;
        selected.remaining -= timeSlice;
        currentTime += timeSlice;

        // Check if process completed
        if (selected.remaining === 0) {
            completed[idx] = true;
            completedCount++;
            selected.completionTime = currentTime;
            selected.turnaround = selected.completionTime - selected.arrival;
            selected.waiting = selected.turnaround - selected.burst;
            selected.response = selected.firstExec - selected.arrival;

            ganttData.push({
                process: selected.pid,
                start: startTime,
                end: currentTime
            });
        } else {
            // Preemption or time slice ended
            // Check if another process now has shorter remaining time
            const currentAvailable = procs.filter((p, i) =>
                p.arrival <= currentTime && !completed[i]
            );
            if (currentAvailable.length > 0) {
                currentAvailable.sort((a, b) => a.remaining - b.remaining);
                if (currentAvailable[0].pid !== selected.pid) {
                    // Preempt - end current segment
                    ganttData.push({
                        process: selected.pid,
                        start: startTime,
                        end: currentTime
                    });
                }
            }
        }
    }

    // Merge consecutive same-process segments
    const mergedGantt = [];
    for (const segment of ganttData) {
        if (mergedGantt.length > 0 &&
            mergedGantt[mergedGantt.length - 1].process === segment.process &&
            mergedGantt[mergedGantt.length - 1].end === segment.start) {
            mergedGantt[mergedGantt.length - 1].end = segment.end;
        } else {
            mergedGantt.push(segment);
        }
    }

    return { ganttData: mergedGantt, processes: procs };
}

/**
 * Priority Scheduling (Non-preemptive)
 * Lower number = higher priority
 */
function priority(processes) {
    const procs = cloneProcesses(processes);
    const n = procs.length;
    const ganttData = [];
    let currentTime = 0;
    let completedCount = 0;
    const completed = new Array(n).fill(false);

    procs.forEach(p => p.remaining = p.burst);

    while (completedCount < n) {
        // Find arrived processes
        const available = procs.filter((p, i) =>
            p.arrival <= currentTime && !completed[i]
        );

        if (available.length === 0) {
            const nextArrival = procs.filter((p, i) => !completed[i])
                .reduce((min, p) => Math.min(min, p.arrival), Infinity);
            currentTime = nextArrival;
            continue;
        }

        // Select highest priority (lowest number)
        available.sort((a, b) => a.priority - b.priority);
        const selected = available[0];
        const idx = procs.findIndex(p => p.pid === selected.pid);

        selected.startTime = currentTime;
        currentTime += selected.burst;
        selected.completionTime = currentTime;
        selected.turnaround = selected.completionTime - selected.arrival;
        selected.waiting = selected.turnaround - selected.burst;
        selected.response = selected.startTime - selected.arrival;

        ganttData.push({
            process: selected.pid,
            start: selected.startTime,
            end: currentTime
        });

        completed[idx] = true;
        completedCount++;
    }

    return { ganttData, processes: procs };
}

/**
 * Round Robin (Preemptive with time quantum)
 * Each process gets a fixed time slice
 */
function roundRobin(processes, quantum = 2) {
    const procs = cloneProcesses(processes);
    const n = procs.length;
    const ganttData = [];
    let currentTime = 0;
    let completedCount = 0;
    const completed = new Array(n).fill(false);

    procs.forEach(p => {
        p.remaining = p.burst;
        p.firstExec = null;
    });

    // Sort by arrival time for initial queue
    procs.sort((a, b) => a.arrival - b.arrival);

    const queue = [];
    let queueIdx = 0;

    // Add initial processes
    let minArrival = Math.min(...procs.map(p => p.arrival));
    currentTime = minArrival;

    // Add all processes arriving at minArrival
    procs.forEach((p, i) => {
        if (p.arrival === minArrival) {
            queue.push(i);
        }
    });
    queueIdx = 0;

    while (completedCount < n) {
        if (queue.length === 0) {
            // Find next arrival
            const remaining = procs.filter((p, i) => !completed[i]);
            if (remaining.length === 0) break;
            const nextArrival = Math.min(...remaining.map(p => p.arrival));
            currentTime = nextArrival;
            procs.forEach((p, i) => {
                if (p.arrival === nextArrival && !queue.includes(i) && !completed[i]) {
                    queue.push(i);
                }
            });
            continue;
        }

        const idx = queue.shift();
        const selected = procs[idx];

        // Record first execution
        if (selected.firstExec === null) {
            selected.firstExec = currentTime;
        }

        const startTime = currentTime;
        const execTime = Math.min(selected.remaining, quantum);

        selected.remaining -= execTime;
        currentTime += execTime;

        // Add newly arrived processes to queue
        procs.forEach((p, i) => {
            if (p.arrival <= currentTime && p.arrival > startTime &&
                !completed[i] && !queue.includes(i) && i !== idx) {
                queue.push(i);
            }
        });

        if (selected.remaining === 0) {
            completed[idx] = true;
            completedCount++;
            selected.completionTime = currentTime;
            selected.turnaround = selected.completionTime - selected.arrival;
            selected.waiting = selected.turnaround - selected.burst;
            selected.response = selected.firstExec - selected.arrival;

            ganttData.push({
                process: selected.pid,
                start: startTime,
                end: currentTime
            });
        } else {
            // Re-add to queue
            ganttData.push({
                process: selected.pid,
                start: startTime,
                end: currentTime
            });
            queue.push(idx);
        }
    }

    // Sort processes back to original order by PID
    procs.sort((a, b) => {
        const aNum = parseInt(a.pid.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.pid.replace(/\D/g, '')) || 0;
        return aNum - bNum;
    });

    return { ganttData, processes: procs };
}

/**
 * Multilevel Queue Scheduling
 * Interactive (foreground) - RR with small quantum
 * Batch (background) - FCFS
 * Threshold determines queue assignment based on burst time
 */
function multilevelQueue(processes, threshold = 4) {
    const procs = cloneProcesses(processes);
    const n = procs.length;

    // Classify processes
    const interactive = procs.filter(p => p.burst <= threshold);
    const batch = procs.filter(p => p.burst > threshold);

    const ganttData = [];
    let currentTime = 0;

    // Sort both queues by arrival
    interactive.sort((a, b) => a.arrival - b.arrival);
    batch.sort((a, b) => a.arrival - b.arrival);

    // Mark queue type
    interactive.forEach(p => p.queue = 'Interactive');
    batch.forEach(p => p.queue = 'Batch');

    let interactiveIdx = 0;
    let batchIdx = 0;
    let completedCount = 0;
    const completed = new Array(n).fill(false);

    procs.forEach(p => {
        p.remaining = p.burst;
        p.firstExec = null;
    });

    const quantum = 2; // RR quantum for interactive

    while (completedCount < n) {
        // Priority: Interactive queue first
        const availableInteractive = interactive.filter((p, i) => {
            const origIdx = procs.findIndex(op => op.pid === p.pid);
            return p.arrival <= currentTime && !completed[origIdx];
        });

        const availableBatch = batch.filter((p, i) => {
            const origIdx = procs.findIndex(op => op.pid === p.pid);
            return p.arrival <= currentTime && !completed[origIdx];
        });

        if (availableInteractive.length === 0 && availableBatch.length === 0) {
            // Find next arrival
            const allRemaining = procs.filter((p, i) => !completed[i]);
            if (allRemaining.length === 0) break;
            currentTime = Math.min(...allRemaining.map(p => p.arrival));
            continue;
        }

        if (availableInteractive.length > 0) {
            // Process interactive queue (RR)
            const selected = availableInteractive[0];
            const idx = procs.findIndex(p => p.pid === selected.pid);

            if (selected.firstExec === null) {
                selected.firstExec = currentTime;
            }

            const startTime = currentTime;
            const execTime = Math.min(selected.remaining, quantum);
            selected.remaining -= execTime;
            currentTime += execTime;

            if (selected.remaining === 0) {
                completed[idx] = true;
                completedCount++;
                selected.completionTime = currentTime;
                selected.turnaround = selected.completionTime - selected.arrival;
                selected.waiting = selected.turnaround - selected.burst;
                selected.response = selected.firstExec - selected.arrival;
            }

            ganttData.push({
                process: selected.pid,
                start: startTime,
                end: currentTime,
                queue: 'Interactive'
            });
        } else {
            // Process batch queue (FCFS - run to completion)
            const selected = availableBatch[0];
            const idx = procs.findIndex(p => p.pid === selected.pid);

            if (selected.firstExec === null) {
                selected.firstExec = currentTime;
            }

            const startTime = currentTime;
            currentTime += selected.remaining;
            selected.remaining = 0;

            completed[idx] = true;
            completedCount++;
            selected.completionTime = currentTime;
            selected.turnaround = selected.completionTime - selected.arrival;
            selected.waiting = selected.turnaround - selected.burst;
            selected.response = selected.firstExec - selected.arrival;

            ganttData.push({
                process: selected.pid,
                start: startTime,
                end: currentTime,
                queue: 'Batch'
            });
        }
    }

    // Merge consecutive same-process segments
    const mergedGantt = [];
    for (const segment of ganttData) {
        if (mergedGantt.length > 0 &&
            mergedGantt[mergedGantt.length - 1].process === segment.process &&
            mergedGantt[mergedGantt.length - 1].end === segment.start) {
            mergedGantt[mergedGantt.length - 1].end = segment.end;
        } else {
            mergedGantt.push(segment);
        }
    }

    return { ganttData: mergedGantt, processes: procs };
}

// Export all algorithms
const SchedulingAlgorithms = {
    fcfs,
    sjf,
    srtf,
    priority,
    roundRobin,
    multilevelQueue
};
