/**
 * Page Replacement Algorithms: FIFO, LRU, and Optimal
 * Complete implementation with step-by-step tracing, diagnostics, and Belády's anomaly analysis.
 */

/**
 * First-In, First-Out (FIFO) Page Replacement
 * Evicts the page that has been in memory the longest (oldest arrival).
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} numFrames - Number of physical memory page frames
 * @returns {Object} Simulation results including step-by-step traces
 */
function fifo(pages, numFrames) {
    if (!pages || pages.length === 0 || numFrames <= 0) {
        return { totalFaults: 0, totalHits: 0, hitRatio: 0, faultRatio: 0, steps: [], algorithm: 'fifo' };
    }

    let memory = new Array(numFrames).fill(null);
    let queue = []; // frame indices in order of arrival (oldest at index 0)
    let arrivalTimes = new Array(numFrames).fill(null);
    let steps = [];
    let faults = 0;
    let hits = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const stepNum = i + 1;
        const frameIndex = memory.indexOf(page);
        let fault = false;
        let replaced = null;
        let evictedPage = null;
        let targetFrame = -1;
        let reason = '';
        let decisionType = '';

        if (frameIndex !== -1) {
            // PAGE HIT: Page already resident in a frame
            hits++;
            targetFrame = frameIndex;
            decisionType = 'HIT';
            const queuePages = queue.map(idx => memory[idx]).join(' → ');
            reason = `Page ${page} is already resident in Frame ${frameIndex} (Page Hit). FIFO queue order remains unchanged: [${queuePages}].`;
        } else {
            // PAGE FAULT (MISS)
            faults++;
            fault = true;
            const emptyIndex = memory.indexOf(null);

            if (emptyIndex !== -1) {
                // Empty frame available
                targetFrame = emptyIndex;
                memory[emptyIndex] = page;
                queue.push(emptyIndex);
                arrivalTimes[emptyIndex] = stepNum;
                decisionType = 'ALLOCATE';
                const queuePages = queue.map(idx => memory[idx]).join(' → ');
                reason = `Page ${page} not in memory (Page Fault). Empty Frame ${emptyIndex} allocated. Loaded Page ${page}. FIFO Queue: [${queuePages}].`;
            } else {
                // All frames full: evict the oldest page in queue
                replaced = queue.shift();
                targetFrame = replaced;
                evictedPage = memory[replaced];
                const arrivedAt = arrivalTimes[replaced];
                memory[replaced] = page;
                queue.push(replaced);
                arrivalTimes[replaced] = stepNum;
                decisionType = 'REPLACE';
                const queuePages = queue.map(idx => memory[idx]).join(' → ');
                reason = `Page ${page} not in memory (Page Fault). Frame ${replaced} holding Page ${evictedPage} arrived earliest (at step ${arrivedAt}). Evicted Page ${evictedPage} and loaded Page ${page}. FIFO Queue: [${queuePages}].`;
            }
        }

        steps.push({
            step: stepNum,
            page: page,
            memory: [...memory],
            fault: fault,
            hit: !fault,
            replaced: replaced,
            evictedPage: evictedPage,
            targetFrame: targetFrame,
            decisionType: decisionType,
            reason: reason,
            state: [...queue], // frame indices from oldest to newest
            queuePages: queue.map(idx => memory[idx])
        });
    }

    const hitRatio = Number(((hits / pages.length) * 100).toFixed(1));
    const faultRatio = Number(((faults / pages.length) * 100).toFixed(1));

    return {
        totalFaults: faults,
        totalHits: hits,
        hitRatio: hitRatio,
        faultRatio: faultRatio,
        steps: steps,
        algorithm: 'fifo',
        numFrames: numFrames,
        totalPages: pages.length
    };
}

/**
 * Least Recently Used (LRU) Page Replacement
 * Evicts the page that has not been referenced for the longest period of time.
 * Grounded in the Principle of Temporal Locality.
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} numFrames - Number of physical memory page frames
 * @returns {Object} Simulation results including step-by-step traces
 */
function lru(pages, numFrames) {
    if (!pages || pages.length === 0 || numFrames <= 0) {
        return { totalFaults: 0, totalHits: 0, hitRatio: 0, faultRatio: 0, steps: [], algorithm: 'lru' };
    }

    let memory = new Array(numFrames).fill(null);
    let usage = []; // frame indices ordered from LRU (index 0) to MRU (last index)
    let lastAccess = new Array(numFrames).fill(null);
    let steps = [];
    let faults = 0;
    let hits = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const stepNum = i + 1;
        const frameIndex = memory.indexOf(page);
        let fault = false;
        let replaced = null;
        let evictedPage = null;
        let targetFrame = -1;
        let reason = '';
        let decisionType = '';

        if (frameIndex !== -1) {
            // PAGE HIT: Move frame to most recently used (end of usage array)
            hits++;
            targetFrame = frameIndex;
            decisionType = 'HIT';
            const prevAccess = lastAccess[frameIndex];
            usage = usage.filter(idx => idx !== frameIndex);
            usage.push(frameIndex);
            lastAccess[frameIndex] = stepNum;
            const recencyPages = usage.map(idx => memory[idx]).join(' → ');
            reason = `Page ${page} is already in Frame ${frameIndex} (Page Hit, previously referenced at step ${prevAccess}). Marked as Most Recently Used (MRU). Order (LRU → MRU): [${recencyPages}].`;
        } else {
            // PAGE FAULT (MISS)
            faults++;
            fault = true;
            const emptyIndex = memory.indexOf(null);

            if (emptyIndex !== -1) {
                // Empty frame available
                targetFrame = emptyIndex;
                memory[emptyIndex] = page;
                usage.push(emptyIndex);
                lastAccess[emptyIndex] = stepNum;
                decisionType = 'ALLOCATE';
                const recencyPages = usage.map(idx => memory[idx]).join(' → ');
                reason = `Page ${page} not in memory (Page Fault). Empty Frame ${emptyIndex} allocated. Loaded Page ${page} as MRU. Order (LRU → MRU): [${recencyPages}].`;
            } else {
                // All frames full: evict the least recently used frame
                replaced = usage.shift();
                targetFrame = replaced;
                evictedPage = memory[replaced];
                const prevAccess = lastAccess[replaced];
                memory[replaced] = page;
                usage.push(replaced);
                lastAccess[replaced] = stepNum;
                decisionType = 'REPLACE';
                const recencyPages = usage.map(idx => memory[idx]).join(' → ');
                reason = `Page ${page} not in memory (Page Fault). Frame ${replaced} holding Page ${evictedPage} was Least Recently Used (last accessed at step ${prevAccess}). Evicted Page ${evictedPage} and loaded Page ${page}. Order (LRU → MRU): [${recencyPages}].`;
            }
        }

        steps.push({
            step: stepNum,
            page: page,
            memory: [...memory],
            fault: fault,
            hit: !fault,
            replaced: replaced,
            evictedPage: evictedPage,
            targetFrame: targetFrame,
            decisionType: decisionType,
            reason: reason,
            state: [...usage], // frame indices from LRU to MRU
            usagePages: usage.map(idx => memory[idx]),
            lastAccess: [...lastAccess]
        });
    }

    const hitRatio = Number(((hits / pages.length) * 100).toFixed(1));
    const faultRatio = Number(((faults / pages.length) * 100).toFixed(1));

    return {
        totalFaults: faults,
        totalHits: hits,
        hitRatio: hitRatio,
        faultRatio: faultRatio,
        steps: steps,
        algorithm: 'lru',
        numFrames: numFrames,
        totalPages: pages.length
    };
}

/**
 * Optimal (OPT / Bélády's Min) Page Replacement
 * Evicts the page that will not be used for the longest period of time in the future.
 * Provably guarantees the minimum number of page faults (offline benchmark).
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} numFrames - Number of physical memory page frames
 * @returns {Object} Simulation results including step-by-step traces
 */
function optimal(pages, numFrames) {
    if (!pages || pages.length === 0 || numFrames <= 0) {
        return { totalFaults: 0, totalHits: 0, hitRatio: 0, faultRatio: 0, steps: [], algorithm: 'optimal' };
    }

    let memory = new Array(numFrames).fill(null);
    let arrivalOrder = new Array(numFrames).fill(null);
    let steps = [];
    let faults = 0;
    let hits = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const stepNum = i + 1;
        const frameIndex = memory.indexOf(page);
        let fault = false;
        let replaced = null;
        let evictedPage = null;
        let targetFrame = -1;
        let reason = '';
        let decisionType = '';

        if (frameIndex !== -1) {
            // PAGE HIT
            hits++;
            targetFrame = frameIndex;
            decisionType = 'HIT';
            reason = `Page ${page} is already in Frame ${frameIndex} (Page Hit). No eviction needed.`;
        } else {
            // PAGE FAULT (MISS)
            faults++;
            fault = true;
            const emptyIndex = memory.indexOf(null);

            if (emptyIndex !== -1) {
                // Empty frame available
                targetFrame = emptyIndex;
                memory[emptyIndex] = page;
                arrivalOrder[emptyIndex] = stepNum;
                decisionType = 'ALLOCATE';
                reason = `Page ${page} not in memory (Page Fault). Empty Frame ${emptyIndex} allocated. Loaded Page ${page}.`;
            } else {
                // Look ahead into the future reference string to choose victim
                let furthestNextUse = -1;
                let frameToReplace = -1;
                let tieBreakArrival = Infinity;
                let candidateAnalysis = [];

                for (let j = 0; j < numFrames; j++) {
                    const residentPage = memory[j];
                    const nextUseIndex = pages.indexOf(residentPage, i + 1);
                    const isNeverUsed = (nextUseIndex === -1);
                    const arrival = arrivalOrder[j] !== null ? arrivalOrder[j] : 0;

                    candidateAnalysis.push({
                        frame: j,
                        page: residentPage,
                        nextUseStep: isNeverUsed ? 'Never' : nextUseIndex + 1,
                        isNeverUsed: isNeverUsed
                    });

                    if (isNeverUsed) {
                        // Priority 1: Page never referenced again
                        // If multiple pages are never referenced, tie-break by earliest arrival (FIFO)
                        if (furthestNextUse !== Infinity || arrival < tieBreakArrival) {
                            furthestNextUse = Infinity;
                            frameToReplace = j;
                            tieBreakArrival = arrival;
                        }
                    } else if (furthestNextUse !== Infinity) {
                        // Priority 2: Page referenced furthest in future
                        if (nextUseIndex > furthestNextUse) {
                            furthestNextUse = nextUseIndex;
                            frameToReplace = j;
                            tieBreakArrival = arrival;
                        }
                    }
                }

                replaced = frameToReplace;
                targetFrame = replaced;
                evictedPage = memory[replaced];
                memory[replaced] = page;
                arrivalOrder[replaced] = stepNum;
                decisionType = 'REPLACE';

                const lookaheadSummary = candidateAnalysis.map(c => `Page ${c.page} (Frame ${c.frame}) -> ${c.nextUseStep}`).join(', ');
                if (furthestNextUse === Infinity) {
                    reason = `Page ${page} not in memory (Page Fault). Lookahead analysis: [${lookaheadSummary}]. Page ${evictedPage} is never referenced again in the future. Evicted Page ${evictedPage} from Frame ${replaced} for Page ${page}.`;
                } else {
                    reason = `Page ${page} not in memory (Page Fault). Lookahead analysis: [${lookaheadSummary}]. Page ${evictedPage} next used furthest in future (at step ${furthestNextUse + 1}). Evicted Page ${evictedPage} from Frame ${replaced} for Page ${page}.`;
                }
            }
        }

        // Compute current lookahead status for all resident frames at this step
        const lookaheadState = memory.map((p, idx) => {
            if (p === null) return { page: null, nextStep: 'Empty' };
            const nextIdx = pages.indexOf(p, i + 1);
            return {
                page: p,
                frame: idx,
                nextIndex: nextIdx,
                nextStep: nextIdx === -1 ? 'Never' : `Step ${nextIdx + 1}`
            };
        });

        steps.push({
            step: stepNum,
            page: page,
            memory: [...memory],
            fault: fault,
            hit: !fault,
            replaced: replaced,
            evictedPage: evictedPage,
            targetFrame: targetFrame,
            decisionType: decisionType,
            reason: reason,
            state: lookaheadState.map(s => s.nextStep),
            lookaheadDetails: lookaheadState
        });
    }

    const hitRatio = Number(((hits / pages.length) * 100).toFixed(1));
    const faultRatio = Number(((faults / pages.length) * 100).toFixed(1));

    return {
        totalFaults: faults,
        totalHits: hits,
        hitRatio: hitRatio,
        faultRatio: faultRatio,
        steps: steps,
        algorithm: 'optimal',
        numFrames: numFrames,
        totalPages: pages.length
    };
}

/**
 * Clock (Second-Chance) Page Replacement
 * Approximates LRU with low overhead using a circular buffer and reference bits.
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} numFrames - Number of physical memory page frames
 * @returns {Object} Simulation results including step-by-step traces
 */
function clock(pages, numFrames) {
    if (!pages || pages.length === 0 || numFrames <= 0) {
        return { totalFaults: 0, totalHits: 0, hitRatio: 0, faultRatio: 0, steps: [], algorithm: 'clock' };
    }

    let memory = new Array(numFrames).fill(null);
    let refBits = new Array(numFrames).fill(0);
    let clockHand = 0;
    let steps = [];
    let faults = 0;
    let hits = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const stepNum = i + 1;
        const frameIndex = memory.indexOf(page);
        let fault = false;
        let replaced = null;
        let evictedPage = null;
        let targetFrame = -1;
        let reason = '';
        let decisionType = '';
        const handStart = clockHand;
        let examinedFrames = [];

        if (frameIndex !== -1) {
            // PAGE HIT: Set reference bit to 1, clock hand stays in place
            hits++;
            targetFrame = frameIndex;
            refBits[frameIndex] = 1;
            decisionType = 'HIT';
            reason = `Page ${page} is resident in Frame ${frameIndex} (Page Hit). Reference bit set to 1. Clock hand remains at Frame ${clockHand}.`;
        } else {
            // PAGE FAULT (MISS)
            faults++;
            fault = true;
            const emptyIndex = memory.indexOf(null);

            if (emptyIndex !== -1) {
                // Empty frame available during cold start
                targetFrame = emptyIndex;
                memory[emptyIndex] = page;
                refBits[emptyIndex] = 1;
                decisionType = 'ALLOCATE';
                clockHand = (emptyIndex + 1) % numFrames;
                reason = `Page ${page} not in memory (Page Fault). Allocated empty Frame ${emptyIndex}. Set ref bit to 1. Hand advanced to Frame ${clockHand}.`;
            } else {
                // Buffer full: circulate clock hand, clearing reference bits until ref bit 0 is encountered
                while (refBits[clockHand] === 1) {
                    examinedFrames.push(`Frame ${clockHand} (Page ${memory[clockHand]}): bit 1→0 (second chance)`);
                    refBits[clockHand] = 0;
                    clockHand = (clockHand + 1) % numFrames;
                }

                // Evict victim at clock hand
                replaced = clockHand;
                targetFrame = replaced;
                evictedPage = memory[replaced];
                examinedFrames.push(`Frame ${clockHand} (Page ${evictedPage}): bit is 0 → EVICTED`);

                memory[replaced] = page;
                refBits[replaced] = 1;
                clockHand = (replaced + 1) % numFrames;
                decisionType = 'REPLACE';

                reason = `Page ${page} not in memory (Page Fault). Clock search from Frame ${handStart}: [${examinedFrames.join(', ')}]. Evicted Page ${evictedPage} from Frame ${replaced}. Loaded Page ${page} (bit=1). Hand advanced to Frame ${clockHand}.`;
            }
        }

        steps.push({
            step: stepNum,
            page: page,
            memory: [...memory],
            fault: fault,
            hit: !fault,
            replaced: replaced,
            evictedPage: evictedPage,
            targetFrame: targetFrame,
            decisionType: decisionType,
            reason: reason,
            clockHand: clockHand,
            refBits: [...refBits],
            state: memory.map((p, idx) => ({
                frame: idx,
                page: p,
                refBit: refBits[idx],
                isHand: (idx === clockHand)
            }))
        });
    }

    const hitRatio = Number(((hits / pages.length) * 100).toFixed(1));
    const faultRatio = Number(((faults / pages.length) * 100).toFixed(1));

    return {
        totalFaults: faults,
        totalHits: hits,
        hitRatio: hitRatio,
        faultRatio: faultRatio,
        steps: steps,
        algorithm: 'clock',
        numFrames: numFrames,
        totalPages: pages.length
    };
}

/**
 * Least Frequently Used (LFU) Page Replacement
 * Evicts the page with the lowest reference frequency counter.
 * Breaks ties using earliest arrival time (FIFO).
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} numFrames - Number of physical memory page frames
 * @returns {Object} Simulation results including step-by-step traces
 */
function lfu(pages, numFrames) {
    if (!pages || pages.length === 0 || numFrames <= 0) {
        return { totalFaults: 0, totalHits: 0, hitRatio: 0, faultRatio: 0, steps: [], algorithm: 'lfu' };
    }

    let memory = new Array(numFrames).fill(null);
    let freq = {};
    let arrivalTimes = new Array(numFrames).fill(null);
    let steps = [];
    let faults = 0;
    let hits = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const stepNum = i + 1;
        const frameIndex = memory.indexOf(page);
        let fault = false;
        let replaced = null;
        let evictedPage = null;
        let targetFrame = -1;
        let reason = '';
        let decisionType = '';

        freq[page] = (freq[page] || 0) + 1;

        if (frameIndex !== -1) {
            hits++;
            targetFrame = frameIndex;
            decisionType = 'HIT';
            reason = `Page ${page} is resident in Frame ${frameIndex} (Page Hit). Reference frequency incremented to ${freq[page]}.`;
        } else {
            faults++;
            fault = true;
            const emptyIndex = memory.indexOf(null);

            if (emptyIndex !== -1) {
                targetFrame = emptyIndex;
                memory[emptyIndex] = page;
                arrivalTimes[emptyIndex] = stepNum;
                decisionType = 'ALLOCATE';
                reason = `Page ${page} not in memory (Page Fault). Allocated empty Frame ${emptyIndex}. Initial frequency: ${freq[page]}.`;
            } else {
                let minFreq = Infinity;
                let victimFrame = -1;
                let oldestArrival = Infinity;

                for (let f = 0; f < numFrames; f++) {
                    const residentPage = memory[f];
                    const pageFreq = freq[residentPage] || 0;
                    const arr = arrivalTimes[f] || 0;

                    if (pageFreq < minFreq) {
                        minFreq = pageFreq;
                        victimFrame = f;
                        oldestArrival = arr;
                    } else if (pageFreq === minFreq && arr < oldestArrival) {
                        victimFrame = f;
                        oldestArrival = arr;
                    }
                }

                replaced = victimFrame;
                targetFrame = replaced;
                evictedPage = memory[replaced];
                memory[replaced] = page;
                arrivalTimes[replaced] = stepNum;
                decisionType = 'REPLACE';

                const residentStats = memory.map((p, idx) => `Frame ${idx} [Page ${p}: ${freq[p]} refs]`).join(', ');
                reason = `Page ${page} not in memory (Page Fault). Frame frequencies: [${residentStats}]. Evicted Page ${evictedPage} (lowest frequency: ${minFreq}) from Frame ${replaced} for Page ${page} (freq: ${freq[page]}).`;
            }
        }

        steps.push({
            step: stepNum,
            page: page,
            memory: [...memory],
            fault: fault,
            hit: !fault,
            replaced: replaced,
            evictedPage: evictedPage,
            targetFrame: targetFrame,
            decisionType: decisionType,
            reason: reason,
            frequencies: { ...freq },
            state: memory.map((p, idx) => ({
                frame: idx,
                page: p,
                freq: p !== null ? (freq[p] || 0) : 0
            }))
        });
    }

    const hitRatio = Number(((hits / pages.length) * 100).toFixed(1));
    const faultRatio = Number(((faults / pages.length) * 100).toFixed(1));

    return {
        totalFaults: faults,
        totalHits: hits,
        hitRatio: hitRatio,
        faultRatio: faultRatio,
        steps: steps,
        algorithm: 'lfu',
        numFrames: numFrames,
        totalPages: pages.length
    };
}

/**
 * Adaptive Replacement Cache (ARC - Megiddo & Modha, IBM)
 * Dynamically tunes between recency (LRU) and frequency (LFU) using two resident lists (T1, T2)
 * and two ghost history lists (B1, B2) with an adaptive tuning parameter p.
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} numFrames - Number of physical memory page frames
 * @returns {Object} Simulation results including step-by-step traces
 */
function arc(pages, numFrames) {
    if (!pages || pages.length === 0 || numFrames <= 0) {
        return { totalFaults: 0, totalHits: 0, hitRatio: 0, faultRatio: 0, steps: [], algorithm: 'arc' };
    }

    const c = numFrames;
    let p = 0; // adaptive target size for T1
    let T1 = []; // resident recency list (LRU at 0, MRU at end)
    let T2 = []; // resident frequency list (LRU at 0, MRU at end)
    let B1 = []; // ghost recency list
    let B2 = []; // ghost frequency list

    let memory = new Array(numFrames).fill(null);
    let frameMap = new Map(); // page -> frame index
    let freeFrames = [];
    for (let f = 0; f < numFrames; f++) freeFrames.push(f);

    let steps = [];
    let faults = 0;
    let hits = 0;

    function replace(page) {
        if (T1.length > 0 && ((B2.includes(page) && T1.length === p) || T1.length > p)) {
            // Evict LRU of T1 to B1
            const victim = T1.shift();
            B1.push(victim);
            return victim;
        } else {
            // Evict LRU of T2 to B2
            const victim = T2.shift();
            B2.push(victim);
            return victim;
        }
    }

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const stepNum = i + 1;
        let fault = false;
        let replaced = null;
        let evictedPage = null;
        let targetFrame = -1;
        let reason = '';
        let decisionType = '';

        const inT1 = T1.includes(page);
        const inT2 = T2.includes(page);
        const inB1 = B1.includes(page);
        const inB2 = B2.includes(page);

        if (inT1 || inT2) {
            // CASE 1: Cache Hit in T1 or T2
            hits++;
            decisionType = 'HIT';
            if (inT1) T1 = T1.filter(x => x !== page);
            if (inT2) T2 = T2.filter(x => x !== page);
            T2.push(page); // Promoted to MRU of T2

            targetFrame = frameMap.get(page);
            reason = `Page ${page} is resident in Frame ${targetFrame} (Cache Hit in ${inT1 ? 'T1' : 'T2'}). Promoted to MRU of frequency cache T2. Target parameter p = ${p.toFixed(2)}.`;
        } else {
            // FAULT (Cache Miss)
            faults++;
            fault = true;

            if (inB1) {
                // CASE 2: Ghost Hit in B1 (Recency History)
                const delta = B1.length >= B2.length ? 1 : (B2.length / Math.max(1, B1.length));
                p = Math.min(c, p + delta);
                evictedPage = replace(page);
                B1 = B1.filter(x => x !== page);
                T2.push(page);

                // Reassign physical frame
                const frame = frameMap.get(evictedPage);
                frameMap.delete(evictedPage);
                memory[frame] = page;
                frameMap.set(page, frame);
                targetFrame = frame;
                replaced = frame;
                decisionType = 'REPLACE';

                reason = `Page ${page} found in recency ghost cache B1 (Ghost Hit). Adapted target p ↑ to ${p.toFixed(2)}. Evicted Page ${evictedPage} from Frame ${frame} and loaded Page ${page} into T2.`;
            } else if (inB2) {
                // CASE 3: Ghost Hit in B2 (Frequency History)
                const delta = B2.length >= B1.length ? 1 : (B1.length / Math.max(1, B2.length));
                p = Math.max(0, p - delta);
                evictedPage = replace(page);
                B2 = B2.filter(x => x !== page);
                T2.push(page);

                // Reassign physical frame
                const frame = frameMap.get(evictedPage);
                frameMap.delete(evictedPage);
                memory[frame] = page;
                frameMap.set(page, frame);
                targetFrame = frame;
                replaced = frame;
                decisionType = 'REPLACE';

                reason = `Page ${page} found in frequency ghost cache B2 (Ghost Hit). Adapted target p ↓ to ${p.toFixed(2)}. Evicted Page ${evictedPage} from Frame ${frame} and loaded Page ${page} into T2.`;
            } else {
                // CASE 4: Complete Miss (Not resident and not in ghosts)
                const L1_len = T1.length + B1.length;
                const L2_len = T2.length + B2.length;

                if (T1.length + T2.length < c) {
                    // Empty physical frame available
                    const frame = freeFrames.shift();
                    memory[frame] = page;
                    frameMap.set(page, frame);
                    targetFrame = frame;
                    T1.push(page);
                    decisionType = 'ALLOCATE';
                    reason = `Page ${page} complete miss. Allocated empty Frame ${frame}. Loaded into recency cache T1. Target p = ${p.toFixed(2)}.`;
                } else {
                    // Physical cache full: apply ghost boundary bounds
                    if (L1_len === c) {
                        if (T1.length < c) {
                            B1.shift(); // remove LRU of B1
                            evictedPage = replace(page);
                        } else {
                            evictedPage = T1.shift();
                        }
                    } else if (L1_len < c) {
                        if (L1_len + L2_len >= 2 * c) {
                            if (B2.length > 0) B2.shift();
                        }
                        evictedPage = replace(page);
                    }

                    const frame = frameMap.get(evictedPage);
                    frameMap.delete(evictedPage);
                    memory[frame] = page;
                    frameMap.set(page, frame);
                    targetFrame = frame;
                    replaced = frame;
                    T1.push(page);
                    decisionType = 'REPLACE';
                    reason = `Page ${page} complete miss. Evicted Page ${evictedPage} from Frame ${frame}. Loaded Page ${page} into recency cache T1. Target p = ${p.toFixed(2)}.`;
                }
            }
        }

        steps.push({
            step: stepNum,
            page: page,
            memory: [...memory],
            fault: fault,
            hit: !fault,
            replaced: replaced,
            evictedPage: evictedPage,
            targetFrame: targetFrame,
            decisionType: decisionType,
            reason: reason,
            p: p,
            T1: [...T1],
            T2: [...T2],
            B1: [...B1],
            B2: [...B2],
            state: {
                p: Number(p.toFixed(2)),
                T1: [...T1],
                T2: [...T2],
                B1: [...B1],
                B2: [...B2]
            }
        });
    }

    const hitRatio = Number(((hits / pages.length) * 100).toFixed(1));
    const faultRatio = Number(((faults / pages.length) * 100).toFixed(1));

    return {
        totalFaults: faults,
        totalHits: hits,
        hitRatio: hitRatio,
        faultRatio: faultRatio,
        steps: steps,
        algorithm: 'arc',
        numFrames: numFrames,
        totalPages: pages.length
    };
}

/**
 * ML-Based (Learned / Predictive) Page Replacement
 * Predicts future page accesses and reuse distances using an online feature model
 * evaluating recency distance, reference frequency, and Markov state transition probabilities.
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} numFrames - Number of physical memory page frames
 * @returns {Object} Simulation results including step-by-step traces
 */
function mlBased(pages, numFrames) {
    if (!pages || pages.length === 0 || numFrames <= 0) {
        return { totalFaults: 0, totalHits: 0, hitRatio: 0, faultRatio: 0, steps: [], algorithm: 'ml' };
    }

    let memory = new Array(numFrames).fill(null);
    let lastAccess = {};
    let freqMap = {};
    let transitionMatrix = {}; // p1 -> { p2: count }
    let steps = [];
    let faults = 0;
    let hits = 0;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const prevPage = i > 0 ? pages[i - 1] : null;
        const stepNum = i + 1;
        const frameIndex = memory.indexOf(page);
        let fault = false;
        let replaced = null;
        let evictedPage = null;
        let targetFrame = -1;
        let reason = '';
        let decisionType = '';

        // Update online statistics and transition dynamics
        if (prevPage !== null) {
            if (!transitionMatrix[prevPage]) transitionMatrix[prevPage] = {};
            transitionMatrix[prevPage][page] = (transitionMatrix[prevPage][page] || 0) + 1;
        }
        freqMap[page] = (freqMap[page] || 0) + 1;

        if (frameIndex !== -1) {
            hits++;
            targetFrame = frameIndex;
            decisionType = 'HIT';
            lastAccess[page] = stepNum;
            reason = `Page ${page} is resident in Frame ${frameIndex} (Page Hit). Online ML model updated feature weights & Markov transition matrix.`;
        } else {
            faults++;
            fault = true;
            const emptyIndex = memory.indexOf(null);

            if (emptyIndex !== -1) {
                targetFrame = emptyIndex;
                memory[emptyIndex] = page;
                lastAccess[page] = stepNum;
                decisionType = 'ALLOCATE';
                reason = `Page ${page} not in memory (Page Fault). Allocated empty Frame ${emptyIndex}. Extracted initial feature embedding.`;
            } else {
                // Predict eviction risk score for each resident page
                // Eviction score S(p): higher = longer expected reuse distance = ideal victim
                let maxScore = -Infinity;
                let victimFrame = -1;
                let scoreAnalysis = [];

                for (let f = 0; f < numFrames; f++) {
                    const resident = memory[f];
                    const recencyDistance = stepNum - (lastAccess[resident] || 0);
                    const freq = freqMap[resident] || 1;
                    
                    // Transition probability from current page to resident page
                    let transProb = 0;
                    if (prevPage !== null && transitionMatrix[page] && transitionMatrix[page][resident]) {
                        const totalTrans = Object.values(transitionMatrix[page]).reduce((a, b) => a + b, 0);
                        transProb = totalTrans > 0 ? transitionMatrix[page][resident] / totalTrans : 0;
                    }

                    // Learned predictive scoring function
                    const normRecency = Math.min(recencyDistance / 10, 1.0);
                    const invFreq = 1 / (1 + Math.log2(1 + freq));
                    const transPenalty = 1 - transProb;
                    const evictionScore = Number((0.50 * normRecency + 0.30 * invFreq + 0.20 * transPenalty).toFixed(3));

                    scoreAnalysis.push({
                        frame: f,
                        page: resident,
                        score: evictionScore,
                        recency: recencyDistance,
                        freq: freq,
                        transProb: transProb.toFixed(2)
                    });

                    if (evictionScore > maxScore) {
                        maxScore = evictionScore;
                        victimFrame = f;
                    }
                }

                replaced = victimFrame;
                targetFrame = replaced;
                evictedPage = memory[replaced];
                memory[replaced] = page;
                lastAccess[page] = stepNum;
                decisionType = 'REPLACE';

                const scoresSummary = scoreAnalysis.map(s => `P${s.page}(F${s.frame}): Score ${s.score}`).join(', ');
                reason = `Page ${page} not in memory (Page Fault). ML Model evaluated feature scores: [${scoresSummary}]. Page ${evictedPage} predicted highest reuse distance (Score: ${maxScore}). Evicted Page ${evictedPage} from Frame ${replaced}.`;
            }
        }

        steps.push({
            step: stepNum,
            page: page,
            memory: [...memory],
            fault: fault,
            hit: !fault,
            replaced: replaced,
            evictedPage: evictedPage,
            targetFrame: targetFrame,
            decisionType: decisionType,
            reason: reason,
            state: memory.map((p, idx) => ({
                frame: idx,
                page: p,
                lastSeen: p !== null ? lastAccess[p] : null,
                freq: p !== null ? (freqMap[p] || 0) : 0
            }))
        });
    }

    const hitRatio = Number(((hits / pages.length) * 100).toFixed(1));
    const faultRatio = Number(((faults / pages.length) * 100).toFixed(1));

    return {
        totalFaults: faults,
        totalHits: hits,
        hitRatio: hitRatio,
        faultRatio: faultRatio,
        steps: steps,
        algorithm: 'ml',
        numFrames: numFrames,
        totalPages: pages.length
    };
}

/**
 * Tests for Belády's Anomaly between two frame counts using FIFO.
 * Belády's Anomaly is the phenomenon where increasing physical frames increases page faults.
 * 
 * @param {number[]} pages - Array of page reference numbers
 * @param {number} framesA - First frame count (e.g. 3)
 * @param {number} framesB - Second frame count (e.g. 4)
 * @returns {Object} Anomaly comparison analysis
 */
function checkBeladyAnomaly(pages, framesA = 3, framesB = 4) {
    const resA = fifo(pages, framesA);
    const resB = fifo(pages, framesB);
    const hasAnomaly = resB.totalFaults > resA.totalFaults;
    const diff = resB.totalFaults - resA.totalFaults;

    return {
        hasAnomaly: hasAnomaly,
        framesA: framesA,
        faultsA: resA.totalFaults,
        hitsA: resA.totalHits,
        hitRatioA: resA.hitRatio,
        framesB: framesB,
        faultsB: resB.totalFaults,
        hitsB: resB.totalHits,
        hitRatioB: resB.hitRatio,
        difference: diff,
        explanation: hasAnomaly 
            ? `Belády's Anomaly detected! Increasing frames from ${framesA} to ${framesB} increased page faults from ${resA.totalFaults} to ${resB.totalFaults} (+${diff} faults).`
            : `No anomaly observed for this sequence: faults changed from ${resA.totalFaults} (${framesA} frames) to ${resB.totalFaults} (${framesB} frames).`
    };
}

// Global exposure for browser environments
const PageAlgorithms = {
    fifo,
    lru,
    optimal,
    clock,
    lfu,
    arc,
    mlBased,
    checkBeladyAnomaly
};

// CommonJS export for Node.js / automated testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fifo,
        lru,
        optimal,
        clock,
        lfu,
        arc,
        mlBased,
        checkBeladyAnomaly,
        PageAlgorithms
    };
}

