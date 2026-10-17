const { spawn } = require('child_process');

async function testStatic() {
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

  const compare = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sub = document.querySelector('div.sticky');
      const p = sub.parentElement;
      const initial = {
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        nextTop: sub.nextElementSibling.getBoundingClientRect().top
      };

      // Change position to static
      sub.style.position = 'static';
      const whenStatic = {
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        nextTop: sub.nextElementSibling.getBoundingClientRect().top
      };

      // Change margin to 0
      sub.style.marginTop = '0';
      sub.style.marginBottom = '0';
      const whenNoMargin = {
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        nextTop: sub.nextElementSibling.getBoundingClientRect().top
      };

      return { initial, whenStatic, whenNoMargin };
    })()`
  });

  console.log('COMPARE:', JSON.stringify(compare?.result?.value, null, 2));
  ws.close();
  chrome.kill();
}

testStatic().catch(console.error);
