const { spawn } = require('child_process');

async function debugSubbar() {
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
      const parent = document.querySelector('div.mx-auto.max-w-7xl');
      return Array.from(parent.children).map((c, i) => ({
        i,
        tag: c.tagName,
        cls: c.className.slice(0, 40),
        rect: { top: c.getBoundingClientRect().top, bottom: c.getBoundingClientRect().bottom, height: c.getBoundingClientRect().height },
        computed: {
          display: getComputedStyle(c).display,
          position: getComputedStyle(c).position,
          top: getComputedStyle(c).top,
          marginTop: getComputedStyle(c).marginTop,
          marginBottom: getComputedStyle(c).marginBottom,
        }
      }));
    })()`
  });

  console.log('PARENT CHILDREN:');
  console.log(JSON.stringify(info?.result?.value, null, 2));

  ws.close();
  chrome.kill();
}

debugSubbar().catch(console.error);
