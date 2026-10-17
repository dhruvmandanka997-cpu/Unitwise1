const { spawn } = require('child_process');

async function findScroller() {
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

  const result = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const scrollable = [];
      for (const el of all) {
        if (el.scrollHeight > el.clientHeight + 5) {
          scrollable.push({
            tag: el.tagName,
            cls: el.className ? el.className.slice(0, 50) : null,
            id: el.id,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            overflow: getComputedStyle(el).overflow,
            overflowY: getComputedStyle(el).overflowY,
          });
        }
      }
      return {
        windowH: window.innerHeight,
        documentScrollH: document.documentElement.scrollHeight,
        documentClientH: document.documentElement.clientHeight,
        bodyScrollH: document.body.scrollHeight,
        bodyClientH: document.body.clientHeight,
        scrollable
      };
    })()`
  });

  console.log('SCROLLABLE ELEMENTS:', JSON.stringify(result?.result?.value, null, 2));
  ws.close();
  chrome.kill();
}

findScroller().catch(console.error);
