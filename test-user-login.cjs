const puppeteer = require('puppeteer');
const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await delay(2000);
  
  // Ensure we are on user login
  const switchBtns = await page.$$('button');
  for (let btn of switchBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('युजर लॉगिन')) {
       await btn.click();
       break;
    }
  }
  await delay(1000);

  // Type into user login
  const inputs = await page.$$('input');
  await inputs[0].type('9370536868'); // User ID
  await inputs[1].type('Kumar@9370'); // Password
  
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
  console.log(bodyText);
  
  await page.screenshot({path: 'user_login.png'});
  await browser.close();
})();
