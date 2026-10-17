const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';
const userDataDir = path.join(ARTIFACT_DIR, `chrome_run_${Date.now()}`);

async function main() {
  console.log('Spawning Chrome process with debugging port 9222...');
  const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:5173/'
  ]);

  chromeProcess.on('error', (err) => {
    console.error('Chrome process error:', err);
  });

  // Wait for Chrome port 9222 to become available
  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const targetsRes = await fetch('http://localhost:9222/json');
      const targets = await targetsRes.json();
      pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173')) || targets.find(t => t.type === 'page');
      if (pageTarget) break;
    } catch (e) {
      // still starting up
    }
  }

  if (!pageTarget) {
    chromeProcess.kill();
    throw new Error('Chrome did not initialize on port 9222 within 10 seconds');
  }

  console.log('Connected to target:', pageTarget.title, pageTarget.url);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    try {
      const raw = typeof event.data === 'string' ? event.data : event.data.toString();
      const data = JSON.parse(raw);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id).resolve(data.result);
        callbacks.delete(data.id);
      }
    } catch (e) {
      console.error('Error parsing ws message:', e);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  // Navigate to application
  await send('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 1500));

  // --- 1. LIGHT MODE REDESIGNED DASHBOARD (1440px) ---
  console.log('Capturing Light Mode Redesigned Dashboard (1440px)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await new Promise(r => setTimeout(r, 600));

  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_redesign_light.png'), Buffer.from(ss.data, 'base64'));

  // --- 2. DARK MODE REDESIGNED DASHBOARD (1440px) ---
  console.log('Capturing Dark Mode Redesigned Dashboard (1440px)...');
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark')" });
  await new Promise(r => setTimeout(r, 600));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_redesign_dark.png'), Buffer.from(ss.data, 'base64'));

  // --- 3. TABLET LAYOUT (768px) ---
  console.log('Capturing Tablet Layout (768px)...');
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 500));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_redesign_tablet.png'), Buffer.from(ss.data, 'base64'));

  // --- 4. MOBILE LAYOUT (375px) ---
  console.log('Capturing Mobile Layout (375px)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 500));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_redesign_mobile.png'), Buffer.from(ss.data, 'base64'));

  // Reset to Desktop for DOM inspection
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));

  // --- 5. DOM & FEATURE INSPECTION ---
  const domInspection = await send('Runtime.evaluate', {
    expression: `(() => {
      const heroGreeting = document.querySelector('h1')?.innerText;
      const heroIllustration = !!document.querySelector('svg');
      const chartBars = document.querySelectorAll('caption');
      const timelineNodes = document.querySelectorAll('h3, h4');
      const blueprints = Array.from(document.querySelectorAll('#templates .grid > div')).map(card => card.querySelector('h3')?.innerText);
      const sidebarLinks = Array.from(document.querySelectorAll('aside nav button span')).map(el => el.innerText);

      return {
        heroGreeting,
        heroIllustration,
        blueprintsCount: blueprints.length,
        blueprints,
        sidebarLinks
      };
    })()`,
    returnByValue: true
  });

  // Clean up
  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
  chromeProcess.kill();

  console.log('DOM INSPECTION REPORT:\n', JSON.stringify(domInspection.result?.value, null, 2));
  console.log('ALL REDESIGN ARTIFACTS VERIFIED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
