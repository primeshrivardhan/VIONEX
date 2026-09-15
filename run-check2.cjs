const fs = require('fs');
const content = fs.readFileSync('src/lib/maharashtra-locations.ts', 'utf8');

const match = content.match(/export const VILLAGES_BY_TALUKA: Record<string, string\[\]> = (\{[\s\S]*?\});/);
if (match) {
  const objStr = match[1];
  const obj = eval('(' + objStr + ')');
  
  const villageMap = {};
  const duplicates = [];

  for (const taluka in obj) {
    for (const village of obj[taluka]) {
      const cleanVillage = village.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (villageMap[`${taluka}_${cleanVillage}`]) {
        duplicates.push(`${village} is duplicated inside ${taluka}`);
      }
      villageMap[`${taluka}_${cleanVillage}`] = true;
    }
  }

  if (duplicates.length > 0) {
    console.log("Found INTERNAL duplicates:");
    console.log(duplicates.join('\n'));
  } else {
    console.log("No internal duplicates found within talukas!");
  }
}
