const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/LOQ/.gemini/antigravity-ide/brain/1d623a23-08a8-405f-a200-4f22443b4abe';

async function runVerification() {
  const profileDir = path.join(ARTIFACT_DIR, 'chrome_verify_profile_' + Date.now());
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  console.log('Launching headless Chrome with CDP...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--disable-gpu',
    `--user-data-dir=${profileDir}`,
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  let res, targets, page;
  try {
    res = await fetch('http://localhost:9444/json');
    targets = await res.json();
    page = targets.find(t => t.type === 'page');
  } catch (err) {
    console.error('Failed to connect to Chrome:', err);
    chrome.kill();
    process.exit(1);
  }

  if (!page) {
    console.error('No page found');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p={}) => new Promise(resolve => {
    const i = id++;
    const h = e => {
      const d = JSON.parse(e.data);
      if (d.id === i) {
        ws.removeEventListener('message', h);
        resolve(d.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  async function evaluate(code) {
    const r = await send('Runtime.evaluate', { expression: code, returnByValue: true, awaitPromise: true });
    return r?.result?.value;
  }

  async function screenshot(name) {
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, name);
    fs.writeFileSync(outPath, Buffer.from(ss.data, 'base64'));
    console.log(`Saved screenshot: ${name}`);
  }

  // 1. Desktop 1280px view - Dashboard Saved Plans
  console.log('Step 1: Inspecting Dashboard minimal cards (Desktop 1280px)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); window.scrollTo(0, 0);`);
  await new Promise(r => setTimeout(r, 1000));

  // Scroll down to the curriculum plans section
  await evaluate(`
    const header = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Curriculum Units in Progress') || h.textContent.includes('Active Curriculum Plans') || h.textContent.includes('Plans'));
    if (header) header.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo(0, 650);
  `);
  await new Promise(r => setTimeout(r, 500));
  await screenshot('dashboard_saved_plans_desktop_light.png');

  // Verify dashboard cards
  const dashCardsCheck = await evaluate(`
    (() => {
      const planCards = Array.from(document.querySelectorAll('.grid > .group.cursor-pointer')).filter(c => c.textContent.includes('Open Plan'));
      return {
        planCardsCount: planCards.length,
        hasOverviewParagraphs: planCards.some(c => c.querySelector('p') !== null),
        firstTitle: planCards[0]?.querySelector('h3')?.textContent,
        firstSubjectGrade: planCards[0]?.querySelector('.truncate')?.textContent,
        firstStatus: planCards[0]?.querySelector('.rounded-full, .rounded')?.textContent?.trim()
      };
    })()
  `);
  console.log('Dashboard cards check:', dashCardsCheck);

  // 2. Navigate to Plans Library
  console.log('Step 2: Navigating to Curriculum Library...');
  await evaluate(`
    const libLink = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.trim().toLowerCase().includes('library') || el.textContent.trim().toLowerCase().includes('my plans'));
    if (libLink) libLink.click();
    window.scrollTo(0, 0);
  `);
  await new Promise(r => setTimeout(r, 1000));
  await evaluate(`window.scrollTo(0, 0);`);
  await screenshot('library_cards_desktop_light.png');

  // Verify library layout
  const libCardsCheck = await evaluate(`
    (() => {
      const title = document.querySelector('h1')?.textContent;
      const cards = Array.from(document.querySelectorAll('.grid > .group.cursor-pointer'));
      return {
        pageTitle: title,
        cardCount: cards.length,
        firstTitle: cards[0]?.querySelector('h3')?.textContent,
        firstFooter: cards[0]?.querySelector('.mt-4')?.textContent?.trim()
      };
    })()
  `);
  console.log('Library cards check:', libCardsCheck);

  // 3. Test three-dot menu open and ensure it does NOT open the plan
  console.log('Step 3: Testing 3-dot menu click (should not open plan)...');
  await evaluate(`
    const menuBtn = document.querySelectorAll('.grid > .group.cursor-pointer button[aria-label="More actions"]')[0];
    if (menuBtn) menuBtn.click();
  `);
  await new Promise(r => setTimeout(r, 500));
  await screenshot('library_card_menu_open.png');

  const menuOpenCheck = await evaluate(`
    (() => {
      const menu = document.querySelector('.relative .absolute.z-30');
      const isStillInLibrary = document.querySelector('h1')?.textContent.includes('Curriculum Plans');
      return { menuVisible: !!menu, isStillInLibrary };
    })()
  `);
  console.log('Menu open check:', menuOpenCheck);

  // 4. Click card title to open plan workspace
  console.log('Step 4: Clicking card title to open complete workspace...');
  await evaluate(`
    const firstCard = document.querySelectorAll('.grid > .group.cursor-pointer')[0];
    if (firstCard) {
      const title = firstCard.querySelector('h3');
      if (title) title.click();
    }
  `);
  await new Promise(r => setTimeout(r, 1200));
  await evaluate(`window.scrollTo(0, 0);`);

  // Switch to Standards Alignment tab
  console.log('Step 5: Opening Standards Alignment Tab and resetting scroll...');
  await evaluate(`
    const stdTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Standards'));
    if (stdTab) stdTab.click();
    window.scrollTo(0, 0);
  `);
  await new Promise(r => setTimeout(r, 800));
  await evaluate(`window.scrollTo(0, 0);`);
  await screenshot('standards_matrix_desktop_light.png');

  // Verify Standards Matrix table & data
  const standardsDataCheck = await evaluate(`
    (() => {
      const heading = document.querySelector('h2')?.textContent;
      const countBadge = document.querySelector('h2')?.parentElement?.parentElement?.querySelector('span.rounded-full')?.textContent;
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const searchInput = document.querySelector('input[placeholder*="Search by code"]');
      const frameworkSelect = document.querySelector('select');
      return {
        heading,
        countBadge,
        rowCount: rows.length,
        hasSearch: !!searchInput,
        hasFrameworkSelect: !!frameworkSelect,
        firstCode: rows[0]?.querySelector('td span.font-mono')?.textContent,
        firstSummary: rows[0]?.querySelectorAll('td')[2]?.textContent?.trim()
      };
    })()
  `);
  console.log('Standards data check:', standardsDataCheck);

  // 6. Expand standard details drawer
  console.log('Step 6: Expanding standard details drawer...');
  await evaluate(`
    const detailBtn = document.querySelectorAll('tbody tr button')[0];
    if (detailBtn) detailBtn.click();
  `);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('standards_row_expanded_details_light.png');

  const expandedDetailsCheck = await evaluate(`
    (() => {
      const drawer = document.querySelector('tbody tr td[colspan="5"]');
      return {
        drawerVisible: !!drawer,
        hasFullDesc: drawer?.textContent.includes('Full Competency Description'),
        hasRationale: drawer?.textContent.includes('Alignment Rationale'),
        hasConnectedLessons: drawer?.textContent.includes('Connected Curriculum Sessions'),
        hasVerification: drawer?.textContent.includes('Framework') && drawer?.textContent.includes('Status')
      };
    })()
  `);
  console.log('Expanded details check:', expandedDetailsCheck);

  // 7. Test search and filtering
  console.log('Step 7: Testing Standards search input...');
  await evaluate(`
    const search = document.querySelector('input[placeholder*="Search by code"]');
    if (search) {
      search.value = '1.1';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await new Promise(r => setTimeout(r, 500));
  await screenshot('standards_search_filtered.png');

  // Clear search
  await evaluate(`
    const clearBtn = document.querySelector('button[aria-label="Clear search"]');
    if (clearBtn) clearBtn.click();
  `);
  await new Promise(r => setTimeout(r, 400));

  // 8. Test Dark Mode
  console.log('Step 8: Testing Dark Mode for Standards Matrix and Plans Library...');
  await evaluate(`
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    window.scrollTo(0, 0);
  `);
  await new Promise(r => setTimeout(r, 500));
  await screenshot('standards_matrix_dark.png');

  // Go to Library in dark mode
  await evaluate(`
    const libNav = Array.from(document.querySelectorAll('a, button')).find(b => b.textContent.includes('My Plans') || b.textContent.includes('Saved Library'));
    if (libNav) libNav.click();
    window.scrollTo(0, 0);
  `);
  await new Promise(r => setTimeout(r, 800));
  await evaluate(`window.scrollTo(0, 0);`);
  await screenshot('library_cards_dark.png');

  // 9. Test Mobile Viewport (375px)
  console.log('Step 9: Testing Mobile Viewport (375px)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await evaluate(`window.scrollTo(0, 0);`);
  await new Promise(r => setTimeout(r, 600));
  await screenshot('library_cards_mobile_dark.png');

  // Open first plan on mobile
  await evaluate(`
    const card = document.querySelectorAll('.grid > .group.cursor-pointer')[0];
    if (card) {
      const openBtn = card.querySelector('button') || card;
      openBtn.click();
    }
  `);
  await new Promise(r => setTimeout(r, 1200));

  // Switch to Standards tab on mobile
  await evaluate(`
    const stdTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Standards'));
    if (stdTab) stdTab.click();
    window.scrollTo(0, 0);
  `);
  await new Promise(r => setTimeout(r, 600));
  await evaluate(`window.scrollTo(0, 0);`);
  await screenshot('standards_mobile_cards_dark.png');

  // Expand standard on mobile
  await evaluate(`
    const viewBtn = document.querySelectorAll('.md\\\\:hidden button')[0];
    if (viewBtn) viewBtn.click();
  `);
  await new Promise(r => setTimeout(r, 500));
  await screenshot('standards_mobile_expanded_dark.png');

  const mobileCheck = await evaluate(`
    (() => {
      const mobileCards = document.querySelectorAll('.md\\\\:hidden > div');
      const tableHidden = window.getComputedStyle(document.querySelector('.hidden.md\\\\:block') || document.body).display === 'none';
      const bodyOverflowX = document.body.scrollWidth > window.innerWidth;
      return {
        mobileCardsCount: mobileCards.length,
        tableHidden,
        hasHorizontalOverflow: bodyOverflowX
      };
    })()
  `);
  console.log('Mobile layout check:', mobileCheck);

  console.log('All verifications completed successfully!');
  chrome.kill();
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
