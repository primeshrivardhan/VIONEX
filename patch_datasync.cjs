const fs = require('fs');
let content = fs.readFileSync('src/lib/data-sync.ts', 'utf-8');

// Remove localStorage reading
content = content.replace(/try\s*\{\s*const cached = localStorage\.getItem\(cacheKey\);\s*if\s*\(cached\)\s*\{\s*const parsed = \(cached === "undefined" \? undefined : safeJsonParse\(cached\)\);\s*if\s*\(Array\.isArray\(parsed\)\)\s*\{\s*callback\(parsed\);\s*\}\s*\}\s*\}\s*catch\(e\)\s*\{\}/g, '');

// Remove localStorage writing
content = content.replace(/try\s*\{\s*localStorage\.setItem\(cacheKey, JSON\.stringify\(items\)\);\s*\}\s*catch\(e\)\s*\{\}/g, '');

fs.writeFileSync('src/lib/data-sync.ts', content);
console.log("Patched data-sync.ts successfully");
