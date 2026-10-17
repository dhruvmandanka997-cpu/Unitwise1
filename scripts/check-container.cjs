const { spawn } = require('child_process');

async function checkContainer() {
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

  const r = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const main = document.querySelector('main');
      const container = main ? main.firstElementChild : null;
      return {
        mainChildrenCount: main ? main.children.length : 0,
        mainFirstChildTag: container ? container.tagName : null,
        mainFirstChildCls: container ? container.className : null,
        containerChildren: container ? Array.from(container.children).map((c, i) => ({
          i,
          tag: c.tagName,
          cls: c.className.slice(0, 40),
          offsetTop: c.offsetTop,
          offsetHeight: c.offsetHeight,
          boundingTop: c.getBoundingClientRect().top,
          boundingBottom: c.getBoundingClientRect().bottom,
          scrollHeight: c.scrollHeight,
          clientHeight: c.clientHeight
        })) : []
      };
    })()`
  });

  console.log('RESULT:', JSON.stringify(r?.result?.value, null, 2));
  ws.close();
  chrome.kill();
}

checkContainer().catch(console.error);
