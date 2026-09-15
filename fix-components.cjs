const fs = require('fs');

// Fix LocationMapping.tsx
let lm = fs.readFileSync('src/components/LocationMapping.tsx', 'utf8');
lm = lm.replace(/getOfficialTalukaForVillage/g, 'isVillageOfficialForTaluka');

// Replace auto-resolving logic
lm = lm.replace(/const officialTaluka = isVillageOfficialForTaluka\(clean\);\s*const finalTaluka = officialTaluka \|\| searchTaluka;/g, 
  'const finalTaluka = searchTaluka; // We do not auto-resolve globally anymore to avoid cross-taluka false positives');

lm = lm.replace(/const officialTaluka = isVillageOfficialForTaluka\(d\.village\);\s*const targetTaluka = officialTaluka \|\| d\.taluka;/g, 
  `const isOfficial = isVillageOfficialForTaluka(d.village, d.taluka);
        const targetTaluka = d.taluka; // Keep original taluka, do not auto-move dealers`);

lm = lm.replace(/const officialTaluka = isVillageOfficialForTaluka\(loc\.village\);\s*if \(officialTaluka && officialTaluka\.toLowerCase\(\)\.trim\(\) !== loc\.taluka\.toLowerCase\(\)\.trim\(\)\) \{/g, 
  `const isOfficial = isVillageOfficialForTaluka(loc.village, loc.taluka);
        if (!isOfficial) {`);

fs.writeFileSync('src/components/LocationMapping.tsx', lm, 'utf8');


// Fix DealersView.tsx
let dv = fs.readFileSync('src/components/DealersView.tsx', 'utf8');
dv = dv.replace(/getOfficialTalukaForVillage/g, 'isVillageOfficialForTaluka');

dv = dv.replace(/const officialTaluka = isVillageOfficialForTaluka\(formData\.village\);\s*const finalTaluka = officialTaluka \|\| formData\.taluka;/g, 
  'const finalTaluka = formData.taluka;');

fs.writeFileSync('src/components/DealersView.tsx', dv, 'utf8');

console.log("Fixed components");
