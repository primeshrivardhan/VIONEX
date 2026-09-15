const fs = require('fs');
let content = fs.readFileSync('src/components/LocationMapping.tsx', 'utf8');

// Add import if needed, but wait idb-keyval is used? 
if (!content.includes("clear as clearIdb")) {
  content = content.replace('import { getTalukasForDistrict, getVillagesForTaluka, getOfficialTalukaForVillage }', "import { getTalukasForDistrict, getVillagesForTaluka, getOfficialTalukaForVillage } from '../lib/maharashtra-locations';\nimport { clear as clearIdb } from 'idb-keyval';\nimport {");
}

const target = `
      alert(\`Cleanup completed! Removed \${removed} invalid/duplicate records.\`);
      fetchLocations({ state: selectedState, district: selectedDistrict, taluka: selectedTaluka });
`;

const replacement = `
      alert(\`Cleanup completed! Removed \${removed} invalid/duplicate records.\`);
      try { await clearIdb(); localStorage.clear(); } catch(e) {}
      fetchLocations({ state: selectedState, district: selectedDistrict, taluka: selectedTaluka });
`;

content = content.replace(target.trim(), replacement.trim());
fs.writeFileSync('src/components/LocationMapping.tsx', content, 'utf8');
