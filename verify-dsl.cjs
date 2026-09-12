const { chromium } = require('playwright');

// 验证「DSL 与 AI Agent 接入」页的 live DSLCanvas 真实渲染（ice-render-dsl 0.0.5 + 引擎 1.2.0）
const ROUTE = 'http://localhost:4321/docs/guide/dsl';

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto(ROUTE, { waitUntil: 'networkidle', timeout: 30000 });

  // 等画布真实落墨（alpha>10 的像素 > 0）
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas');
    if (!c) return false;
    const ctx = c.getContext('2d');
    const { width, height } = c;
    const data = ctx.getImageData(0, 0, width, height).data;
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] > 10) painted++; }
    return painted > 0;
  }, { timeout: 15000 });

  const measure = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const ctx = c.getContext('2d');
    const { width, height } = c;
    const data = ctx.getImageData(0, 0, width, height).data;
    let painted = 0;
    let colored = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 10) painted++;
      if (data[i] > 10 && (data[i - 3] > 10 || data[i - 2] > 10 || data[i - 1] > 10)) colored++;
    }
    return { width, height, painted, colored };
  });

  const hasIceDsl = await page.evaluate(() => typeof window.ICEDSL === 'object' && typeof window.ICEDSL.renderDsl === 'function');

  const result = {
    measure,
    hasIceDsl,
    consoleErrors: errors,
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(errors.length || !measure.painted || !hasIceDsl ? 2 : 0);
})().catch((e) => { console.error('VERIFY FAIL', e); process.exit(1); });
