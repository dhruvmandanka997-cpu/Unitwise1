const { spawn } = require('child_process');

async function findBetween() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--disable-gpu',
    'http://localhost:5173/'
  ]);
  
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
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

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open'));
        if (openBtn) openBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const info = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      // Find what element is at (500, 70), (500, 90), (500, 110), (500, 130), (500, 260)
      const points = [70, 90, 110, 125, 150, 240, 260, 280, 300];
      return points.map(y => {
        const el = document.elementFromPoint(500, y);
        return {
          y,
          tagName: el ? el.tagName : null,
          className: el ? el.className : null,
          text: el ? el.innerText.slice(0, 50).replace(/\\n/g, ' ') : null,
          rect: el ? { top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, height: el.getBoundingClientRect().height } : null
        };
      });
    })()`
  });

  console.log('ELEMENTS AT VERTICAL POINTS:');
  console.log(JSON.stringify(info?.result?.value, null, 2));

  ws.close();
  chrome.kill();
}

findBetween().catch(console.error);
