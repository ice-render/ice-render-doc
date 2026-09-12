const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3000/docs/entity-designer', { waitUntil: 'networkidle', timeout: 60000 });
  // Give the SPA time to mount the sidebar
  await page.waitForTimeout(2500);

  // Extract sidebar item texts (Docusaurus sidebar links live in <nav> with class theme-doc-sidebar)
  const sidebar = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return { found: false };
    const links = Array.from(nav.querySelectorAll('a, span, .menu__link, .theme-doc-sidebar-item-category, .theme-doc-sidebar-item-link'));
    const texts = Array.from(nav.querySelectorAll('*'))
      .map((el) => el.textContent && el.childElementCount === 0 ? el.textContent.trim() : null)
      .filter((t) => t && t.length > 0);
    return { found: true, html: nav.outerHTML.slice(0, 1500), firstLevel: texts.slice(0, 30) };
  });

  console.log('=== SIDEBAR ===');
  console.log(JSON.stringify(sidebar.firstLevel, null, 2));

  await page.screenshot({ path: '/tmp/entity-designer-page.png', fullPage: false });
  console.log('screenshot saved /tmp/entity-designer-page.png');
  await browser.close();
  process.exit(0);
})();
