const { chromium } = require('playwright');

// ER 节点骨架 playground 已整合进「基于内核二次开发」页（§三），
// 该页还有其它 IceCanvas/code 块，故用「复制节点」按钮定位其所属容器，
// 只测量该容器内的 canvas 与 TypeORM Schema <pre>。
const ROUTE = 'http://localhost:4321/docs/advanced/secondary-development';

function containerLocatorJS() {
  // 返回包含「复制节点」按钮的 ERNodePlayground 外层容器（含 canvas + schema pre）
  return `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.textContent || '').includes('复制节点'));
    if (!btn) return null;
    let el = btn;
    while (el && !(el.querySelector && el.querySelector('canvas') && el.querySelector('pre code'))) {
      el = el.parentElement;
    }
    return el;
  })()`;
}

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto(ROUTE, { waitUntil: 'networkidle', timeout: 30000 });

  // 等 ER 节点骨架 playground 渲染（右侧 schema 出现 "User"）
  await page.waitForFunction(() => {
    const el = (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => (b.textContent || '').includes('复制节点'));
      if (!btn) return null;
      let e = btn;
      while (e && !(e.querySelector && e.querySelector('pre code'))) e = e.parentElement;
      return e;
    })();
    const pre = el ? el.querySelector('pre code') : null;
    return pre && pre.textContent.includes('"User"');
  }, { timeout: 15000 });

  const measure = async () => page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.textContent || '').includes('复制节点'));
    let el = btn;
    while (el && !(el.querySelector && el.querySelector('canvas'))) el = el.parentElement;
    const c = el ? el.querySelector('canvas') : document.querySelector('canvas');
    const ctx = c.getContext('2d');
    const { width, height } = c;
    const data = ctx.getImageData(0, 0, width, height).data;
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) { if (data[i] > 10) painted++; }
    return { width, height, painted };
  });

  const before = await measure();

  // 点「复制节点」
  await page.locator('button', { hasText: '复制节点' }).click();
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.textContent || '').includes('复制节点'));
    let e = btn;
    while (e && !(e.querySelector && e.querySelector('pre code'))) e = e.parentElement;
    const pre = e ? e.querySelector('pre code') : null;
    return pre && pre.textContent.includes('User_copy');
  }, { timeout: 10000 });
  const after = await measure();

  // 点「＋ 字段」验证字段追加同步到 schema
  await page.locator('button', { hasText: '＋ 字段' }).click();
  await page.waitForTimeout(300);
  const afterAdd = await measure();

  const schemaText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => (b.textContent || '').includes('复制节点'));
    let e = btn;
    while (e && !(e.querySelector && e.querySelector('pre code'))) e = e.parentElement;
    const pre = e ? e.querySelector('pre code') : null;
    return pre ? pre.textContent : '';
  });

  const result = {
    before, after, afterAdd,
    consoleErrors: errors,
    schemaHasUser: schemaText.includes('"User"'),
    schemaHasCopy: schemaText.includes('User_copy'),
    schemaHasFieldN: schemaText.includes('field_'),
    schemaLen: schemaText.length,
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(errors.length ? 2 : 0);
})().catch((e) => { console.error('VERIFY FAIL', e); process.exit(1); });
