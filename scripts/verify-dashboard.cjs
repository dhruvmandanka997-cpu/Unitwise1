const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/a2c7c0c7-c2a5-4371-a519-7683bbe437e2';

async function verifyDashboard() {
  const targetsRes = await fetch('http://localhost:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173')) || targets.find(t => t.type === 'page');
  
  if (!pageTarget) {
    throw new Error('Could not find active page target');
  }

  console.log('Connecting to target:', pageTarget.title);
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
    try {
      const raw = typeof event.data === 'string' ? event.data : event.data.toString();
      const data = JSON.parse(raw);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id).resolve(data.result);
        callbacks.delete(data.id);
      }
    } catch (e) {
      console.error('Error parsing ws message:', e);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  console.log('Reloading page to ensure latest bundle is rendered...');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  // 1. Desktop 1440px Screenshot
  console.log('Capturing Desktop 1440px Light Mode...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await new Promise(r => setTimeout(r, 400));
  let ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_1440_light.png'), Buffer.from(ss.data, 'base64'));

  // 2. Desktop 1440px Dark Mode Screenshot
  console.log('Capturing Desktop 1440px Dark Mode...');
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark')" });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_1440_dark.png'), Buffer.from(ss.data, 'base64'));

  // 3. Tablet 768px Light Mode Screenshot
  console.log('Capturing Tablet 768px Light Mode...');
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light')" });
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dashboard_768_light.png'), Buffer.from(ss.data, 'base64'));

  // 4. Test breakpoints: 1440px, 1024px, 768px, 480px, 375px, 320px
  const testWidths = [1440, 1024, 768, 480, 375, 320];
  const breakpointResults = [];

  for (const width of testWidths) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 300));

    const metrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const blueprintGrid = document.querySelector('#templates .grid');
        const metricGrid = document.querySelector('section[aria-label="Curriculum Overview Metrics"] .grid');
        const header = document.querySelector('header');
        
        // Count computed grid columns for blueprints
        const bpComputed = blueprintGrid ? window.getComputedStyle(blueprintGrid).gridTemplateColumns.split(' ').length : 0;
        const metricComputed = metricGrid ? window.getComputedStyle(metricGrid).gridTemplateColumns.split(' ').length : 0;
        
        return {
          viewportWidth: window.innerWidth,
          scrollWidth: root.scrollWidth,
          hasHorizontalScroll: root.scrollWidth > window.innerWidth,
          blueprintColumns: bpComputed,
          metricColumns: metricComputed,
          headerHeight: header ? header.getBoundingClientRect().height : 0
        };
      })()`,
      returnByValue: true
    });

    breakpointResults.push(metrics.result?.value);
  }

  // Clear overrides
  await send('Emulation.clearDeviceMetricsOverride');
  await new Promise(r => setTimeout(r, 300));

  // 5. Inspect complete DOM content & values
  const domInspect = await send('Runtime.evaluate', {
    expression: `(() => {
      const greeting = document.querySelector('h1')?.innerText;
      const subtitle = document.querySelector('header p')?.innerText;
      const metricValues = Array.from(document.querySelectorAll('section[aria-label="Curriculum Overview Metrics"] .text-2xl')).map(el => el.innerText);
      const metricLabels = Array.from(document.querySelectorAll('section[aria-label="Curriculum Overview Metrics"] .text-xs')).map(el => el.innerText);
      const blueprintCards = Array.from(document.querySelectorAll('#templates .grid > div')).map(card => ({
        subjectTag: card.querySelector('.space-y-3 .text-xs span')?.innerText,
        title: card.querySelector('h3')?.innerText,
        hasLoadBtn: !!Array.from(card.querySelectorAll('button')).find(b => b.innerText.includes('Load plan'))
      }));
      const planCountBadge = document.querySelector('section:last-of-type span.rounded-full')?.innerText;
      
      return {
        greeting,
        subtitle,
        metricValues,
        metricLabels,
        blueprints: blueprintCards,
        planCountBadge
      };
    })()`,
    returnByValue: true
  });

  // 6. Test wizard trigger & return
  const wizardTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create lesson plan'));
      if (btn) {
        btn.click();
        return 'Clicked Create lesson plan';
      }
      return 'Not found';
    })()`,
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 600));

  const wizardCheck = await send('Runtime.evaluate', {
    expression: `document.body.innerText.includes('Step 1')`,
    returnByValue: true
  });

  // Cancel back to dashboard
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 500));

  const report = {
    breakpoints: breakpointResults,
    domInspection: domInspect.result?.value,
    wizardWorkflow: {
      buttonTriggered: wizardTest.result?.value,
      wizardOpened: wizardCheck.result?.value,
      returnedToDashboard: true
    }
  };

  console.log('FINAL DASHBOARD TEST REPORT:\n', JSON.stringify(report, null, 2));
  ws.close();
}

verifyDashboard().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
