const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';
const userDataDir = path.join(ARTIFACT_DIR, `chrome_verify_${Date.now()}`);

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

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const targetsRes = await fetch('http://localhost:9222/json');
      const targets = await targetsRes.json();
      pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173')) || targets.find(t => t.type === 'page');
      if (pageTarget) break;
    } catch (e) {}
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
      }
    } catch (e) {}
  };

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  // Navigate to application
  console.log('Navigating to http://localhost:5173...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1500));

  // Open first plan workspace
  console.log('Opening first curriculum plan workspace...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open'));
        if (openBtn) {
          openBtn.click();
          return 'Clicked Open button';
        }
        return 'No open button found';
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // Switch to Daily Lessons Tab
  console.log('Switching to Daily Lessons tab...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dailyTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Daily Lessons'));
        if (dailyTab) {
          dailyTab.click();
          return 'Clicked Daily Lessons tab';
        }
        return 'Daily Lessons tab not found';
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // 1. Capture Desktop Light Mode
  console.log('Capturing Desktop Light Mode (1280x900)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await new Promise(r => setTimeout(r, 600));

  let ss = await send('Page.captureScreenshot', { format: 'png' });
  const desktopLightPath = path.join(ARTIFACT_DIR, 'daily_editor_desktop_light.png');
  fs.writeFileSync(desktopLightPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved:', desktopLightPath);

  // 2. Expand second lesson phase & success criterion to verify expandable details
  console.log('Interacting with phase expand and success criteria...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Expand success criterion on first objective
        const critBtn = document.querySelector('button[title*="success criterion"]');
        if (critBtn) critBtn.click();

        // Expand second phase
        const phaseRows = document.querySelectorAll('article div[class*="cursor-pointer"]');
        if (phaseRows[1]) phaseRows[1].click();

        // Expand Formative Assessment details drawer
        const assessBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Formative Assessment Details'));
        if (assessBtn) assessBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  const desktopExpandedPath = path.join(ARTIFACT_DIR, 'daily_editor_expanded_light.png');
  fs.writeFileSync(desktopExpandedPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved:', desktopExpandedPath);

  // 3. Capture Desktop Dark Mode
  console.log('Switching to Dark Mode...');
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark')" });
  await new Promise(r => setTimeout(r, 600));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  const desktopDarkPath = path.join(ARTIFACT_DIR, 'daily_editor_desktop_dark.png');
  fs.writeFileSync(desktopDarkPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved:', desktopDarkPath);

  // 4. Capture Tablet Layout (768x1024)
  console.log('Testing Tablet viewport (768x1024)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 600));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  const tabletDarkPath = path.join(ARTIFACT_DIR, 'daily_editor_tablet_dark.png');
  fs.writeFileSync(tabletDarkPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved:', tabletDarkPath);

  // 5. Capture Mobile Layout (375x812)
  console.log('Testing Mobile viewport (375x812)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 600));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  const mobileDarkPath = path.join(ARTIFACT_DIR, 'daily_editor_mobile_dark.png');
  fs.writeFileSync(mobileDarkPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved:', mobileDarkPath);

  // Switch back to light mobile
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  const mobileLightPath = path.join(ARTIFACT_DIR, 'daily_editor_mobile_light.png');
  fs.writeFileSync(mobileLightPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved:', mobileLightPath);

  ws.close();
  chromeProcess.kill();
  console.log('All Daily Lesson Editor verification screenshots successfully captured!');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
