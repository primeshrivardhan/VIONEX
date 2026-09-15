const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace('const { getDocsFromCache } = require("firebase/firestore");', '');
fs.writeFileSync('src/App.tsx', appTsx);
console.log("Fixed require");
