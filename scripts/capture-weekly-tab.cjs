const fs = require('fs');

async function captureWeeklyTab() {
  const targetsRes = await fetch('http://localhost:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
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
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id).resolve(data.result);
    }
  };
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  // Ensure Light mode
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await new Promise(r => setTimeout(r, 400));

  // Click on first plan "Open" button
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open'));
        if (openBtn) openBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // Click on "Weekly Scope" tab
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const weekTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Weekly Scope'));
        if (weekTab) weekTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // Desktop (1280px)
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 950, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  const desktopSs = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_scope_desktop_light.png', Buffer.from(desktopSs.data, 'base64'));

  // Tablet (768px)
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1000, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  const tabletSs = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_scope_tablet_light.png', Buffer.from(tabletSs.data, 'base64'));

  // Mobile (375px)
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const mobileSs = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_scope_mobile_light.png', Buffer.from(mobileSs.data, 'base64'));

  console.log('Saved weekly_scope screenshots in light mode!');
  ws.close();
}

captureWeeklyTab().catch(console.error);
