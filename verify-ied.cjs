const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto('http://127.0.0.1:3000/ied/entity-editor.html', { waitUntil: 'load', timeout: 60000 });

  // Wait for IED global + designer to boot (the inline script sets window.__designer)
  await page.waitForFunction(() => window.IED && window.__designer, null, { timeout: 30000 }).catch(() => {});

  const iedReady = await page.evaluate(() => !!window.IED);
  const designerReady = await page.evaluate(() => !!(window.__designer && window.__designer.entities));
  const entityCount = await page.evaluate(() => (window.__designer && window.__designer.entities ? window.__designer.entities.length : 0));

  // Measure painted (non-transparent) pixels on the editor canvas
  const painted = await page.evaluate(() => {
    const c = document.getElementById('canvas-1');
    if (!c) return -1;
    const ctx = c.getContext('2d');
    const { width, height } = c;
    const data = ctx.getImageData(0, 0, width, height).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 10) n++;
    return n;
  });

  console.log(JSON.stringify({ iedReady, designerReady, entityCount, painted, consoleErrors, pageErrors }, null, 2));
  await browser.close();
  process.exit(0);
})();
