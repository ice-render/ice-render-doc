const { chromium } = require('playwright');

(async () => {
  const errors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto('http://localhost:4321/docs/examples/er-node-skeleton', { waitUntil: 'networkidle', timeout: 30000 });

  // 等画布渲染 + 初始 schema 出现 User
  await page.waitForFunction(() => {
    const pre = document.querySelector('pre code');
    return pre && pre.textContent.includes('"User"');
  }, { timeout: 15000 });

  const measure = async () => page.evaluate(() => {
    const c = document.querySelector('canvas');
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
    const pre = document.querySelector('pre code');
    return pre && pre.textContent.includes('User_copy');
  }, { timeout: 10000 });
  const after = await measure();

  // 点「＋ 字段」验证字段追加同步到 schema
  await page.locator('button', { hasText: '＋ 字段' }).click();
  await page.waitForTimeout(300);
  const afterAdd = await measure();

  const schemaText = await page.evaluate(() => document.querySelector('pre code').textContent);

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
