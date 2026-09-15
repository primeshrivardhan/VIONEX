const fs = require('fs');
let content = fs.readFileSync('src/lib/maharashtra-locations.ts', 'utf8');

// We need to deduplicate arrays within VILLAGES_BY_TALUKA
const match = content.match(/export const VILLAGES_BY_TALUKA: Record<string, string\[\]> = (\{[\s\S]*?\});/);
if (match) {
  const objStr = match[1];
  const obj = eval('(' + objStr + ')');
  
  let newObjStr = '{\n';
  for (const taluka in obj) {
    const uniqueVillages = [];
    const seen = new Set();
    for (const v of obj[taluka]) {
      const norm = v.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueVillages.push(`"${v}"`);
      }
    }
    newObjStr += `  "${taluka}": [\n    ${uniqueVillages.join(', ')}\n  ],\n`;
  }
  newObjStr = newObjStr.replace(/,\n$/, '\n}');
  
  content = content.replace(match[1], newObjStr);
  
  // Replace getOfficialTalukaForVillage with isVillageOfficialForTaluka
  const oldFunc = /export const getOfficialTalukaForVillage = \([\s\S]*?};/m;
  const newFunc = `export const isVillageOfficialForTaluka = (villageName: string, talukaName: string): boolean => {
  if (!villageName || !talukaName) return false;
  const normSearch = normalizeNameForMatch(villageName);
  
  const talukaKey = Object.keys(VILLAGES_BY_TALUKA).find(
    k => k.toLowerCase().trim() === talukaName.toLowerCase().trim()
  );
  if (!talukaKey) return true; // If taluka not in master, we can't validate, assume true or false? Let's say false.
  
  return VILLAGES_BY_TALUKA[talukaKey].some(v => normalizeNameForMatch(v) === normSearch);
};`;
  content = content.replace(oldFunc, newFunc);
  
  fs.writeFileSync('src/lib/maharashtra-locations.ts', content, 'utf8');
  console.log("Fixed maharashtra-locations.ts");
}
