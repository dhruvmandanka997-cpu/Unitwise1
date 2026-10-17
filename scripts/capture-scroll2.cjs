const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';
const userDataDir = path.join(ARTIFACT_DIR, `chrome_scroll2_${Date.now()}`);

async function main() {
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
    throw new Error('Chrome did not initialize on port 9222');
  }

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

  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1500));

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open'));
        if (openBtn) openBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dailyTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Daily Lessons'));
        if (dailyTab) dailyTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // Expand assessment drawer and differentiation drawer
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const assessBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Formative Assessment Details'));
        if (assessBtn) assessBtn.click();
        const diffBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tiered Differentiation'));
        if (diffBtn) diffBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  // Scroll down 750px to view lower drawers & standards
  await send('Runtime.evaluate', { expression: "window.scrollBy(0, 800);" });
  await new Promise(r => setTimeout(r, 500));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  const scrollPath = path.join(ARTIFACT_DIR, 'daily_editor_scrolled_drawers.png');
  fs.writeFileSync(scrollPath, Buffer.from(ss.data, 'base64'));
  console.log('Saved:', scrollPath);

  ws.close();
  chromeProcess.kill();
}

main().catch(console.error);
