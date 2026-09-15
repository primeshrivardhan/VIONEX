const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace('import { collection, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";', 'import { collection, query, where, orderBy, limit, onSnapshot, serverTimestamp, getDocsFromCache } from "firebase/firestore";');
fs.writeFileSync('src/App.tsx', appTsx);
console.log("Fixed import 2");
