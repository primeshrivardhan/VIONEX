const fs = require('fs');
let content = fs.readFileSync('src/components/LocationMapping.tsx', 'utf8');

const target = `
      if (clean) {
        // Strict boundary validation: Ensure village doesn't officially belong to a different taluka in our database
        const officialTaluka = isVillageOfficialForTaluka(clean);
        if (officialTaluka && officialTaluka.toLowerCase().trim() !== selectedTaluka.toLowerCase().trim()) {
          // Skip adding since it belongs to a different taluka officially
          return;
        }
`;

const replacement = `
      if (clean) {
        // Strict boundary validation: Ensure village doesn't officially belong to a different taluka in our database
        const isOfficial = isVillageOfficialForTaluka(clean, selectedTaluka);
        if (!isOfficial) {
          // Skip adding since it is not official for this taluka
          return;
        }
`;

content = content.replace(target.trim(), replacement.trim());
fs.writeFileSync('src/components/LocationMapping.tsx', content, 'utf8');
