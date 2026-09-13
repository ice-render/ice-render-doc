// 校验 ice-chart / ice-web-components 文档页的 navbar / sidebar / iframe 实时渲染
// 用法：node verify-family.cjs  （需先 npm run serve 在某端口，默认 3100）
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

async function checkPage(browser, path, { label, globalName, iframeUrl, expectGlobal }) {
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

  // iframe 实时渲染
  const frame = page.frame({ url: new RegExp(iframeUrl) });
  let globalOk = false, paint = 0;
  if (frame) {
    await frame.waitForFunction((g) => window[g] && document.querySelector('canvas'), expectGlobal, { timeout: 15000 }).catch(() => {});
    globalOk = await frame.evaluate((g) => !!window[g], expectGlobal).catch(() => false);
    paint = await paintOf(frame).catch(() => 0);
  }
  await page.close();
  return { path, label, navOk, sideOk, globalOk, paint, errors };
}

// 校验 ice-web-components 文档页里 5 个「趣味示例」iframe 的实时渲染
// （docusaurus serve 会把 /x.html 301 到 /x，所以 frame url 正则放掉 .html 后缀）
async function checkFunIframes(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(BASE + '/docs/ice-web-components', { waitUntil: 'networkidle' });
  const demos = ['windows-xp', 'arcade', 'pixel-editor', 'algorithm-sandbox', 'dos-terminal'];
  const out = [];
  for (const name of demos) {
    // 触发懒加载：先把对应 iframe 滚进视口（否则 lazy 的框还没开始加载）
    const loc = page.locator(`iframe[src*="/ice-web-components/${name}.html"]`);
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    let frame = null;
    for (let t = 0; t < 40; t++) {
      frame = page.frame({ url: new RegExp('/ice-web-components/' + name + '(\\.html)?') });
      if (frame) break;
      await page.waitForTimeout(300);
    }
    let globalOk = false, paint = 0;
    if (frame) {
      await frame.waitForFunction(() => window.ICEWEB && document.querySelector('canvas'), { timeout: 15000 }).catch(() => {});
      globalOk = await frame.evaluate(() => !!window.ICEWEB).catch(() => false);
      paint = await paintOf(frame).catch(() => 0);
    } else {
      errors.push('frame missing: ' + name);
    }
    out.push({ name, globalOk, paint });
  }
  await page.close();
  return { out, errors };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  results.push(await checkPage(browser, '/docs/ice-chart', {
    label: 'ice-chart', globalName: 'ICEChart', iframeUrl: 'dashboard-market', expectGlobal: 'ICEChart',
  }));
  results.push(await checkPage(browser, '/docs/ice-web-components', {
    label: 'ice-web-components', globalName: 'ICEWEB', iframeUrl: 'gallery', expectGlobal: 'ICEWEB',
  }));
  const fun = await checkFunIframes(browser);
  // intro 页 navbar 也应包含两个新入口
  const page = await browser.newPage();
  await page.goto(BASE + '/docs/intro', { waitUntil: 'networkidle' });
  const nav = await page.locator('nav[aria-label="Main"]').innerText();
  const introNavOk = nav.includes('ice-chart') && nav.includes('ice-web-components') && nav.includes('Entity Designer');
  await page.close();
  await browser.close();

  let allOk = true;
  for (const r of results) {
    const ok = r.navOk && r.sideOk && r.globalOk && r.paint > 1000 && r.errors.length === 0;
    allOk = allOk && ok;
    console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${r.label}  (${r.path})`);
    console.log(`   navbar=${r.navOk}  sidebar=${r.sideOk}  global(${r.globalName})=${r.globalOk}  paintedPixels=${r.paint}`);
    if (r.errors.length) console.log('   ERRORS:\n   - ' + r.errors.join('\n   - '));
  }
  for (const d of fun.out) {
    const ok = d.globalOk && d.paint > 1000;
    allOk = allOk && ok;
    console.log(`\n[${ok ? 'PASS' : 'FAIL'}] fun demo: ${d.name}`);
    console.log(`   global(ICEWEB)=${d.globalOk}  paintedPixels=${d.paint}`);
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
