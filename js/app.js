/**
 * Application Controller: Page Replacement Simulator & Analysis Workbench
 * Manages simulation state, step-by-step playback, multi-algorithm comparisons, and Bélády anomaly analysis.
 */

// Global simulation state
let visState = {
    results: null,
    currentStep: -1,
    maxStep: 0,
    isPlaying: false,
    intervalId: null,
    pages: [],
    numFrames: 0,
    speedMs: 1200
};

let comparisonChartInstance = null;
let lastComparisonResults = null;

// Initialization on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme from storage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeBtn(savedTheme);

    // Load textbook preset by default
    loadPreset('textbook');

    // Initialize Interactive EAT Calculator
    initEATCalculator();

    // Render formulas
    setTimeout(() => {
        renderMath();
    }, 150);
});

/**
 * Theme Toggle (Light / Dark)
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeBtn(next);

    // Re-render chart with appropriate colors if chart exists
    if (comparisonChartInstance && lastComparisonResults) {
        renderComparisonChart(lastComparisonResults);
    }
}

function updateThemeBtn(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.textContent = theme === 'dark' ? 'Theme: Dark' : 'Theme: Light';
    }
}

/**
 * Main Navigation Tab Switching
 */
function switchMainTab(tabId) {
    document.querySelectorAll('.main-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const target = document.getElementById(tabId);
    if (target) {
        target.classList.add('active');
    }

    const clickedBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => 
        b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)
    );
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    renderMath(target || document.body);
}

/**
 * Theory Sub-Navigation Switching
 */
function switchTheoryTab(theoryId) {
    document.querySelectorAll('.theory-subcontent').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.subnav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const target = document.getElementById(theoryId);
    if (target) {
        target.classList.add('active');
    }

    const clickedBtn = Array.from(document.querySelectorAll('.subnav-btn')).find(b => 
        b.getAttribute('onclick') && b.getAttribute('onclick').includes(theoryId)
    );
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    renderMath(target || document.body);
}

/**
 * Quick Reference String Input Handler
 */
function loadFromQuickInput() {
    const raw = document.getElementById('quickRefString').value.trim();

    if (!raw) {
        showError('Please enter a page reference sequence.');
        return;
    }

    const tokens = raw.split(/[\s,]+/).filter(t => t.length > 0);
    const parsedPages = [];

    for (const t of tokens) {
        const num = parseInt(t, 10);
        if (isNaN(num) || num < 0) {
            showError(`Invalid page value "${t}". All pages must be non-negative integers.`);
            return;
        }
        parsedPages.push(num);
    }

    if (parsedPages.length === 0) {
        showError('Reference string cannot be empty.');
        return;
    }

    hideError();
    resetTable();
    parsedPages.forEach(p => addPageReference(p));
}

/**
 * Generate a random reference sequence with realistic temporal locality
 */
function generateRandomReference() {
    const length = 16;
    const workingSet = [0, 1, 2, 3, 4, 5, 6, 7];
    const pages = [];
    let currentFav = [0, 1, 2];

    for (let i = 0; i < length; i++) {
        if (Math.random() < 0.7) {
            const page = currentFav[Math.floor(Math.random() * currentFav.length)];
            pages.push(page);
        } else {
            const page = workingSet[Math.floor(Math.random() * workingSet.length)];
            pages.push(page);
            currentFav = [page, (page + 1) % 8, (page + 2) % 8];
        }
    }

    document.getElementById('quickRefString').value = pages.join(', ');
    loadFromQuickInput();
}

/**
 * Load Standard Reference String Presets
 */
function loadPreset(presetName) {
    const frameInput = document.getElementById('frameCount');
    const algoInput = document.getElementById('algorithmSelect');
    let pages = [];

    if (presetName === 'textbook') {
        pages = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
        frameInput.value = 3;
        algoInput.value = 'fifo';
    } else if (presetName === 'belady') {
        pages = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
        frameInput.value = 3;
        algoInput.value = 'fifo';
    } else if (presetName === 'locality') {
        pages = [0, 1, 2, 0, 1, 3, 0, 1, 4, 0, 1, 2];
        frameInput.value = 3;
        algoInput.value = 'lru';
    } else if (presetName === 'loop') {
        pages = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
        frameInput.value = 3;
        algoInput.value = 'optimal';
    }

    document.getElementById('quickRefString').value = pages.join(', ');
    hideError();
    resetTable();
    pages.forEach(p => addPageReference(p));
}

/**
 * Validate and parse current inputs
 */
function parseInput() {
    const frameCountVal = parseInt(document.getElementById('frameCount').value, 10);
    const rows = document.querySelectorAll('.page-val');
    
    let pages = [];
    rows.forEach(input => {
        const val = input.value.trim();
        if (val !== '') {
            pages.push(parseInt(val, 10));
        }
    });

    if (pages.length === 0) {
        return { valid: false, msg: 'Reference sequence is empty. Please enter or generate page references.' };
    }
    if (pages.some(isNaN) || pages.some(p => p < 0)) {
        return { valid: false, msg: 'Page references must be non-negative integers.' };
    }
    if (isNaN(frameCountVal) || frameCountVal < 1 || frameCountVal > 10) {
        return { valid: false, msg: 'Physical frame count must be an integer between 1 and 10.' };
    }

    document.getElementById('quickRefString').value = pages.join(', ');

    return { valid: true, pages, frames: frameCountVal };
}

/**
 * Reference table manipulation
 */
function addPageReference(val = '') {
    const tbody = document.getElementById('referenceTableBody');
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="step-num">${rowCount}</td>
        <td><input type="number" class="page-val form-input mono" value="${val}" min="0" oninput="syncQuickStringFromTable()"></td>
        <td><button class="btn btn-sm btn-danger" onclick="removeRow(this)">Remove</button></td>
    `;
    tbody.appendChild(tr);
}

function removeRow(btn) {
    const tr = btn.closest('tr');
    tr.remove();
    const rows = document.querySelectorAll('#referenceTableBody tr');
    rows.forEach((row, index) => {
        row.querySelector('.step-num').textContent = index + 1;
    });
    syncQuickStringFromTable();
}

function resetTable() {
    document.getElementById('referenceTableBody').innerHTML = '';
}

function syncQuickStringFromTable() {
    const rows = document.querySelectorAll('.page-val');
    const pages = [];
    rows.forEach(r => {
        if (r.value.trim() !== '') pages.push(r.value.trim());
    });
    document.getElementById('quickRefString').value = pages.join(', ');
}

function showError(msg) {
    const errEl = document.getElementById('inputError');
    errEl.textContent = msg;
    errEl.style.display = 'block';
}

function hideError() {
    const errEl = document.getElementById('inputError');
    errEl.textContent = '';
    errEl.style.display = 'none';
}

/**
 * Execute Simulation
 */
function runSimulation() {
    const input = parseInput();
    if (!input.valid) {
        showError(input.msg);
        return;
    }
    hideError();

    const algo = document.getElementById('algorithmSelect').value;
    let results;

    if (algo === 'fifo') results = PageAlgorithms.fifo(input.pages, input.frames);
    else if (algo === 'lru') results = PageAlgorithms.lru(input.pages, input.frames);
    else if (algo === 'optimal') results = PageAlgorithms.optimal(input.pages, input.frames);
    else if (algo === 'clock') results = PageAlgorithms.clock(input.pages, input.frames);
    else if (algo === 'lfu') results = PageAlgorithms.lfu(input.pages, input.frames);
    else if (algo === 'arc') results = PageAlgorithms.arc(input.pages, input.frames);
    else if (algo === 'ml') results = PageAlgorithms.mlBased(input.pages, input.frames);

    const algoNames = {
        fifo: 'FIFO (First-In, First-Out)',
        lru: 'LRU (Least Recently Used)',
        optimal: 'Optimal (Bélády\'s MIN)',
        clock: 'Clock (Second-Chance)',
        lfu: 'LFU (Least Frequently Used)',
        arc: 'ARC (Adaptive Replacement Cache)',
        ml: 'ML-Based (Learned Replacement)'
    };

    // Update results header & metrics strip
    document.getElementById('currentAlgoTitle').textContent = algoNames[algo];
    document.getElementById('frameConfigBadge').textContent = `${input.frames} Frames allocated`;
    document.getElementById('resultsSection').style.display = 'block';

    document.getElementById('totalRefs').textContent = input.pages.length;
    document.getElementById('totalFaults').textContent = results.totalFaults;
    document.getElementById('totalHits').textContent = results.totalHits;
    document.getElementById('hitRatio').textContent = results.hitRatio + '%';
    document.getElementById('faultRatio').textContent = results.faultRatio + '%';

    // Initialize visualizer state
    visState.results = results;
    visState.pages = input.pages;
    visState.numFrames = input.frames;
    visState.maxStep = results.steps.length - 1;

    resetVisualization();
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Render Classroom Memory Allocation Matrix
 */
function renderClassroomTable() {
    const container = document.getElementById('classroomTable');
    container.innerHTML = '';

    const { results, currentStep, maxStep, pages, numFrames } = visState;
    if (!results) return;

    for (let i = 0; i <= maxStep; i++) {
        const col = document.createElement('div');
        col.className = 'matrix-col';

        const stepData = results.steps[i];
        const isCurrentStep = (i === currentStep);
        const isPastOrCurrent = (i <= currentStep);

        if (isCurrentStep) col.classList.add('active-step');
        if (!isPastOrCurrent) col.classList.add('future-step');

        // Step index header (t=1, 2...)
        const stepIndex = document.createElement('div');
        stepIndex.className = 'matrix-step-index mono';
        stepIndex.textContent = `t=${i + 1}`;
        col.appendChild(stepIndex);

        // Requested Page
        const pageHeader = document.createElement('div');
        pageHeader.className = 'matrix-page-ref mono';
        pageHeader.textContent = pages[i];
        col.appendChild(pageHeader);

        // Frames Column
        const frameContainer = document.createElement('div');
        frameContainer.className = 'matrix-frame-stack';

        for (let f = 0; f < numFrames; f++) {
            const frameCell = document.createElement('div');
            frameCell.className = 'matrix-cell mono';

            if (isPastOrCurrent) {
                const val = stepData.memory[f];
                frameCell.textContent = val !== null ? val : '—';

                if (stepData.fault) {
                    if (stepData.replaced === f) {
                        frameCell.classList.add('cell-evicted');
                    } else if (stepData.targetFrame === f && stepData.decisionType === 'ALLOCATE') {
                        frameCell.classList.add('cell-allocated');
                    }
                } else if (!stepData.fault && stepData.targetFrame === f) {
                    frameCell.classList.add('cell-hit');
                }
            } else {
                frameCell.textContent = ' ';
            }
            frameContainer.appendChild(frameCell);
        }
        col.appendChild(frameContainer);

        // Status (Hit / Fault)
        const statusEl = document.createElement('div');
        statusEl.className = 'matrix-status-label';
        if (isPastOrCurrent) {
            if (stepData.fault) {
                statusEl.textContent = 'Fault';
                statusEl.classList.add('status-fault');
            } else {
                statusEl.textContent = 'Hit';
                statusEl.classList.add('status-hit');
            }
        } else {
            statusEl.textContent = '—';
        }
        col.appendChild(statusEl);

        container.appendChild(col);
    }

    // Scroll active step into view smoothly
    const activeColEl = container.querySelector('.active-step');
    if (activeColEl) {
        activeColEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    updateStepExplanation();
}

/**
 * Update Step Explanation Box & State Inspector
 */
function updateStepExplanation() {
    const { results, currentStep, maxStep } = visState;
    const badgeEl = document.getElementById('decisionBadge');
    const pageTextEl = document.getElementById('decisionPageText');
    const textEl = document.getElementById('visExplanationText');
    const inspectorEl = document.getElementById('stateInspector');
    const inspectorLabel = document.getElementById('inspectorLabel');
    const inspectorContent = document.getElementById('inspectorContent');
    const stepCounterEl = document.getElementById('stepCounterBadge');

    if (currentStep === -1) {
        stepCounterEl.textContent = `Step: 0 / ${maxStep + 1}`;
        badgeEl.textContent = 'INITIAL';
        badgeEl.className = 'status-tag tag-neutral';
        pageTextEl.textContent = 'Simulation ready';
        textEl.textContent = 'Click "Play" or "Step Forward" to step through memory reference execution.';
        inspectorEl.style.display = 'none';
        return;
    }

    const step = results.steps[currentStep];
    stepCounterEl.textContent = `Step: ${currentStep + 1} / ${maxStep + 1}`;

    if (step.decisionType === 'HIT') {
        badgeEl.textContent = 'PAGE HIT';
        badgeEl.className = 'status-tag tag-hit';
        pageTextEl.textContent = `Referenced Page ${step.page} (Resident in Frame ${step.targetFrame})`;
    } else if (step.decisionType === 'ALLOCATE') {
        badgeEl.textContent = 'PAGE FAULT (ALLOCATE)';
        badgeEl.className = 'status-tag tag-allocated';
        pageTextEl.textContent = `Referenced Page ${step.page} (Loaded into Frame ${step.targetFrame})`;
    } else if (step.decisionType === 'REPLACE') {
        badgeEl.textContent = 'PAGE FAULT (EVICT)';
        badgeEl.className = 'status-tag tag-fault';
        pageTextEl.textContent = `Referenced Page ${step.page} (Evicted Page ${step.evictedPage} from Frame ${step.targetFrame})`;
    }

    textEl.innerHTML = step.reason;

    // Render Data Structure State Inspector
    inspectorEl.style.display = 'block';
    inspectorContent.innerHTML = '';

    if (results.algorithm === 'fifo') {
        inspectorLabel.textContent = 'FIFO Arrival Queue (Oldest / Eviction candidate → Newest):';
        if (step.queuePages && step.queuePages.length > 0) {
            step.queuePages.forEach((p, idx) => {
                const item = document.createElement('span');
                item.className = `state-chip mono ${idx === 0 ? 'chip-evict' : ''}`;
                item.textContent = (idx === 0 ? 'Oldest: Page ' : 'Page ') + p;
                inspectorContent.appendChild(item);
            });
        }
    } else if (results.algorithm === 'lru') {
        inspectorLabel.textContent = 'LRU Recency Order (Least Recently Used → Most Recently Used):';
        if (step.usagePages && step.usagePages.length > 0) {
            step.usagePages.forEach((p, idx) => {
                const item = document.createElement('span');
                const isLRU = (idx === 0);
                const isMRU = (idx === step.usagePages.length - 1);
                item.className = `state-chip mono ${isLRU ? 'chip-evict' : isMRU ? 'chip-mru' : ''}`;
                item.textContent = (isLRU ? 'LRU: Page ' : isMRU ? 'MRU: Page ' : 'Page ') + p;
                inspectorContent.appendChild(item);
            });
        }
    } else if (results.algorithm === 'optimal') {
        inspectorLabel.textContent = 'Lookahead Distance Analysis for Resident Frames:';
        if (step.lookaheadDetails) {
            step.lookaheadDetails.forEach(item => {
                const chip = document.createElement('span');
                chip.className = `state-chip mono ${item.nextStep === 'Never' ? 'chip-evict' : ''}`;
                chip.textContent = item.page !== null ? `Frame ${item.frame} (Page ${item.page}): Next used ${item.nextStep}` : `Frame ${item.frame}: Empty`;
                inspectorContent.appendChild(chip);
            });
        }
    } else if (results.algorithm === 'clock') {
        inspectorLabel.textContent = `Clock Circular Buffer & Pointer (Hand at Frame ${step.clockHand}):`;
        if (step.state) {
            step.state.forEach(item => {
                const chip = document.createElement('span');
                const isVictim = (step.replaced === item.frame);
                chip.className = `state-chip mono ${item.isHand ? 'chip-hand' : ''} ${isVictim ? 'chip-evict' : ''}`;
                const handIcon = item.isHand ? ' 👈 Hand' : '';
                chip.textContent = item.page !== null 
                    ? `F${item.frame} [P${item.page} | Bit=${item.refBit}]${handIcon}` 
                    : `F${item.frame} [Empty | Bit=0]${handIcon}`;
                inspectorContent.appendChild(chip);
            });
        }
    } else if (results.algorithm === 'lfu') {
        inspectorLabel.textContent = 'LFU Reference Frequency State (Resident Frames):';
        if (step.state) {
            step.state.forEach(item => {
                const chip = document.createElement('span');
                const isVictim = (step.replaced === item.frame);
                chip.className = `state-chip mono ${isVictim ? 'chip-evict' : ''}`;
                chip.textContent = item.page !== null 
                    ? `F${item.frame} [Page ${item.page}: ${item.freq} refs]` 
                    : `F${item.frame} [Empty]`;
                inspectorContent.appendChild(chip);
            });
        }
    } else if (results.algorithm === 'arc') {
        inspectorLabel.textContent = `ARC Adaptive State (Target p = ${step.p.toFixed(2)} | Resident: ${step.T1.length + step.T2.length}/${visState.numFrames}):`;
        
        const chipP = document.createElement('span');
        chipP.className = 'state-chip chip-highlight mono';
        chipP.textContent = `Adaptive Target p: ${step.p.toFixed(2)}`;
        inspectorContent.appendChild(chipP);

        const chipT1 = document.createElement('span');
        chipT1.className = 'state-chip mono';
        chipT1.textContent = `T1 (Recency): [${step.T1.join(', ') || 'empty'}]`;
        inspectorContent.appendChild(chipT1);

        const chipT2 = document.createElement('span');
        chipT2.className = 'state-chip chip-mru mono';
        chipT2.textContent = `T2 (Frequency): [${step.T2.join(', ') || 'empty'}]`;
        inspectorContent.appendChild(chipT2);

        const chipB1 = document.createElement('span');
        chipB1.className = 'state-chip chip-ghost mono';
        chipB1.textContent = `B1 (Ghost Recency): [${step.B1.join(', ') || 'empty'}]`;
        inspectorContent.appendChild(chipB1);

        const chipB2 = document.createElement('span');
        chipB2.className = 'state-chip chip-ghost mono';
        chipB2.textContent = `B2 (Ghost Frequency): [${step.B2.join(', ') || 'empty'}]`;
        inspectorContent.appendChild(chipB2);
    } else if (results.algorithm === 'ml') {
        inspectorLabel.textContent = 'ML-Based Predictive Model Feature State:';
        if (step.state) {
            step.state.forEach(item => {
                const chip = document.createElement('span');
                const isVictim = (step.replaced === item.frame);
                chip.className = `state-chip mono ${isVictim ? 'chip-evict' : ''}`;
                chip.textContent = item.page !== null 
                    ? `F${item.frame} (Page ${item.page}): Freq=${item.freq}, LastSeen=t=${item.lastSeen || '-'}` 
                    : `F${item.frame}: Empty`;
                inspectorContent.appendChild(chip);
            });
        }
    }
}

/**
 * Playback Controls
 */
function startVisualization() {
    if (!visState.results) return;
    visState.isPlaying = true;

    document.getElementById('btnStartVis').disabled = true;
    document.getElementById('btnPauseVis').disabled = false;
    document.getElementById('btnNextStep').disabled = true;
    document.getElementById('btnPrevStep').disabled = true;

    if (visState.currentStep >= visState.maxStep) {
        visState.currentStep = -1;
    }

    visState.intervalId = setInterval(() => {
        if (visState.currentStep >= visState.maxStep) {
            pauseVisualization();
            return;
        }
        visState.currentStep++;
        renderClassroomTable();
    }, visState.speedMs);
}

function pauseVisualization() {
    visState.isPlaying = false;
    clearInterval(visState.intervalId);

    document.getElementById('btnStartVis').disabled = false;
    document.getElementById('btnPauseVis').disabled = true;
    document.getElementById('btnNextStep').disabled = (visState.currentStep >= visState.maxStep);
    document.getElementById('btnPrevStep').disabled = (visState.currentStep < 0);
}

function nextStep() {
    if (visState.currentStep >= visState.maxStep) return;
    visState.currentStep++;
    renderClassroomTable();
    document.getElementById('btnPrevStep').disabled = false;
    if (visState.currentStep >= visState.maxStep) {
        document.getElementById('btnNextStep').disabled = true;
    }
}

function prevStep() {
    if (visState.currentStep < 0) return;
    visState.currentStep--;
    renderClassroomTable();
    document.getElementById('btnNextStep').disabled = false;
    if (visState.currentStep < 0) {
        document.getElementById('btnPrevStep').disabled = true;
    }
}

function resetVisualization() {
    pauseVisualization();
    visState.currentStep = -1;
    renderClassroomTable();
    document.getElementById('btnStartVis').disabled = false;
    document.getElementById('btnNextStep').disabled = false;
    document.getElementById('btnPrevStep').disabled = true;
}

function updateVisSpeed(val) {
    visState.speedMs = parseInt(val, 10);
    if (visState.isPlaying) {
        pauseVisualization();
        startVisualization();
    }
}

/**
 * Multi-Algorithm Comparison
 */
function compareAlgorithms() {
    const input = parseInput();
    if (!input.valid) {
        showError(input.msg);
        return;
    }
    hideError();

    const optRes = PageAlgorithms.optimal(input.pages, input.frames);
    const lruRes = PageAlgorithms.lru(input.pages, input.frames);
    const clockRes = PageAlgorithms.clock(input.pages, input.frames);
    const lfuRes = PageAlgorithms.lfu(input.pages, input.frames);
    const arcRes = PageAlgorithms.arc(input.pages, input.frames);
    const mlRes = PageAlgorithms.mlBased(input.pages, input.frames);
    const fifoRes = PageAlgorithms.fifo(input.pages, input.frames);

    const results = [
        { name: 'Optimal (Bélády\'s MIN)', key: 'Optimal', res: optRes, badge: 'Theoretical Benchmark' },
        { name: 'LRU (Least Recently Used)', key: 'LRU', res: lruRes, badge: 'Temporal Locality' },
        { name: 'Clock (Second-Chance)', key: 'Clock', res: clockRes, badge: 'LRU Approximation' },
        { name: 'LFU (Least Frequently Used)', key: 'LFU', res: lfuRes, badge: 'Frequency Counter' },
        { name: 'ARC (Adaptive Cache)', key: 'ARC', res: arcRes, badge: 'Self-Tuning' },
        { name: 'ML-Based (Predictive)', key: 'ML-Based', res: mlRes, badge: 'Learned Caching' },
        { name: 'FIFO (First-In, First-Out)', key: 'FIFO', res: fifoRes, badge: 'Arrival Order' }
    ];

    lastComparisonResults = results;
    const minFaults = Math.min(...results.map(r => r.res.totalFaults));

    // Render Compact Comparison Cards
    const cardsGrid = document.getElementById('comparisonCardsGrid');
    cardsGrid.innerHTML = '';

    results.forEach(item => {
        const isBest = (item.res.totalFaults === minFaults);
        const card = document.createElement('div');
        card.className = `stat-panel ${isBest ? 'panel-highlight' : ''}`;
        card.innerHTML = `
            <div class="panel-header">
                <span class="panel-title">${item.name}</span>
                ${isBest ? '<span class="status-tag tag-hit">Lowest Faults</span>' : `<span class="status-tag tag-neutral">${item.badge}</span>`}
            </div>
            <div class="panel-data-row">
                <div class="data-point">
                    <span class="data-label">Page Faults</span>
                    <span class="data-val text-fault">${item.res.totalFaults}</span>
                </div>
                <div class="data-point">
                    <span class="data-label">Hits</span>
                    <span class="data-val text-hit">${item.res.totalHits}</span>
                </div>
                <div class="data-point">
                    <span class="data-label">Hit Ratio</span>
                    <span class="data-val text-accent">${item.res.hitRatio}%</span>
                </div>
            </div>
            <p class="panel-desc">${getPerformanceSummary(item.key, item.res.totalFaults, minFaults)}</p>
        `;
        cardsGrid.appendChild(card);
    });

    // Render Comparison Table
    const tbody = document.getElementById('comparisonTableBody');
    tbody.innerHTML = '';

    const algoNotes = {
        'Optimal': 'Provably minimal page fault lower bound (clairvoyant offline trace analysis)',
        'LRU': 'Exploits temporal locality; proven stack algorithm immune to Bélády anomaly',
        'Clock': 'Hardware-efficient 1-bit reference second-chance approximation of LRU',
        'LFU': 'Evicts lowest frequency page; effective for long-term popularity distributions',
        'ARC': 'Dynamically tunes size of recency and frequency lists with zero manual heuristics',
        'ML-Based': 'Learned model predicting future reuse distances based on feature representations',
        'FIFO': 'Simple arrival timestamp queue; vulnerable to Bélády anomaly (non-stack algorithm)'
    };

    results.forEach(item => {
        const isBest = (item.res.totalFaults === minFaults);
        const tr = document.createElement('tr');
        if (isBest) tr.classList.add('row-highlight');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td class="mono">${input.frames}</td>
            <td class="mono">${input.pages.length}</td>
            <td class="mono text-fault"><strong>${item.res.totalFaults}</strong></td>
            <td class="mono text-hit"><strong>${item.res.totalHits}</strong></td>
            <td class="mono">${item.res.hitRatio}%</td>
            <td class="mono">${item.res.faultRatio}%</td>
            <td>${isBest && item.key !== 'Optimal' ? '<strong>★ Matches Optimal Benchmark</strong> — ' : ''}${algoNotes[item.key] || ''}</td>
        `;
        tbody.appendChild(tr);
    });

    renderComparisonChart(results);
    switchMainTab('tabComparison');
}

function getPerformanceSummary(algo, faults, minFaults) {
    if (algo === 'Optimal') {
        return 'Achieves theoretical lower bound on page faults for this sequence and frame allocation.';
    } else if (algo === 'LRU') {
        const diff = faults - minFaults;
        return diff === 0 
            ? 'Matches the optimal benchmark on this sequence; exploits temporal locality effectively.'
            : `${diff} fault(s) above optimal; true stack algorithm immune to Bélády anomaly.`;
    } else if (algo === 'Clock') {
        const diff = faults - minFaults;
        return `${diff} fault(s) above optimal. Hardware-efficient second-chance approximation of LRU.`;
    } else if (algo === 'LFU') {
        const diff = faults - minFaults;
        return `${diff} fault(s) above optimal. Evicts by reference frequency count; benefits stable popularity workloads.`;
    } else if (algo === 'ARC') {
        const diff = faults - minFaults;
        return `${diff} fault(s) above optimal. Self-tuning adaptive cache balancing recency and frequency online.`;
    } else if (algo === 'ML-Based') {
        const diff = faults - minFaults;
        return `${diff} fault(s) above optimal. Learned predictive model estimating future reuse intervals.`;
    } else {
        const diff = faults - minFaults;
        return `${diff} fault(s) above optimal. Replaces pages purely by arrival order regardless of reuse.`;
    }
}

function renderComparisonChart(results) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: results.map(r => r.key),
            datasets: [
                {
                    label: 'Page Faults',
                    data: results.map(r => r.res.totalFaults),
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.75)' : 'rgba(220, 38, 38, 0.8)',
                    borderColor: '#dc2626',
                    borderWidth: 1,
                    borderRadius: 3
                },
                {
                    label: 'Page Hits',
                    data: results.map(r => r.res.totalHits),
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.75)' : 'rgba(22, 163, 74, 0.8)',
                    borderColor: '#16a34a',
                    borderWidth: 1,
                    borderRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor, font: { family: 'inherit', size: 12, weight: '600' } }
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const idx = context[0].dataIndex;
                            const res = results[idx].res;
                            return `Hit Ratio: ${res.hitRatio}%\nFault Ratio: ${res.faultRatio}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, font: { family: 'monospace', size: 11 } },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor, font: { family: 'inherit', size: 12, weight: '600' } },
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Bélády's Anomaly Lab Runner
 */
function runBeladyLab() {
    switchMainTab('tabBelady');
    runBeladyExperiment();
}

function runBeladyExperiment() {
    const pages = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
    const anomalyData = PageAlgorithms.checkBeladyAnomaly(pages, 3, 4);
    const resA = PageAlgorithms.fifo(pages, 3);
    const resB = PageAlgorithms.fifo(pages, 4);

    document.getElementById('beladyResultsCard').style.display = 'block';

    document.getElementById('beladyFaultsA').textContent = `${anomalyData.faultsA} Faults`;
    document.getElementById('beladyFaultsB').textContent = `${anomalyData.faultsB} Faults`;

    document.getElementById('beladyVerdictText').innerHTML = `
        <strong>Empirical Result:</strong> Increasing allocated physical frames from 3 to 4 increased page faults from ${anomalyData.faultsA} to ${anomalyData.faultsB} (+${anomalyData.difference} fault).<br>
        This demonstrates that FIFO violates the subset inclusion condition $M_t(m) \\subseteq M_t(m+1)$, proving that FIFO is not a stack algorithm.
    `;

    renderStaticMatrix('beladyTableA', resA, pages, 3);
    renderStaticMatrix('beladyTableB', resB, pages, 4);
}

function renderStaticMatrix(containerId, results, pages, numFrames) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    for (let i = 0; i < pages.length; i++) {
        const col = document.createElement('div');
        col.className = 'matrix-col active-step';

        const stepData = results.steps[i];

        const stepIndex = document.createElement('div');
        stepIndex.className = 'matrix-step-index mono';
        stepIndex.textContent = `t=${i + 1}`;
        col.appendChild(stepIndex);

        const pageHeader = document.createElement('div');
        pageHeader.className = 'matrix-page-ref mono';
        pageHeader.textContent = pages[i];
        col.appendChild(pageHeader);

        const frameContainer = document.createElement('div');
        frameContainer.className = 'matrix-frame-stack';

        for (let f = 0; f < numFrames; f++) {
            const frameCell = document.createElement('div');
            frameCell.className = 'matrix-cell mono';
            const val = stepData.memory[f];
            frameCell.textContent = val !== null ? val : '—';

            if (stepData.fault) {
                if (stepData.replaced === f) {
                    frameCell.classList.add('cell-evicted');
                } else if (stepData.targetFrame === f && stepData.decisionType === 'ALLOCATE') {
                    frameCell.classList.add('cell-allocated');
                }
            } else if (!stepData.fault && stepData.targetFrame === f) {
                frameCell.classList.add('cell-hit');
            }
            frameContainer.appendChild(frameCell);
        }
        col.appendChild(frameContainer);

        const statusEl = document.createElement('div');
        statusEl.className = 'matrix-status-label';
        if (stepData.fault) {
            statusEl.textContent = 'Fault';
            statusEl.classList.add('status-fault');
        } else {
            statusEl.textContent = 'Hit';
            statusEl.classList.add('status-hit');
        }
        col.appendChild(statusEl);

        container.appendChild(col);
    }
}

/**
 * Mathematical LaTeX / KaTeX Formula Renderer & Fallback
 */
function renderMath(targetElement = document.body) {
    if (typeof renderMathInElement === 'function') {
        try {
            renderMathInElement(targetElement, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
            return;
        } catch (e) {
            console.warn('KaTeX auto-render error, executing fallback:', e);
        }
    }
    fallbackFormatMath(targetElement);
}

/**
 * Fallback Math Formatter (in case KaTeX CDN is offline or blocked)
 */
function fallbackFormatMath(root = document.body) {
    const formulaContainers = root.querySelectorAll('.formula-display');
    formulaContainers.forEach(el => {
        if (el.querySelector('.katex')) return;
        const raw = el.innerHTML;
        if (raw.includes('Hits') && raw.includes('Faults')) {
            el.innerHTML = `
                <div class="clean-math-row">
                    <span class="math-eq">HR = <span class="math-fraction"><span class="math-num">Hits</span><span class="math-denom">N</span></span> &times; 100%</span>
                    <span class="math-sep">&emsp;&emsp;</span>
                    <span class="math-eq">FR = <span class="math-fraction"><span class="math-num">Faults</span><span class="math-denom">N</span></span> &times; 100% = 100% &minus; HR</span>
                </div>
            `;
        } else if (raw.includes('EAT') && raw.includes('T_{\\text{mem}}')) {
            el.innerHTML = `
                <div class="clean-math-row">
                    <span class="math-eq">EAT = (1 &minus; <span class="math-var">p</span>) &times; <span class="math-var">T</span><sub>mem</sub> + <span class="math-var">p</span> &times; <span class="math-var">T</span><sub>fault</sub></span>
                </div>
            `;
        } else if (raw.includes('8,099.9')) {
            el.innerHTML = `
                <div class="clean-math-row">
                    <span class="math-eq">EAT = (1 &minus; 0.001) &times; 100 ns + 0.001 &times; 8,000,000 ns = 99.9 ns + 8,000 ns = <strong>8,099.9 ns &approx; 8.1 &mu;s</strong></span>
                </div>
            `;
        } else if (raw.includes('M_t(m)')) {
            el.innerHTML = `<em>M<sub>t</sub>(m) &sube; M<sub>t</sub>(m + 1)</em>`;
        }
    });
}

/**
 * Interactive EAT & Performance Calculator
 */
function initEATCalculator() {
    const pInput = document.getElementById('eatProbInput');
    const tMemInput = document.getElementById('eatTMemInput');
    const tFaultInput = document.getElementById('eatTFaultInput');
    
    if (pInput && tMemInput && tFaultInput) {
        pInput.addEventListener('input', updateEATCalculation);
        tMemInput.addEventListener('input', updateEATCalculation);
        tFaultInput.addEventListener('input', updateEATCalculation);
        updateEATCalculation();
    }
}

function updateEATCalculation() {
    const pInput = document.getElementById('eatProbInput');
    const tMemInput = document.getElementById('eatTMemInput');
    const tFaultInput = document.getElementById('eatTFaultInput');
    if (!pInput || !tMemInput || !tFaultInput) return;

    let pVal = parseFloat(pInput.value) || 0;
    const tMem = parseFloat(tMemInput.value) || 100;
    const tFaultMs = parseFloat(tFaultInput.value) || 8;
    
    // Normalize p: if entered as percentage (> 1, e.g. 5%), convert to decimal 0.05
    const p = pVal > 1 ? pVal / 100 : Math.max(0, Math.min(1, pVal));
    const tFaultNs = tFaultMs * 1000000;
    
    const hitComponent = (1 - p) * tMem;
    const faultComponent = p * tFaultNs;
    const eatNs = hitComponent + faultComponent;
    const eatUs = eatNs / 1000;
    const eatMs = eatNs / 1000000;
    const slowdown = (eatNs / tMem).toFixed(1);

    const resNsEl = document.getElementById('eatResultNs');
    const resUsEl = document.getElementById('eatResultUs');
    const slowEl = document.getElementById('eatSlowdownVal');
    const hitEl = document.getElementById('eatHitPart');
    const faultEl = document.getElementById('eatFaultPart');

    if (resNsEl) resNsEl.textContent = `${eatNs.toLocaleString('en-US', { maximumFractionDigits: 1 })} ns`;
    if (resUsEl) resUsEl.textContent = `${eatUs.toFixed(2)} µs (${eatMs.toFixed(3)} ms)`;
    if (slowEl) slowEl.textContent = `${slowdown}×`;
    if (hitEl) hitEl.textContent = `${hitComponent.toFixed(1)} ns`;
    if (faultEl) faultEl.textContent = `${faultComponent.toLocaleString('en-US', { maximumFractionDigits: 0 })} ns`;

    const hitPct = Math.max(1, Math.min(99, (hitComponent / eatNs) * 100));
    const faultPct = 100 - hitPct;
    const barHit = document.getElementById('eatBarHit');
    const barFault = document.getElementById('eatBarFault');
    if (barHit) barHit.style.width = `${hitPct}%`;
    if (barFault) barFault.style.width = `${faultPct}%`;
}

function syncSimulationToEAT() {
    if (!visState.results) {
        showError('Please run a simulation first to sync its metrics!');
        return;
    }
    const faultProb = (visState.results.faultRatio / 100);
    const pInput = document.getElementById('eatProbInput');
    if (pInput) {
        pInput.value = faultProb.toFixed(4);
        updateEATCalculation();
        switchTheoryTab('theoryFormulas');
        switchMainTab('tabTheory');
    }
}

