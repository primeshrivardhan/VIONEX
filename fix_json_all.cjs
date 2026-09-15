const fs = require('fs');
const glob = require('glob'); // use fs if glob is not present, we can just walk the src dir

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Replace JSON.parse(X) with safeJsonParse(X)
    if (content.includes('JSON.parse(') && !content.includes('safeJsonParse')) {
        // we'll just inject safeJsonParse at the top
        const safeParseFunc = `\nfunction safeJsonParse(str: any, fallback: any = undefined) { try { if (str === undefined || str === "undefined" || str === null || str === "null") return fallback; return JSON.parse(str); } catch (e) { return fallback; } }\n`;
        
        let hasChanges = false;
        // Simple regex replace for JSON.parse
        content = content.replace(/JSON\.parse\(([^)]+)\)/g, (match, p1) => {
            if (p1 === 'JSON.stringify(p)' || p1 === 'JSON.stringify(options || {})') return match; // skip obvious safe ones
            hasChanges = true;
            return `safeJsonParse(${p1})`;
        });
        
        if (hasChanges) {
            content = safeParseFunc + content;
            // fix any ts errors if it's a tsx file, just use @ts-nocheck or ignore
            fs.writeFileSync(file, content);
            console.log("Fixed " + file);
        }
    }
});
