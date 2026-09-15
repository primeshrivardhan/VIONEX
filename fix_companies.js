const fs = require('fs');

const filePath = 'src/lib/preseeded-products.ts';
let content = fs.readFileSync(filePath, 'utf8');

const match = content.match(/export const PRESEEDED_PRODUCTS: PreseededProduct\[\] = (\[[\s\S]*\]);/);
if (match) {
  try {
    const products = new Function(`return ${match[1]}`)();
    const newProducts = [];
    
    for (const p of products) {
      if (p.companyName && p.companyName.includes('/')) {
        const companies = p.companyName.split('/').map(c => c.trim());
        for (const c of companies) {
          newProducts.push({ ...p, companyName: c });
        }
      } else {
        newProducts.push(p);
      }
    }
    
    // Convert back to string
    let newArrayStr = JSON.stringify(newProducts, null, 2);
    // Remove quotes from keys for cleaner TS if preferred, but JSON is valid JS.
    
    const newContent = content.substring(0, match.index) + 
                       'export const PRESEEDED_PRODUCTS: PreseededProduct[] = ' + newArrayStr + ';' +
                       content.substring(match.index + match[0].length);
                       
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully split companies.");
  } catch(e) {
    console.error("Error evaluating array:", e);
  }
} else {
  console.log("No match found.");
}
