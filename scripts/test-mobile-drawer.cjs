const fs = require('fs');
const { spawn } = require('child_process');

async function shotMobileDrawer() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9777',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\LOQ\\.gemini\\antigravity-ide\\brain\\1d623a23-08a8-405f-a200-4f22443b4abe\\chrome_mobile_drawer',
    'http://localhost:5173/'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://localhost:9777/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p={}) => new Promise(res => {
    const i = id++;
    const h = e => {
      const d = JSON.parse(e.data);
      if (d.id === i) { ws.removeEventListener('message', h); res(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });

  // Click first card title
  await send('Runtime.evaluate', { expression: `
    const planCard = Array.from(document.querySelectorAll('.grid > .group.cursor-pointer')).find(c => c.textContent.includes('Open Plan'));
    if (planCard) {
      const h3 = planCard.querySelector('h3');
      if (h3) h3.click();
    }
  ` });
  await new Promise(r => setTimeout(r, 1200));

  // Click Standards tab
  await send('Runtime.evaluate', { expression: `
    const stdTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Standards'));
    if (stdTab) stdTab.click();
  ` });
  await new Promise(r => setTimeout(r, 800));

  // Click View full details on first mobile card and scroll to it
  await send('Runtime.evaluate', { expression: `
    const btn = document.querySelectorAll('.md\\:hidden button')[0];
    if (btn) {
      btn.click();
      btn.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  ` });
  await new Promise(r => setTimeout(r, 500));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/1d623a23-08a8-405f-a200-4f22443b4abe/mobile_standards_expanded_view.png', Buffer.from(ss.data, 'base64'));
  chrome.kill();
  console.log('Saved mobile_standards_expanded_view.png');
}
shotMobileDrawer();
