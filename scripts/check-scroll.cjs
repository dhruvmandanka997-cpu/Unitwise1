const { spawn } = require('child_process');

async function checkScroll() {
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

  const scrollInfo = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const main = document.querySelector('main');
      const sub = document.querySelector('div.sticky');
      return {
        windowScrollY: window.scrollY,
        documentScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop,
        mainScrollTop: main ? main.scrollTop : null,
        mainClientHeight: main ? main.clientHeight : null,
        mainScrollHeight: main ? main.scrollHeight : null,
        subOffsetTop: sub ? sub.offsetTop : null,
        subOffsetHeight: sub ? sub.offsetHeight : null,
        subNaturalTop: sub ? (sub.offsetTop - (sub.parentElement.offsetTop || 0)) : null,
      };
    })()`
  });

  console.log('SCROLL INFO:', JSON.stringify(scrollInfo?.result?.value, null, 2));

  ws.close();
  chrome.kill();
}

checkScroll().catch(console.error);
