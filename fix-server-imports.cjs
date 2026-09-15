const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('import { VILLAGES_BY_TALUKA }')) {
  content = content.replace('import path from "path";', 'import path from "path";\nimport { VILLAGES_BY_TALUKA } from "./src/lib/maharashtra-locations.js";');
}

// Then in server.ts replace the STATIC_VILLAGES with VILLAGES_BY_TALUKA
const target = `
    const matchedKey = Object.keys(STATIC_VILLAGES).find(
      k => k.toLowerCase().trim() === cleanTaluka.toLowerCase()
    );

    if (matchedKey && STATIC_VILLAGES[matchedKey]) {
      console.log(\`[Villages API] Serving 100% official static LGD revenue list for \${taluka}\`);
      return res.json({ villages: STATIC_VILLAGES[matchedKey] });
    }
`;

const replacement = `
    const matchedKey = Object.keys(VILLAGES_BY_TALUKA).find(
      k => k.toLowerCase().trim() === cleanTaluka.toLowerCase()
    );

    if (matchedKey && VILLAGES_BY_TALUKA[matchedKey] && VILLAGES_BY_TALUKA[matchedKey].length > 0) {
      console.log(\`[Villages API] Serving 100% official static LGD revenue list for \${taluka}\`);
      return res.json({ villages: VILLAGES_BY_TALUKA[matchedKey] });
    }
`;

content = content.replace(target.trim(), replacement.trim());
fs.writeFileSync('server.ts', content, 'utf8');
