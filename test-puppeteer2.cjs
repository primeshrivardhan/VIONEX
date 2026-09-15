const puppeteer = require('puppeteer');
const delay = ms => new Promise(res => setTimeout(res, ms));
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  await page.evaluate(() => {
    localStorage.setItem("vionex-current-user", JSON.stringify({
      id: "admin", type: "user", data: { name: "Admin", loginId: "admin", access: true, role: "admin" }
    }));
  });
  
  await page.goto('http://localhost:3000');
  await delay(2000);
  
  await page.evaluate(() => {
    window.location.hash = "LocationMapping";
    const buttons = Array.from(document.querySelectorAll('*'));
    const btn = buttons.find(b => b.textContent && (b.textContent.trim() === 'Location Mapping' || b.textContent.trim() === 'लोकेशन मॅपिंग'));
    if (btn) {
      btn.click();
    }
  });
  
  await delay(2000);
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Map is not a constructor') || bodyText.includes('LocationMapping')) {
    console.log('Error or component found in body text.');
    console.log(bodyText.substring(0, 500));
  } else {
    console.log('No error found on screen');
  }
  
  await browser.close();
})();
