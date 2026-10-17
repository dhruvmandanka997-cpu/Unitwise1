const fs = require('fs');

async function captureWeeklyLight() {
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

  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await new Promise(r => setTimeout(r, 600));

  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_desktop_light.png', Buffer.from(ss.data, 'base64'));

  // Tablet Light
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1000, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  const tabletSs = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_tablet_light.png', Buffer.from(tabletSs.data, 'base64'));

  // Mobile 375 Light
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const mobileSs = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_mobile_375_light.png', Buffer.from(mobileSs.data, 'base64'));

  console.log('Saved weekly light screenshots at desktop, tablet, and mobile!');
  ws.close();
}

captureWeeklyLight().catch(console.error);
