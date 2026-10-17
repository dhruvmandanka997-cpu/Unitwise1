const { spawn } = require('child_process');

async function testScrollWhenVisible() {
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
      const main = document.querySelector('main');
      const sub = document.querySelector('div.sticky');
      const next = sub.nextElementSibling;
      const appHeader = document.querySelector('header');

      // Make main visible / clip
      main.style.overflow = 'visible';
      main.style.overflowX = 'visible';
      main.style.overflowY = 'visible';

      const state0 = {
        scrollY: window.scrollY,
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        nextTop: next.getBoundingClientRect().top,
        overlap: sub.getBoundingClientRect().bottom - next.getBoundingClientRect().top
      };

      // Scroll window down 50px
      window.scrollTo(0, 50);
      const state50 = {
        scrollY: window.scrollY,
        appHeaderBottom: appHeader.getBoundingClientRect().bottom,
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        nextTop: next.getBoundingClientRect().top,
      };

      // Scroll window down 200px
      window.scrollTo(0, 200);
      const state200 = {
        scrollY: window.scrollY,
        appHeaderBottom: appHeader.getBoundingClientRect().bottom,
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        nextTop: next.getBoundingClientRect().top,
      };

      return { state0, state50, state200 };
    })()`
  });

  console.log('SCROLL WHEN VISIBLE:', JSON.stringify(result?.result?.value, null, 2));
  ws.close();
  chrome.kill();
}

testScrollWhenVisible().catch(console.error);
