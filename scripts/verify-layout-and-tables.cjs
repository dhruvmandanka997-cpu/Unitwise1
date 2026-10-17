const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';

async function verify() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\LOQ\\.gemini\\antigravity-ide\\brain\\a2c7c0c7-c2a5-4371-a519-7683bbe437e2\\chrome_profile_layout',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) {
    console.error('No Chrome CDP page target found');
    chrome.kill();
    return;
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p={}) => new Promise(resolve => {
    const i = id++;
    const h = e => {
      const d = JSON.parse(e.data);
      if (d.id === i) { ws.removeEventListener('message', h); resolve(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  // Set desktop viewport
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 950, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Capture Dashboard Layout
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dash_reorganized_desktop_top.png'), Buffer.from(ss.data, 'base64'));

  // Scroll down slightly to capture the Blueprints and the main content + supporting sidebar
  await send('Runtime.evaluate', { expression: "window.scrollBy(0, 500);" });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dash_reorganized_desktop_mid.png'), Buffer.from(ss.data, 'base64'));

  // Scroll further down to capture instructional plans and supporting sidebar
  await send('Runtime.evaluate', { expression: "window.scrollBy(0, 600);" });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dash_reorganized_desktop_bottom.png'), Buffer.from(ss.data, 'base64'));

  // Scroll back to top
  await send('Runtime.evaluate', { expression: "window.scrollTo(0, 0);" });
  await new Promise(r => setTimeout(r, 400));

  // 2. Open first plan to workspace
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open'));
        if (openBtn) openBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // 3. Switch to Standards Alignment Tab
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const stdTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Standards Alignment'));
        if (stdTab) stdTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  // Capture Standards Tab on Desktop
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'standards_table_desktop.png'), Buffer.from(ss.data, 'base64'));

  // 4. Switch to Assessments & Rubric Tab on Desktop
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const rubTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Assessments & Rubric'));
        if (rubTab) rubTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  // Capture Rubric Tab on Desktop
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rubric_desktop_table.png'), Buffer.from(ss.data, 'base64'));

  // 5. Test Rubric on Tablet (768px)
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rubric_tablet_cards.png'), Buffer.from(ss.data, 'base64'));

  // 6. Test Standards on Tablet (768px)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const stdTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Standards Alignment'));
        if (stdTab) stdTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'standards_table_tablet.png'), Buffer.from(ss.data, 'base64'));

  // 7. Test Rubric on Mobile (375px)
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const rubTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Assessments & Rubric'));
        if (rubTab) rubTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rubric_mobile_cards.png'), Buffer.from(ss.data, 'base64'));

  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  ws.close();
  chrome.kill();
}

verify().catch(console.error);
