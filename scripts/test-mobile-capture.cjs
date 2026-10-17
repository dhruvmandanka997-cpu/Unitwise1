const fs = require('fs');
const { spawn } = require('child_process');

async function testMobile() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9666',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\LOQ\\.gemini\\antigravity-ide\\brain\\1d623a23-08a8-405f-a200-4f22443b4abe\\chrome_mobile_test',
    'http://localhost:5173/'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://localhost:9666/json');
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
  await new Promise(r => setTimeout(r, 500));

  // Open plan directly from dashboard
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
    window.scrollTo(0, 0);
  ` });
  await new Promise(r => setTimeout(r, 800));

  // Screenshot Mobile Standards Cards (stacked cards)
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/1d623a23-08a8-405f-a200-4f22443b4abe/mobile_standards_375px.png', Buffer.from(ss2.data, 'base64'));
  console.log('Saved mobile_standards_375px.png');

  // Expand first standard card
  await send('Runtime.evaluate', { expression: `
    const viewBtn = document.querySelectorAll('.md\\:hidden button')[0];
    if (viewBtn) viewBtn.click();
  ` });
  await new Promise(r => setTimeout(r, 500));

  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/1d623a23-08a8-405f-a200-4f22443b4abe/mobile_standards_expanded_375px.png', Buffer.from(ss3.data, 'base64'));
  console.log('Saved mobile_standards_expanded_375px.png');

  // Check overflow
  const ovf = await send('Runtime.evaluate', { expression: 'document.body.scrollWidth > window.innerWidth' });
  console.log('Has horizontal body overflow on mobile:', ovf.result.value);

  chrome.kill();
}
testMobile();
