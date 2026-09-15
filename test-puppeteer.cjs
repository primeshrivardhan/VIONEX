const puppeteer = require('puppeteer');
const delay = ms => new Promise(res => setTimeout(res, ms));
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/?view=location-mapping');
  
  await page.evaluate(() => {
    localStorage.setItem("vionex-current-user", JSON.stringify({
      id: "admin", type: "user", data: { name: "Admin", loginId: "admin", access: true, role: "admin" }
    }));
  });
  
  await page.goto('http://localhost:3000/?view=location-mapping');
  await delay(3000);
  
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('.text-sm.font-mono.whitespace-pre-wrap.break-words');
    return el ? el.textContent : 'No error found on screen';
  });
  
  console.log('ERROR ON SCREEN:', errorText);
  await browser.close();
})();
