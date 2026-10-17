async function test() {
  const res = await fetch('http://localhost:9445/json').catch(() => null);
  if (!res) {
    console.log('Chrome 9445 not currently running');
    return;
  }
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) return;
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p={}) => new Promise(r => {
    const i = id++;
    const h = e => {
      const d = JSON.parse(e.data);
      if (d.id === i) { ws.removeEventListener('message', h); r(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
  await new Promise(r => ws.onopen = r);
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  const wide = await send('Runtime.evaluate', {
    expression: 'Array.from(document.querySelectorAll("*")).filter(el => el.offsetWidth > 375 && !["HTML", "BODY", "DIV#root"].includes(el.tagName + (el.id ? "#" + el.id : ""))).map(el => ({ tag: el.tagName, id: el.id, className: String(el.className).slice(0, 50), text: el.textContent?.slice(0, 30), w: el.offsetWidth })).slice(0, 10)',
    returnByValue: true
  });
  console.log('Wide elements:', wide?.result?.value);
  ws.close();
}
test();
