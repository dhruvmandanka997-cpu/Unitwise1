const { spawn } = require('child_process');

async function inspectLayout() {
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

  const result = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const appHeader = document.querySelector('header');
      const stickySubbar = document.querySelector('div.sticky');
      const main = document.querySelector('main');
      const tabs = document.querySelector('div.sticky div.overflow-x-auto');
      
      // Find the content element directly beneath the sticky bar
      // In PlanWorkspace, inside div.mx-auto.max-w-7xl:
      const workspaceRoot = document.querySelector('div.mx-auto.max-w-7xl');
      const children = workspaceRoot ? Array.from(workspaceRoot.children) : [];
      const contentSections = children.slice(1); // after sticky bar

      return {
        appHeader: appHeader ? {
          rect: appHeader.getBoundingClientRect(),
          position: getComputedStyle(appHeader).position,
          top: getComputedStyle(appHeader).top,
          height: getComputedStyle(appHeader).height,
          zIndex: getComputedStyle(appHeader).zIndex,
        } : null,
        stickySubbar: stickySubbar ? {
          rect: stickySubbar.getBoundingClientRect(),
          position: getComputedStyle(stickySubbar).position,
          top: getComputedStyle(stickySubbar).top,
          height: getComputedStyle(stickySubbar).height,
          zIndex: getComputedStyle(stickySubbar).zIndex,
          marginTop: getComputedStyle(stickySubbar).marginTop,
          marginBottom: getComputedStyle(stickySubbar).marginBottom,
        } : null,
        tabs: tabs ? {
          rect: tabs.getBoundingClientRect(),
        } : null,
        main: main ? {
          rect: main.getBoundingClientRect(),
          overflow: getComputedStyle(main).overflow,
          height: getComputedStyle(main).height,
        } : null,
        workspaceRoot: workspaceRoot ? {
          rect: workspaceRoot.getBoundingClientRect(),
          paddingTop: getComputedStyle(workspaceRoot).paddingTop,
          marginTop: getComputedStyle(workspaceRoot).marginTop,
        } : null,
        contentSections: contentSections.map(c => ({
          tagName: c.tagName,
          className: c.className,
          rect: c.getBoundingClientRect(),
        }))
      };
    })()`
  });

  console.log('LAYOUT INSPECTION RESULT:');
  console.log(JSON.stringify(result?.result?.value || result, null, 2));

  // Also test scrolling down 100px and 300px
  await send('Runtime.evaluate', { expression: "window.scrollBy(0, 150);" });
  await new Promise(r => setTimeout(r, 400));

  const scrolledResult = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const appHeader = document.querySelector('header');
      const stickySubbar = document.querySelector('div.sticky');
      const firstSection = document.querySelector('div.mx-auto.max-w-7xl > div:nth-child(2)');
      const firstHeading = firstSection ? firstSection.querySelector('h2, h3, h4') : null;

      return {
        scrollY: window.scrollY,
        appHeaderRect: appHeader ? appHeader.getBoundingClientRect() : null,
        stickySubbarRect: stickySubbar ? stickySubbar.getBoundingClientRect() : null,
        firstSectionRect: firstSection ? firstSection.getBoundingClientRect() : null,
        firstHeadingRect: firstHeading ? {
          text: firstHeading.innerText,
          rect: firstHeading.getBoundingClientRect()
        } : null,
        overlap: stickySubbar && firstHeading ? {
          isOverlapping: firstHeading.getBoundingClientRect().top < stickySubbar.getBoundingClientRect().bottom,
          diff: stickySubbar.getBoundingClientRect().bottom - firstHeading.getBoundingClientRect().top
        } : null
      };
    })()`
  });

  console.log('SCROLLED RESULT:');
  console.log(JSON.stringify(scrolledResult?.result?.value || scrolledResult, null, 2));

  ws.close();
  chrome.kill();
}

inspectLayout().catch(console.error);
