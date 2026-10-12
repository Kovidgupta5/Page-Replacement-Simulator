/**
 * Stack Data Structure Visualizer
 * Simulates a LIFO (Last-In, First-Out) stack.
 */

const MAX_STACK_SIZE = 5;
let stack = [];
let isDemoRunning = false;

/**
 * Handle tab switching
 */
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).style.display = 'block';
    setTimeout(() => document.getElementById(tabId).classList.add('active'), 10);
    
    // Find the button that was clicked and activate it
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

/**
 * Set the message text and style
 */
function setStackMessage(text, type = 'msg-info') {
    const msgEl = document.getElementById('stackMessage');
    msgEl.textContent = text;
    msgEl.className = `stack-message ${type}`;
}

/**
 * Update the visual representation of the stack
 */
function renderStack() {
    const container = document.getElementById('stackContainer');
    container.innerHTML = '';

    // Create DOM elements for each item in the stack (bottom to top)
    // The container uses flex-direction: column-reverse, so appending in order works
    stack.forEach((val, index) => {
        const item = document.createElement('div');
        item.className = 'stack-item';
        
        // Mark the top item
        if (index === stack.length - 1) {
            item.classList.add('top-item');
        }
        
        item.textContent = val;
        container.appendChild(item);
    });
}

/**
 * Update the pseudocode and explanation box
 */
function updateStackCode(action, value = null) {
    const codeBlock = document.getElementById('stackCodeBlock');
    const explanation = document.getElementById('stackExplanation');

    if (action === 'push') {
        codeBlock.innerHTML = `function push(value):
<span class="code-line-highlight">  if (top == MAX_SIZE)</span>
    return "Overflow"
  top = top + 1
  stack[top] = value`;
        explanation.innerHTML = `<strong>Push(${value})</strong>: Checks if the stack is full. Since it isn't, it adds the value to the top of the stack.`;
    } else if (action === 'pop') {
        codeBlock.innerHTML = `function pop():
<span class="code-line-highlight">  if (top == 0)</span>
    return "Underflow"
  value = stack[top]
  top = top - 1
  return value`;
        explanation.innerHTML = `<strong>Pop()</strong>: Checks if the stack is empty. Since it isn't, it removes and returns the top element.`;
    } else if (action === 'peek') {
        codeBlock.innerHTML = `function peek():
  if (top == 0)
    return "Underflow"
<span class="code-line-highlight">  return stack[top]</span>`;
        explanation.innerHTML = `<strong>Peek()</strong>: Returns the value of the top element without removing it.`;
    } else if (action === 'overflow') {
        codeBlock.innerHTML = `function push(value):
<span class="code-line-highlight">  if (top == MAX_SIZE)</span>
<span class="code-line-highlight">    return "Overflow"</span>
  ...`;
        explanation.innerHTML = `<strong>Overflow Error!</strong> The stack can only hold \${MAX_STACK_SIZE} items. Cannot push \${value}.`;
    } else if (action === 'underflow') {
        codeBlock.innerHTML = `function pop/peek():
<span class="code-line-highlight">  if (top == 0)</span>
<span class="code-line-highlight">    return "Underflow"</span>
  ...`;
        explanation.innerHTML = `<strong>Underflow Error!</strong> The stack is empty. Nothing to pop or peek.`;
    }
}

/**
 * Push an item onto the stack
 */
function stackPush(demoValue = null) {
    if (isDemoRunning && demoValue === null) return;
    
    const inputEl = document.getElementById('stackInput');
    let value = demoValue !== null ? demoValue : inputEl.value.trim();
    
    if (!value) {
        setStackMessage('Please enter a value to push.', 'msg-error');
        return;
    }

    if (stack.length >= MAX_STACK_SIZE) {
        setStackMessage(`Stack Overflow! Cannot push '\${value}'.`, 'msg-error');
        updateStackCode('overflow', value);
        return;
    }

    stack.push(value);
    inputEl.value = '';
    
    setStackMessage(`Pushed '\${value}' to the stack.`, 'msg-success');
    updateStackCode('push', value);
    renderStack();
}

/**
 * Pop an item from the stack
 */
function stackPop(fromDemo = false) {
    if (isDemoRunning && !fromDemo) return;

    if (stack.length === 0) {
        setStackMessage('Stack Underflow! The stack is empty.', 'msg-error');
        updateStackCode('underflow');
        return;
    }

    // Animate pop
    const container = document.getElementById('stackContainer');
    const topItem = container.lastElementChild;
    if (topItem) {
        topItem.classList.add('popping');
        topItem.classList.remove('top-item'); // Remove the TOP arrow immediately
        
        // Wait for animation
        setTimeout(() => {
            const poppedValue = stack.pop();
            setStackMessage(`Popped '\${poppedValue}' from the stack.`, 'msg-success');
            updateStackCode('pop');
            renderStack();
        }, 300);
    }
}

/**
 * Peek at the top item
 */
function stackPeek(fromDemo = false) {
    if (isDemoRunning && !fromDemo) return;

    if (stack.length === 0) {
        setStackMessage('Stack Underflow! The stack is empty.', 'msg-error');
        updateStackCode('underflow');
        return;
    }

    const topValue = stack[stack.length - 1];
    setStackMessage(`Top element is '\${topValue}'.`, 'msg-info');
    updateStackCode('peek');
    
    // Briefly highlight the top item
    const container = document.getElementById('stackContainer');
    const topItem = container.lastElementChild;
    if (topItem) {
        topItem.style.backgroundColor = 'var(--warning-color)';
        topItem.style.color = 'black';
        setTimeout(() => {
            topItem.style.backgroundColor = '';
            topItem.style.color = '';
        }, 800);
    }
}

/**
 * Reset the stack
 */
function stackReset() {
    stack = [];
    isDemoRunning = false;
    document.getElementById('stackInput').value = '';
    setStackMessage('Stack reset.', 'msg-info');
    document.getElementById('stackCodeBlock').innerHTML = '// Waiting for action...';
    document.getElementById('stackExplanation').innerHTML = 'Ready to demonstrate Stack operations. Enter a value and click Push!';
    renderStack();
}

/**
 * Run a predefined demo sequence
 */
async function stackDemo() {
    if (isDemoRunning) return;
    isDemoRunning = true;
    stackReset();
    
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    setStackMessage('Starting Demo...', 'msg-info');
    await wait(1000);
    
    stackPush('A');
    await wait(1500);
    
    stackPush('B');
    await wait(1500);
    
    stackPush('C');
    await wait(1500);
    
    stackPeek(true);
    await wait(2000);
    
    stackPop(true);
    await wait(1500);
    
    stackPush('D');
    await wait(1500);
    
    stackPop(true);
    await wait(1500);
    
    stackPop(true);
    await wait(1500);
    
    stackPop(true);
    await wait(1500);
    
    // Demonstrate underflow
    stackPop(true);
    
    await wait(2000);
    setStackMessage('Demo finished.', 'msg-info');
    isDemoRunning = false;
}
