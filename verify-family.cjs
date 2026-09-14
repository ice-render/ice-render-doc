// 校验 ice-chart / ice-web-components 文档页的 navbar / sidebar / 实时示例
// 用法：先起一个静态服务指向构建产物，再 node verify-family.cjs（默认 3100）：
//   npx http-server build -p 3100 -s        # 站点在根路径时
//   npx http-server . -p 3100 -s            # 站点在子路径 /ice-render-doc/ 时（父目录里带同名软链）
// 注意：不要用 `docusaurus serve` —— 它把 `/ice-chart/xxx.html` 301 到首页，示例页永远加载不到。
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:3100';

const paintOf = async (frame) => frame.evaluate(() => {
  const cs = Array.from(document.querySelectorAll('canvas'));
  let total = 0;
  for (const c of cs) {
    try {
      const ctx = c.getContext('2d');
      if (!ctx || !c.width || !c.height) continue;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 10) total++;
    } catch (e) { /* tainted */ }
  }
  return total;
});

/**
 * 页面总落墨 = **主文档 + 全部 iframe**。
 *
 * LiveExample 从 2026-09-13 起改成 iframe（见 src/components/LiveExample.jsx：一个文档页里
 * 多个示例都用 `id="canvas"`，注入同一份 document 会互相抢画布）。所以「文档页里有没有画出来」
 * 必须连 iframe 一起量 —— 只查父文档会永远是 0 像素，把好好的页面判成失败。
 */
const paintOfPage = async (page) => {
  let total = 0;
  for (const frame of page.frames()) {
    total += await paintOf(frame).catch(() => 0);
  }
  return total;
};

/** LiveExample 的 iframe 是 loading="lazy"：不滚过去就不会加载。 */
async function scrollThrough(page) {
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((n) => {
      const ratio = n / 12;
      window.scrollTo(0, document.body.scrollHeight * ratio);
    }, i);
    await page.waitForTimeout(220);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function checkPage(browser, path, { label }) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });

  // navbar 含目标入口
  const navText = await page.locator('nav[aria-label="Main"]').innerText();
  const navOk = navText.includes(label) && navText.includes('Entity Designer');

  // sidebar 含目标入口
  const sideText = await page.locator('aside').innerText().catch(() => '');
  const sideOk = sideText.includes(label);

  // 页面里的实时示例（LiveExample 的 [data-live-example] iframe）与画布落墨
  const live = await page.locator('[data-live-example]').count().catch(() => 0);
  await scrollThrough(page); // 触发 lazy iframe
  let paint = 0;
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    paint = await paintOfPage(page);
    if (paint > 1000) break;
    await page.waitForTimeout(500);
  }
  const iframes = await page.locator('iframe').count().catch(() => 0);
  await page.close();
  return { path, label, navOk, sideOk, live, iframes, paint, errors };
}

// 校验 5 个「趣味示例」能真实跑起来。
//
// 口径说明（2026-09-14 重写）：这些示例**已经不用 iframe**（见 src/components/LiveExample.jsx：
// 把示例 HTML 的 body/style 内联注入文档页、执行其初始化脚本）。但**不能**按「文档页里的内联画布」
// 判定——6 个示例同页同时跑（gallery 的画布是 1400×5540），主线程被最重的那个占满，
// 其余画布长时间不落墨（实测新旧 bundle 都一样，非回归）。所以这里**逐个独立打开示例页**验证
// 「加载 → 初始化 → 画布落墨 → 零控制台报错」，文档页里的内联挂载与零报错由 verify-inline.cjs 负责。
async function checkFunDemos(browser) {
  // name 对应 /ice-web-components/<name>.html；handle 是示例脚本自己挂到 window 上的句柄
  // （XP 示例挂的是 `__result = { ice, desktop, ... }`，不是 `__xp`）
  const demos = [
    { name: 'windows-xp', handle: '__result' },
    { name: 'arcade', handle: '__arcade' },
    { name: 'pixel-editor', handle: '__pixel' },
    { name: 'algorithm-sandbox', handle: '__algo' },
    { name: 'dos-terminal', handle: '__dos' },
  ];
  const out = [];
  const errors = [];
  for (const { name, handle } of demos) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
    page.on('pageerror', (e) => errors.push(name + ' pageerror: ' + e.message));
    await page.goto(`${BASE}/ice-web-components/${name}.html`, { waitUntil: 'load' });

    // 示例脚本挂自己的 window 句柄；再轮询等画布落墨（重场景首帧可能要几秒）
    await page.waitForFunction((h) => !!window[h], handle, { timeout: 20000 }).catch(() => {});
    let paint = 0;
    for (let t = 0; t < 24; t++) {
      paint = await page
        .evaluate(() => {
          const c = document.querySelector('canvas');
          if (!c) return 0;
          try {
            const ctx = c.getContext('2d');
            if (!ctx || !c.width || !c.height) return 0;
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            let n = 0;
            for (let i = 3; i < d.length; i += 4) if (d[i] > 10) n += 1;
            return n;
          } catch (e) {
            return 0;
          }
        })
        .catch(() => 0);
      if (paint > 1000) break;
      await page.waitForTimeout(500);
    }

    const globalOk = await page.evaluate((h) => !!window[h], handle).catch(() => false);
    if (!globalOk) errors.push('handle missing: ' + handle);
    if (!(paint > 1000)) errors.push('canvas not painted: ' + name + ' (' + paint + 'px)');
    out.push({ name, handle, globalOk, paint });
    await page.close();
  }
  return { out, errors };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  results.push(await checkPage(browser, '/docs/ice-chart', {
    label: 'ice-chart',
  }));
  results.push(await checkPage(browser, '/docs/ice-web-components', {
    label: 'ice-web-components',
  }));
  const fun = await checkFunDemos(browser);
  // intro 页 navbar 也应包含两个新入口
  const page = await browser.newPage();
  await page.goto(BASE + '/docs/intro', { waitUntil: 'networkidle' });
  const nav = await page.locator('nav[aria-label="Main"]').innerText();
  const introNavOk = nav.includes('ice-chart') && nav.includes('ice-web-components') && nav.includes('Entity Designer');
  await page.close();
  await browser.close();

  let allOk = true;
  for (const r of results) {
    // 判据：导航 / 侧边栏有入口，页面上有实时示例容器，且**连 iframe 一起**量到落墨，零控制台报错。
    // （不再要求 iframes === 0 —— 示例现在就是靠 iframe 隔离的，见 paintOfPage 的说明。）
    const ok = r.navOk && r.sideOk && r.live > 0 && r.paint > 1000 && r.errors.length === 0;
    allOk = allOk && ok;
    console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${r.label}  (${r.path})`);
    console.log(
      `   navbar=${r.navOk}  sidebar=${r.sideOk}  liveExamples=${r.live}  iframes=${r.iframes}  paintedPixels=${r.paint}`,
    );
    if (r.errors.length) console.log('   ERRORS:\n   - ' + r.errors.join('\n   - '));
  }
  for (const d of fun.out) {
    const ok = d.globalOk && d.paint > 1000;
    allOk = allOk && ok;
    console.log(`\n[${ok ? 'PASS' : 'FAIL'}] fun demo: ${d.name}`);
    console.log(`   handle(window.${d.handle})=${d.globalOk}  paintedPixels=${d.paint}`);
  }
  if (fun.errors.length) {
    allOk = false;
    console.log('\n   FUN DEMO PAGE ERRORS:\n   - ' + fun.errors.join('\n   - '));
  }
  console.log(`\n[intro navbar] ice-chart & ice-web-components & Entity Designer present = ${introNavOk}`);
  allOk = allOk && introNavOk;
  console.log(allOk ? '\n✅ ALL CHECKS PASSED' : '\n❌ SOME CHECKS FAILED');
  process.exit(allOk ? 0 : 1);
})();
