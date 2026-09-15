import fs from 'fs';
const content = fs.readFileSync('src/components/DealersView.tsx', 'utf-8');
const lines = content.split('\n');

const start = lines.findIndex(l => l.includes('{filteredDealers.length === 0 ? ('));
const formStart = lines.findIndex(l => l.includes('<form onSubmit={handleSubmit} className="p-4 space-y-3">'));

console.log(start, formStart);
