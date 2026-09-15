const puppeteer = require('puppeteer');
const delay = ms => new Promise(res => setTimeout(res, ms));
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Assuming login page is visible initially
  // Type into user login
  await page.type('input[placeholder*="ID"]', '9370536868');
  await page.type('input[placeholder*="Password"]', 'Kumar@9370');
  
  // Click login
  const buttons = await page.$$('button');
  for (let btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('लॉगिन करा')) {
       await btn.click();
       break;
    }
  }
  
  await delay(3000);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Logged in? Includes Dashboard?", bodyText.includes('Dashboard') || bodyText.includes('डॅशबोर्ड'));
  
  await browser.close();
})();
