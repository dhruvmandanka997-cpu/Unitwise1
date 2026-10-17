const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';

async function diagnose() {
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

  // Open first plan workspace
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

  // Get exact numbers
  const layoutInfo = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const appHeader = document.querySelector('header');
      const stickySubbar = document.querySelector('div.sticky');
      const tabs = document.querySelector('div.sticky div.overflow-x-auto');
      const maxW7xl = document.querySelector('div.mx-auto.max-w-7xl');
      const firstSection = document.querySelector('div.mx-auto.max-w-7xl > div:nth-child(2)');
      const firstHeading = firstSection ? firstSection.querySelector('h2, h3, h4, [class*="font-semibold"]') : null;

      const getBox = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          height: r.height,
          width: r.width
        };
      };

      return {
        scrollY: window.scrollY,
        appHeader: getBox(appHeader),
        stickySubbar: getBox(stickySubbar),
        tabs: getBox(tabs),
        maxW7xl: getBox(maxW7xl),
        firstSection: getBox(firstSection),
        firstHeading: firstHeading ? { text: firstHeading.innerText.slice(0, 40), box: getBox(firstHeading) } : null,
      };
    })()`
  });

  console.log('UNSCROLLED BOXES:');
  console.log(JSON.stringify(layoutInfo?.result?.value, null, 2));

  // Capture screenshot of unscrolled view
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'diagnose_unscrolled.png'), Buffer.from(ss.data, 'base64'));

  // Now scroll 100px
  await send('Runtime.evaluate', { expression: "window.scrollBy(0, 100);" });
  await new Promise(r => setTimeout(r, 300));

  const scrolled100 = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const appHeader = document.querySelector('header');
      const stickySubbar = document.querySelector('div.sticky');
      const firstSection = document.querySelector('div.mx-auto.max-w-7xl > div:nth-child(2)');
      const firstHeading = firstSection ? firstSection.querySelector('h2, h3, h4, [class*="font-semibold"]') : null;

      const getBox = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          height: r.height,
        };
      };

      return {
        scrollY: window.scrollY,
        appHeader: getBox(appHeader),
        stickySubbar: getBox(stickySubbar),
        firstSection: getBox(firstSection),
        firstHeading: firstHeading ? { text: firstHeading.innerText.slice(0, 40), box: getBox(firstHeading) } : null,
      };
    })()`
  });

  console.log('SCROLLED 100px BOXES:');
  console.log(JSON.stringify(scrolled100?.result?.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'diagnose_scrolled_100.png'), Buffer.from(ss.data, 'base64'));

  // Switch to Daily Lessons tab and check
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dailyTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Daily Lessons'));
        if (dailyTab) dailyTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));
  await send('Runtime.evaluate', { expression: "window.scrollTo(0, 0);" });
  await new Promise(r => setTimeout(r, 300));

  const dailyUnscrolled = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const appHeader = document.querySelector('header');
      const stickySubbar = document.querySelector('div.sticky');
      const weekSelector = document.querySelector('div.mx-auto.max-w-7xl > div:nth-child(2) > div:first-child');
      const weekHeading = document.querySelector('h3');

      const getBox = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      };

      return {
        appHeader: getBox(appHeader),
        stickySubbar: getBox(stickySubbar),
        weekSelector: getBox(weekSelector),
        weekHeading: weekHeading ? { text: weekHeading.innerText.slice(0, 40), box: getBox(weekHeading) } : null,
      };
    })()`
  });

  console.log('DAILY UNSCROLLED BOXES:');
  console.log(JSON.stringify(dailyUnscrolled?.result?.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'diagnose_daily_unscrolled.png'), Buffer.from(ss.data, 'base64'));

  // Scroll Daily 80px
  await send('Runtime.evaluate', { expression: "window.scrollBy(0, 80);" });
  await new Promise(r => setTimeout(r, 300));

  const dailyScrolled80 = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const stickySubbar = document.querySelector('div.sticky');
      const weekSelector = document.querySelector('div.mx-auto.max-w-7xl > div:nth-child(2) > div:first-child');
      const weekHeading = document.querySelector('h3');

      const getBox = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      };

      return {
        scrollY: window.scrollY,
        stickySubbar: getBox(stickySubbar),
        weekSelector: getBox(weekSelector),
        weekHeading: weekHeading ? { text: weekHeading.innerText.slice(0, 40), box: getBox(weekHeading) } : null,
        isOverlap: stickySubbar && weekSelector && weekSelector.top < stickySubbar.bottom
      };
    })()`
  });

  console.log('DAILY SCROLLED 80px BOXES:');
  console.log(JSON.stringify(dailyScrolled80?.result?.value, null, 2));

  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'diagnose_daily_scrolled_80.png'), Buffer.from(ss.data, 'base64'));

  ws.close();
  chrome.kill();
}

diagnose().catch(console.error);
