const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:3100';
const PAGES = [
  { path: '/docs/ice-web-components', name: 'ice-web-components', count: 6 },
  { path: '/docs/ice-chart', name: 'ice-chart', count: 2 },
  { path: '/docs/entity-designer', name: 'entity-designer', count: 1 },
];

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const results = [];
  for (const p of PAGES) {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto(BASE + p.path, { waitUntil: 'load' });

    let liveCount = 0;
    let pixels = 0;
    let iframeCount = -1;
    try {
      await page.waitForSelector('[data-live-example]', { timeout: 15000 });
      liveCount = await page.evaluate(() => document.querySelectorAll('[data-live-example]').length);
      // 轮询等待画布涂画像素（示例异步 fetch + 加载 UMD + 初始化）
      await page.waitForFunction(
        () => {
          let total = 0;
          document.querySelectorAll('[data-live-example]').forEach((c) => {
            c.querySelectorAll('canvas').forEach((cv) => {
              try {
                const ctx = cv.getContext('2d');
                if (!ctx || !cv.width || !cv.height) return;
                const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
                for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) total += 1;
              } catch (e) {
                /* tainted / 未就绪忽略 */
              }
            });
          });
          return total > 500;
        },
        null,
        { timeout: 25000 },
      );
      pixels = await page.evaluate(() => {
        let total = 0;
        document.querySelectorAll('[data-live-example]').forEach((c) => {
          c.querySelectorAll('canvas').forEach((cv) => {
            try {
              const ctx = cv.getContext('2d');
              if (!ctx) return;
              const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
              for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) total += 1;
            } catch (e) {}
          });
        });
        return total;
      });
    } catch (e) {
      errors.push('paint/timeout: ' + e.message.split('\n')[0]);
    }
    iframeCount = await page.evaluate(() => document.querySelectorAll('iframe').length);
    results.push({ name: p.name, iframeCount, liveCount, expected: p.count, pixels, errors });
    await page.close();
  }
  await browser.close();

  let ok = true;
  for (const r of results) {
    const pass =
      r.iframeCount === 0 && r.liveCount === r.expected && r.pixels > 500 && r.errors.length === 0;
    if (!pass) ok = false;
    console.log(
      `[${pass ? 'PASS' : 'FAIL'}] ${r.name}: iframe=${r.iframeCount} live=${r.liveCount}/${r.expected} pixels=${r.pixels} errors=${r.errors.length}`,
    );
    r.errors.slice(0, 6).forEach((e) => console.log('    ! ' + e));
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAILED');
  process.exit(ok ? 0 : 1);
})();
