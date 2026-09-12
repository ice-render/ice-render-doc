const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3000/docs/entity-designer', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Extract navbar link texts
  const navbar = await page.evaluate(() => {
    const nav = document.querySelector('.navbar__items--left, .navbar__items');
    if (!nav) return { found: false };
    const links = Array.from(nav.querySelectorAll('a.navbar__item'));
    return { found: true, items: links.map(a => ({ text: a.textContent.trim(), href: a.href })) };
  });

  console.log('=== NAVBAR ===');
  console.log(JSON.stringify(navbar, null, 2));

  await page.screenshot({ path: '/tmp/entity-designer-navbar.png', fullPage: false });
  console.log('screenshot saved /tmp/entity-designer-navbar.png');
  await browser.close();
  process.exit(0);
})();
