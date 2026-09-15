const fs = require('fs');

let content = fs.readFileSync('src/components/AddScheduleForm.tsx', 'utf8');
content = content.replace(/const draft = JSON\.parse\(savedDraft\);/g, 'const draft = (savedDraft === "undefined" ? undefined : JSON.parse(savedDraft));');
fs.writeFileSync('src/components/AddScheduleForm.tsx', content);

content = fs.readFileSync('src/components/BulkImportSection.tsx', 'utf8');
content = content.replace(/const jsonParsed = JSON\.parse\(content\);/g, 'const jsonParsed = (content === "undefined" ? undefined : JSON.parse(content));');
fs.writeFileSync('src/components/BulkImportSection.tsx', content);
console.log("Fixed");
