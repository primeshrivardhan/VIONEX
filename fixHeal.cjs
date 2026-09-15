const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `function healProductsAndSchedules(rawProducts: any[], rawSchedules: any[]) {`;
const replacement1 = `function healProductsAndSchedules(rawProductsList: any[][], rawSchedules: any[]) {\n  const rawProducts = rawProductsList.flat();`;
code = code.replace(target1, replacement1);

const target2 = `const result = healProductsAndSchedules([...baseCatalog, ...products], schedules);`;
const replacement2 = `const result = healProductsAndSchedules([baseCatalog, products], schedules);`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
