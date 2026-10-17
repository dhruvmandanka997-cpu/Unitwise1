const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:/Users/LOQ/.gemini/antigravity-ide/brain/c04a12eb-7528-4549-8b0e-dbb2176fc1ce';

async function runTaskVerification() {
  const profileDir = path.join(ARTIFACT_DIR, 'chrome_verify_tasks_' + Date.now());
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  console.log('Launching headless Chrome with CDP for task tracker verification...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9446',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--disable-gpu',
    `--user-data-dir=${profileDir}`,
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  let res, targets, page;
  try {
    res = await fetch('http://localhost:9446/json');
    targets = await res.json();
    page = targets.find(t => t.type === 'page');
  } catch (err) {
    console.error('Failed to connect to Chrome:', err);
    chrome.kill();
    process.exit(1);
  }

  if (!page) {
    console.error('No page found');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p={}) => new Promise(resolve => {
    const i = id++;
    const h = e => {
      const d = JSON.parse(e.data);
      if (d.id === i) {
        ws.removeEventListener('message', h);
        resolve(d.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  async function evaluate(code) {
    const r = await send('Runtime.evaluate', { expression: code, returnByValue: true, awaitPromise: true });
    return r?.result?.value;
  }

  async function screenshot(name) {
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, name);
    fs.writeFileSync(outPath, Buffer.from(ss.data, 'base64'));
    console.log(`Saved screenshot: ${name}`);
  }

  console.log('--- Step 1: Desktop Light Mode Dashboard Task Overview ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); window.scrollTo(0, 0);`);
  await new Promise(r => setTimeout(r, 1200));

  // Scroll to Task Tracker section
  await evaluate(`
    const section = document.querySelector('section[aria-label="Curriculum Task Tracker"]');
    if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo(0, 350);
  `);
  await new Promise(r => setTimeout(r, 600));

  const overviewStats = await evaluate(`
    (() => {
      const section = document.querySelector('section[aria-label="Curriculum Task Tracker"]');
      const cards = Array.from(section?.querySelectorAll('button') || []).filter(b => b.querySelector('.text-2xl'));
      return cards.map(c => ({
        label: c.querySelector('span')?.textContent?.trim(),
        count: c.querySelector('.text-2xl')?.textContent?.trim()
      }));
    })()
  `);
  console.log('Dashboard Task Overview Cards:', overviewStats);
  await screenshot('dashboard_tasks_overview_light.png');

  console.log('--- Step 2: Testing Clickable Status Filtering ---');
  // Click "In Progress" card
  await evaluate(`
    const inProgBtn = Array.from(document.querySelectorAll('section[aria-label="Curriculum Task Tracker"] button'))
      .find(b => b.textContent.includes('In Progress') && b.querySelector('.text-2xl'));
    if (inProgBtn) inProgBtn.click();
  `);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('dashboard_tasks_filtered_in_progress.png');

  const filteredCount = await evaluate(`
    (() => {
      const taskCards = Array.from(document.querySelectorAll('section[aria-label="Curriculum Task Tracker"] .grid > div[role="button"]'));
      return {
        count: taskCards.length,
        firstTitle: taskCards[0]?.querySelector('h3')?.textContent,
        firstStatus: taskCards[0]?.querySelector('[role="status"]')?.textContent
      };
    })()
  `);
  console.log('In-Progress Filtered Tasks:', filteredCount);

  console.log('--- Step 3: Open Task Details Modal ---');
  await evaluate(`
    const firstTask = document.querySelector('section[aria-label="Curriculum Task Tracker"] .grid > div[role="button"]');
    if (firstTask) firstTask.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await screenshot('task_details_modal_opened.png');

  // Toggle checklist item and save notes
  console.log('--- Step 4: Toggle Checklist Item & Edit Notes ---');
  await evaluate(`
    const checkboxes = Array.from(document.querySelectorAll('.fixed.inset-0 [role="checkbox"]'));
    if (checkboxes.length > 0) checkboxes[0].click();
    const textarea = document.querySelector('.fixed.inset-0 textarea');
    if (textarea) {
      textarea.value = "Verified with departmental pacing guide for upcoming term.";
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await new Promise(r => setTimeout(r, 600));

  await evaluate(`
    const saveBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Save Notes'));
    if (saveBtn) saveBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await screenshot('task_details_modal_saved.png');

  console.log('--- Step 5: Navigate to Workspace from Task Modal ---');
  await evaluate(`
    const contBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Continue in Workspace'));
    if (contBtn) contBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  await screenshot('workspace_navigated_from_task.png');

  console.log('--- Step 6: Workspace Task Tracker Tab ---');
  await evaluate(`
    const tasksBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tasks Tracker') || b.textContent.includes('Tasks:'));
    if (tasksBtn) tasksBtn.click();
    window.scrollTo(0, 0);
  `);
  await new Promise(r => setTimeout(r, 800));
  await screenshot('workspace_tasks_tracker_tab.png');

  const workspaceTasksStats = await evaluate(`
    (() => {
      const taskCards = Array.from(document.querySelectorAll('.grid > div[role="button"]')).filter(c => c.textContent.includes('steps'));
      return {
        planTasksCount: taskCards.length,
        firstTitle: taskCards[0]?.querySelector('h3')?.textContent,
        firstStatus: taskCards[0]?.querySelector('[role="status"]')?.textContent
      };
    })()
  `);
  console.log('Workspace Tasks Tab Data:', workspaceTasksStats);

  console.log('--- Step 7: Dark Theme Verification ---');
  await evaluate(`document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark');`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('workspace_tasks_dark.png');

  // Go back to Dashboard in dark mode
  await evaluate(`
    const backBtn = document.querySelector('button[title="Return to Dashboard"]');
    if (backBtn) backBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await evaluate(`
    const section = document.querySelector('section[aria-label="Curriculum Task Tracker"]');
    if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 500));
  await screenshot('dashboard_tasks_dark.png');

  console.log('--- Step 8: Mobile 375px Responsive Verification ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await evaluate(`document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); window.scrollTo(0, 0);`);
  await new Promise(r => setTimeout(r, 600));
  await evaluate(`
    const section = document.querySelector('section[aria-label="Curriculum Task Tracker"]');
    if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 500));
  await screenshot('mobile_tasks_375px.png');

  console.log('All verification steps completed successfully!');
  chrome.kill();
  process.exit(0);
}

runTaskVerification().catch(err => {
  console.error('Task verification failed:', err);
  process.exit(1);
});
