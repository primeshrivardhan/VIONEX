const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    const funcStr = `\nfunction safeJsonParse(str: any, fallback: any = undefined) { try { if (str === undefined || str === "undefined" || str === null || str === "null") return fallback; return JSON.parse(str); } catch (e) { return fallback; } }\n`;
    
    if (content.startsWith(funcStr)) {
        content = content.replace(funcStr, '');
        // Find last import
        const lines = content.split('\n');
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIdx = i;
            }
        }
        lines.splice(lastImportIdx + 1, 0, funcStr);
        fs.writeFileSync(file, lines.join('\n'));
        console.log("Fixed imports in " + file);
    }
}

fixFile('src/App.tsx');
fixFile('src/components/AddProductForm.tsx');
fixFile('src/components/AddScheduleForm.tsx');
fixFile('src/components/BulkImportSection.tsx');
fixFile('src/components/DealersView.tsx');
fixFile('src/lib/data-sync.ts');

