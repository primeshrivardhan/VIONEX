const fs = require('fs');
let content = fs.readFileSync('src/components/LocationMapping.tsx', 'utf8');

const target = `
    const success = await revalidateTalukaOfficial(selectedState, selectedDistrict, selectedTaluka);
    if (success) {
      alert(\`Revalidated \${selectedTaluka} with official AI data. Cleaned up outdated mappings.\`);
    } else {
      alert("Error occurred during revalidation.");
    }
`;

const replacement = `
    const success = await revalidateTalukaOfficial(selectedState, selectedDistrict, selectedTaluka);
    if (success) {
      try { await clearIdb(); localStorage.clear(); } catch(e) {}
      alert(\`Revalidated \${selectedTaluka} with official data. Cleaned up outdated mappings.\`);
      fetchLocations({ state: selectedState, district: selectedDistrict, taluka: selectedTaluka });
    } else {
      alert("Error occurred during revalidation.");
    }
`;

content = content.replace(target.trim(), replacement.trim());
fs.writeFileSync('src/components/LocationMapping.tsx', content, 'utf8');
