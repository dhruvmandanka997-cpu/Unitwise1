const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';

async function testClip() {
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

  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  // Apply clip on main
  const beforeAndAfter = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const main = document.querySelector('main');
      const sub = document.querySelector('div.sticky');
      const next = sub.nextElementSibling;
      const appHeader = document.querySelector('header');

      const measure = () => ({
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        nextTop: next.getBoundingClientRect().top,
        appHeaderBottom: appHeader.getBoundingClientRect().bottom,
        overlap: sub.getBoundingClientRect().bottom - next.getBoundingClientRect().top,
        gapBelowHeader: sub.getBoundingClientRect().top - appHeader.getBoundingClientRect().bottom
      });

      const before = measure();

      // Change main from overflow-x-hidden to overflow-x: clip (or visible)
      main.style.overflow = 'visible';
      main.style.overflowX = 'clip';
      main.style.overflowY = 'visible';

      const after = measure();

      return { before, after };
    })()`
  });

  console.log('BEFORE AND AFTER OVERFLOW CHANGE:');
  console.log(JSON.stringify(beforeAndAfter?.result?.value, null, 2));

  // Capture screenshot of Overview tab with fix
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_fix_overview.png'), Buffer.from(ss.data, 'base64'));

  // Switch to Daily tab and capture
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dailyTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Daily Lessons'));
        if (dailyTab) dailyTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  const dailyMeasure = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sub = document.querySelector('div.sticky');
      const next = sub.nextElementSibling;
      const weekSelector = document.querySelector('div.mx-auto.max-w-7xl > div:nth-child(2) > div:first-child');
      const appHeader = document.querySelector('header');

      return {
        subTop: sub.getBoundingClientRect().top,
        subBottom: sub.getBoundingClientRect().bottom,
        weekSelectorTop: weekSelector ? weekSelector.getBoundingClientRect().top : null,
        appHeaderBottom: appHeader.getBoundingClientRect().bottom,
        gapBelowHeader: sub.getBoundingClientRect().top - appHeader.getBoundingClientRect().bottom,
        overlap: sub.getBoundingClientRect().bottom - weekSelector.getBoundingClientRect().top
      };
    })()`
  });

  console.log('DAILY MEASURE WITH FIX:');
  console.log(JSON.stringify(dailyMeasure?.result?.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_fix_daily.png'), Buffer.from(ss.data, 'base64'));

  // Now test scrolling when fixed
  await send('Runtime.evaluate', { expression: "window.scrollBy(0, 150);" });
  await new Promise(r => setTimeout(r, 400));

  const scrolledMeasure = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const sub = document.querySelector('div.sticky');
      const appHeader = document.querySelector('header');
      return {
        scrollY: window.scrollY,
        subTop: sub.getBoundingClientRect().top,
        appHeaderBottom: appHeader.getBoundingClientRect().bottom,
        gap: sub.getBoundingClientRect().top - appHeader.getBoundingClientRect().bottom
      };
    })()`
  });

  console.log('SCROLLED 150px WITH FIX:');
  console.log(JSON.stringify(scrolledMeasure?.result?.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'test_fix_daily_scrolled.png'), Buffer.from(ss.data, 'base64'));

  ws.close();
  chrome.kill();
}

testClip().catch(console.error);
