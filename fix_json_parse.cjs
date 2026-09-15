const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // find JSON.parse(saved) or JSON.parse(localData) or JSON.parse(cached)
  
  // Actually, let's just make sure all JSON.parse inside App.tsx are safe.
  content = content.replace(/JSON\.parse\((saved|localData|cached)\)/g, (match, p1) => {
    return `(${p1} === "undefined" ? undefined : JSON.parse(${p1}))`;
  });
  
  // Also we see in App.tsx around line 1226:
  // if (saved) {
  //   const user = JSON.parse(saved);
  // we can just wrap the JSON.parse in try-catch or do the "undefined" check.
  
  fs.writeFileSync(filePath, content);
}

fixFile('src/App.tsx');
fixFile('src/lib/data-sync.ts');
fixFile('src/components/AddScheduleForm.tsx');
fixFile('src/components/DealersView.tsx');
fixFile('src/components/AddProductForm.tsx');
console.log("Fixed");
