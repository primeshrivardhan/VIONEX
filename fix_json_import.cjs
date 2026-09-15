const fs = require('fs');

const funcStr = `\nfunction safeJsonParse(str: any, fallback: any = undefined) { try { if (str === undefined || str === "undefined" || str === null || str === "null") return fallback; return JSON.parse(str); } catch (e) { return fallback; } }\n`;

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove the bad funcStr everywhere
    content = content.replace(funcStr, '');
    
    // Remove if it got mangled inside an import (just replace any remaining exact match just in case)
    if (content.includes('function safeJsonParse(')) {
        content = content.replace(/function safeJsonParse[^{]+{[^}]+} catch \(e\) { return fallback; } }/g, '');
    }
    
    // Add import statement at top
    // For lib files: import { safeJsonParse } from "./safeJson";
    // For components/App: import { safeJsonParse } from "./lib/safeJson"; or "../lib/safeJson"
    let importPath = '';
    if (file === 'src/App.tsx') importPath = './lib/safeJson';
    else if (file.includes('src/components/')) importPath = '../lib/safeJson';
    else if (file.includes('src/lib/')) importPath = './safeJson';
    
    content = `import { safeJsonParse } from "${importPath}";\n` + content;
    
    fs.writeFileSync(file, content);
    console.log("Cleaned and added import to " + file);
}

fixFile('src/App.tsx');
fixFile('src/components/AddProductForm.tsx');
fixFile('src/components/AddScheduleForm.tsx');
fixFile('src/components/BulkImportSection.tsx');
fixFile('src/components/DealersView.tsx');
fixFile('src/lib/data-sync.ts');
