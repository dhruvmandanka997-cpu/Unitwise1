async function testMobile() {
  const targetsRes = await fetch('http://localhost:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173'));
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

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data.toString());
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id).resolve(data.result);
      callbacks.delete(data.id);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  
  console.log('Sending captureScreenshot with fromSurface: false...');
  const ss = await Promise.race([
    send('Page.captureScreenshot', { format: 'png', fromSurface: false }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 5s')), 5000))
  ]);
  console.log('Got screenshot! Size:', ss.data.length);
  await send('Emulation.clearDeviceMetricsOverride');
  ws.close();
}

testMobile().catch(console.error);
