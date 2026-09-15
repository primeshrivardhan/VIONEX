const { VILLAGES_BY_TALUKA } = require('./dist/server.cjs'); // Can't easily require, I'll just parse the TS file

const fs = require('fs');
const content = fs.readFileSync('src/lib/maharashtra-locations.ts', 'utf8');

// A quick and dirty eval to get the object
const match = content.match(/export const VILLAGES_BY_TALUKA: Record<string, string\[\]> = (\{[\s\S]*?\});/);
if (match) {
  const objStr = match[1];
  const obj = eval('(' + objStr + ')');
  
  const villageMap = {};
  const duplicates = [];

  for (const taluka in obj) {
    for (const village of obj[taluka]) {
      const cleanVillage = village.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (villageMap[cleanVillage]) {
        duplicates.push(`${village} is in ${taluka} AND ${villageMap[cleanVillage]}`);
      }
      villageMap[cleanVillage] = taluka;
    }
  }

  if (duplicates.length > 0) {
    console.log("Found duplicates:");
    console.log(duplicates.join('\n'));
  } else {
    console.log("No duplicates found across talukas!");
  }
} else {
  console.log("Could not find VILLAGES_BY_TALUKA");
}
