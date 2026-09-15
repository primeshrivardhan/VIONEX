const fs = require('fs');

const path = 'src/lib/preseeded-products.ts';
let content = fs.readFileSync(path, 'utf8');

// We need to do some AST parsing or just use a simple regex if it's well formatted, 
// but since it's a TS file with `export const PRESEEDED_PRODUCTS: Product[] = [ ... ];`
// Let's just use string replacement.

const lines = content.split('\n');
const newLines = [];

for (let line of lines) {
  if (line.includes('"companyName":') && line.includes('/')) {
    // we won't expand them here to avoid breaking the JSON array structure with commas
    // Actually we can do it later in the UI or fix the data manually.
  }
}
