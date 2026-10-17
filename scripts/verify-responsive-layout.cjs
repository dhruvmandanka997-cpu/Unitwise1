const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';

async function verifyResponsive() {
  const { spawn } = require('child_process');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\LOQ\\.gemini\\antigravity-ide\\brain\\a2c7c0c7-c2a5-4371-a519-7683bbe437e2\\chrome_profile_verify',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) {
    console.error('No Chrome CDP page target found');
    chrome.kill();
    return;
  }
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

  // Wait for plans to load and click Open
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      new Promise((resolve) => {
        const interval = setInterval(() => {
          const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open'));
          if (openBtn) {
            clearInterval(interval);
            openBtn.click();
            resolve(true);
          }
        }, 100);
        setTimeout(() => { clearInterval(interval); resolve(false); }, 6000);
      })
    `
  });
  // Wait for PlanWorkspace to mount
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      new Promise((resolve) => {
        const interval = setInterval(() => {
          const sub = document.querySelector('div.sticky');
          if (sub) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
        setTimeout(() => { clearInterval(interval); resolve(false); }, 6000);
      })
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const viewports = [
    { name: 'desktop_1280', width: 1280, height: 900, mobile: false },
    { name: 'tablet_768', width: 768, height: 1024, mobile: false },
    { name: 'mobile_375', width: 375, height: 812, mobile: true }
  ];

  const results = [];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    // Scroll to top
    await send('Runtime.evaluate', { expression: "window.scrollTo(0, 0);" });
    await new Promise(r => setTimeout(r, 400));

    // Measure Overview tab
    const overviewMetrics = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const header = document.querySelector('header');
        const sub = document.querySelector('div.sticky');
        const main = document.querySelector('main');
        const firstCard = sub ? sub.nextElementSibling : null;

        const hRect = header ? header.getBoundingClientRect() : null;
        const sRect = sub ? sub.getBoundingClientRect() : null;
        const cRect = firstCard ? firstCard.getBoundingClientRect() : null;

        return {
          viewport: '${vp.name}',
          headerHeight: hRect ? hRect.height : 0,
          headerBottom: hRect ? hRect.bottom : 0,
          subTop: sRect ? sRect.top : 0,
          subBottom: sRect ? sRect.bottom : 0,
          cardTop: cRect ? cRect.top : 0,
          subGapBelowHeader: sRect && hRect ? (sRect.top - hRect.bottom) : 0,
          overlapWithContent: sRect && cRect ? (sRect.bottom - cRect.top) : 0,
          hasOverlap: sRect && cRect ? (sRect.bottom > cRect.top) : false
        };
      })()`
    });

    results.push(overviewMetrics?.result?.value);

    // Capture Light Mode screenshot
    let ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, `verify_${vp.name}_light.png`), Buffer.from(ss.data, 'base64'));

    // Switch to Daily Lessons tab
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const dailyTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Daily Lessons'));
          if (dailyTab) dailyTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    // Capture Daily tab
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, `verify_${vp.name}_daily.png`), Buffer.from(ss.data, 'base64'));

    // Switch back to Overview tab
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const overviewTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Overview & Goals'));
          if (overviewTab) overviewTab.click();
        })()
      `
    });
  }

  // Test Dark Mode on Desktop
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Toggle dark mode
        const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('mode') || b.querySelector('svg.lucide-moon') || b.querySelector('svg.lucide-sun'));
        if (themeBtn) themeBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  let darkSs = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, `verify_desktop_dark.png`), Buffer.from(darkSs.data, 'base64'));

  // Toggle back to light mode
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('mode') || b.querySelector('svg.lucide-moon') || b.querySelector('svg.lucide-sun'));
        if (themeBtn) themeBtn.click();
      })()
    `
  });

  console.log('LAYOUT VERIFICATION METRICS:');
  console.log(JSON.stringify(results, null, 2));

  ws.close();
  chrome.kill();
}

verifyResponsive().catch(console.error);
