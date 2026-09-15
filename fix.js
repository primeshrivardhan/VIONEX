const fs = require('fs');
const content = fs.readFileSync('src/components/DealersView.tsx', 'utf-8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('{filteredDealers.length === 0 ? ('));
const endIndex = lines.findIndex(l => l.includes('<AnimatePresence>'));

console.log(startIndex, endIndex);
