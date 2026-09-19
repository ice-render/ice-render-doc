const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:3100';
const PAGES = [
  // 用户向正文里的 LiveExample 也要真机验：事件系统那页有两个示例（冒泡 / 两套 API）
  { path: '/docs/guide/events', name: 'guide-events' },
  { path: '/docs/ice-web-components', name: 'ice-web-components' },
  { path: '/docs/ice-chart', name: 'ice-chart' },
  { path: '/docs/entity-designer', name: 'entity-designer' },
];

/**
 * 页面总落墨（主文档 + 全部 iframe）。
 *
 * LiveExample 从 2026-09-13 起用 iframe 隔离示例（一个文档页里多个示例都用 `id="canvas"`，
 * 注入同一份 document 会互相抢画布），所以这里必须连 iframe 一起量；只查父文档会恒为 0，
 * 把正常页面判成失败（这正是本脚本 2026-09-14 之前的状态）。
 */
const paintOfFrames = async (page) => {
  let total = 0;
  for (const frame of page.frames()) {
    total += await frame
      .evaluate(() => {
        let sum = 0;
        document.querySelectorAll('canvas').forEach((cv) => {
          try {
            const ctx = cv.getContext('2d');
            if (!ctx || !cv.width || !cv.height) return;
            const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
            for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) sum += 1;
          } catch (e) {
            /* tainted / 未就绪忽略 */
          }
        });
        return sum;
      })
      .catch(() => 0);
  }
  return total;
};

/** LiveExample 的 iframe 是 loading="lazy"：不滚过去就不会加载。 */
async function scrollThrough(page) {
  for (let i = 0; i <= 12; i++) {
    await page.evaluate((n) => window.scrollTo(0, (document.body.scrollHeight * n) / 12), i);
    await page.waitForTimeout(220);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

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
      await scrollThrough(page); // 触发 lazy iframe
      // 轮询等待画布涂画像素（示例加载 UMD + 初始化 + 首帧）
      const deadline = Date.now() + 25000;
      while (Date.now() < deadline) {
        pixels = await paintOfFrames(page);
        if (pixels > 500) break;
        await page.waitForTimeout(500);
      }
      if (pixels <= 500) errors.push('paint/timeout: 25s 内没有量到落墨');
    } catch (e) {
      errors.push('paint/timeout: ' + e.message.split('\n')[0]);
    }
    iframeCount = await page.evaluate(() => document.querySelectorAll('iframe').length);
    results.push({ name: p.name, iframeCount, liveCount, pixels, errors });
    await page.close();
  }
  await browser.close();

  let ok = true;
  for (const r of results) {
    // 判据：页面上有实时示例容器、**连 iframe 一起**量到落墨、零控制台报错。
    // 不再要求 iframe === 0，也不再写死示例个数（示例现在就是 iframe，个数会随文档增长）。
    const pass = r.liveCount > 0 && r.iframeCount === r.liveCount && r.pixels > 500 && r.errors.length === 0;
    if (!pass) ok = false;
    console.log(
      `[${pass ? 'PASS' : 'FAIL'}] ${r.name}: liveExamples=${r.liveCount} iframes=${r.iframeCount} paintedPixels=${r.pixels} errors=${r.errors.length}`,
    );
    r.errors.slice(0, 6).forEach((e) => console.log('    ! ' + e));
  }
  console.log(ok ? 'ALL PASS' : 'SOME FAILED');
  process.exit(ok ? 0 : 1);
})();
