const fs = require('fs');
const code = fs.readFileSync('src/components/LocationMapping.tsx', 'utf-8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('map')) {
     console.log(i+1, l);
  }
});
