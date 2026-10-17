const fs = require('fs');

async function verifyWeekly() {
  const targetsRes = await fetch('http://localhost:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id).resolve(data.result);
    }
  };
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  // Navigate to application
  await send('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 1500));

  // Open first plan workspace
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const openBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Open'));
        if (openBtn) openBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // Click on "Weekly Scope" tab
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const weekTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Weekly Scope'));
        if (weekTab) weekTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // Inject a deliberately long title into Week 1
  const longTitle = "Week 1: Comprehensive Foundations, Key Academic Vocabulary, Multi-Tiered Procedural Analysis & Culminating Authentic Synthesis";
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const titleArea = document.querySelector('textarea[title="Click to edit week title"]');
        if (titleArea) {
          titleArea.value = ${JSON.stringify(longTitle)};
          titleArea.dispatchEvent(new Event('input', { bubbles: true }));
          titleArea.dispatchEvent(new Event('change', { bubbles: true }));
          titleArea.style.height = 'auto';
          titleArea.style.height = titleArea.scrollHeight + 'px';
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const widths = [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'laptop', width: 1024, height: 900 },
    { name: 'tablet', width: 768, height: 1000 },
    { name: 'mobile_375', width: 375, height: 900 },
    { name: 'mobile_320', width: 320, height: 900 }
  ];

  const results = {};

  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w.width,
      height: w.height,
      deviceScaleFactor: 1,
      mobile: w.width < 768
    });
    await new Promise(r => setTimeout(r, 400));

    // Inspect layout at this width
    const inspection = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const titleArea = document.querySelector('textarea[title="Click to edit week title"]');
          const regenBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Regenerate Week'));
          const viewBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('View Lessons'));
          
          if (!titleArea) return { error: 'titleArea not found' };
          
          const tRect = titleArea.getBoundingClientRect();
          const rRect = regenBtn ? regenBtn.getBoundingClientRect() : null;
          const vRect = viewBtn ? viewBtn.getBoundingClientRect() : null;
          
          // Check overlap: does titleArea overlap with buttons?
          let overlaps = false;
          if (rRect && tRect.right > rRect.left && tRect.left < rRect.right && tRect.bottom > rRect.top && tRect.top < rRect.bottom) {
            overlaps = true;
          }
          if (vRect && tRect.right > vRect.left && tRect.left < vRect.right && tRect.bottom > vRect.top && tRect.top < vRect.bottom) {
            overlaps = true;
          }
          
          return {
            windowWidth: window.innerWidth,
            titleRect: { width: tRect.width, height: tRect.height, top: tRect.top, left: tRect.left },
            titleValue: titleArea.value.slice(0, 50) + '...',
            titleScrollHeight: titleArea.scrollHeight,
            titleClientHeight: titleArea.clientHeight,
            overlapsButtons: overlaps,
            regenBtnRect: rRect ? { top: rRect.top, left: rRect.left, width: rRect.width } : null,
            viewBtnRect: vRect ? { top: vRect.top, left: vRect.left, width: vRect.width } : null
          };
        })()
      `,
      returnByValue: true
    });
    results[w.name] = inspection.result.value;

    // Capture screenshot
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_${w.name}_light.png`, Buffer.from(ss.data, 'base64'));
  }

  // Also test Dark Mode on Desktop
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark')" });
  await new Promise(r => setTimeout(r, 400));
  const darkSs = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/LOQ/.gemini/antigravity-ide/brain/8621deba-2d11-4dd3-835b-29cb8e1dcb65/weekly_desktop_dark.png', Buffer.from(darkSs.data, 'base64'));

  // Switch back to light
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });

  console.log('LAYOUT VERIFICATION REPORT:\n', JSON.stringify(results, null, 2));
  ws.close();
}

verifyWeekly().catch(console.error);
