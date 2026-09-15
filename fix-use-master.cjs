const fs = require('fs');
let content = fs.readFileSync('src/hooks/useMasterLocations.ts', 'utf8');

content = content.replace(/getOfficialTalukaForVillage/g, 'isVillageOfficialForTaluka');

// Line 110ish
// Old: 
// const officialTaluka = isVillageOfficialForTaluka(loc.village);
// if (officialTaluka && officialTaluka.toLowerCase().trim() !== filter.taluka!.toLowerCase().trim()) {
// New:
// const isOfficial = isVillageOfficialForTaluka(loc.village, filter.taluka!);
// if (!isOfficial) {

content = content.replace(/const officialTaluka = isVillageOfficialForTaluka\(loc\.village\);\s*if \(officialTaluka && officialTaluka\.toLowerCase\(\)\.trim\(\) !== filter\.taluka!\.toLowerCase\(\)\.trim\(\)\) \{/g, 
  `const isOfficial = isVillageOfficialForTaluka(loc.village, filter.taluka!);
                if (!isOfficial) {`);

// Line 153ish
content = content.replace(/const officialTaluka = isVillageOfficialForTaluka\(vStr\);\s*if \(officialTaluka && officialTaluka\.toLowerCase\(\)\.trim\(\) !== filter\.taluka\.toLowerCase\(\)\.trim\(\)\) continue;/g, 
  `const isOfficial = isVillageOfficialForTaluka(vStr, filter.taluka);
                if (!isOfficial) continue;`);

// Line 183ish
content = content.replace(/const officialTaluka = isVillageOfficialForTaluka\(loc\.village\);\s*if \(officialTaluka && officialTaluka\.toLowerCase\(\)\.trim\(\) !== loc\.taluka\.toLowerCase\(\)\.trim\(\)\) \{/g, 
  `const isOfficial = isVillageOfficialForTaluka(loc.village, loc.taluka);
        if (!isOfficial) {`);
        
// Line 276ish
content = content.replace(/const officialTaluka = isVillageOfficialForTaluka\(vName\);\s*if \(officialTaluka && officialTaluka\.toLowerCase\(\)\.trim\(\) !== taluka\.toLowerCase\(\)\.trim\(\)\) \{/g, 
  `const isOfficial = isVillageOfficialForTaluka(vName, taluka);
          if (!isOfficial) {`);

// Fix the console logs
content = content.replace(/because it officially belongs to "\$\{officialTaluka\}" and not "\$\{filter\.taluka\}"/g, 
  'because it is not in the official list for "${filter.taluka}"');
content = content.replace(/because it belongs to "\$\{officialTaluka\}"/g, 
  'because it is not in the official list');

fs.writeFileSync('src/hooks/useMasterLocations.ts', content, 'utf8');
console.log("Fixed useMasterLocations.ts");
