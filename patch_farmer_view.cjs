const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
// Fix Nav Items
appTsx = appTsx.replace(/return item\.id === "dashboard" \|\| item\.id === "schedule" \|\| item\.id === "settings" \|\| item\.id === "advice";/g, 'return item.id === "dashboard" || item.id === "schedule" || item.id === "settings" || item.id === "advice" || item.id === "products" || item.id === "dealers";');

// Fix Sync Dealers
appTsx = appTsx.replace(/if \(currentUserId && currentUser\?\.type !== "farmer" && currentUser\?\.data\?\.role !== "user"\) {/g, 'if (currentUserId && currentUser?.data?.role !== "user") {');

fs.writeFileSync('src/App.tsx', appTsx);

let dashTsx = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
dashTsx = dashTsx.replace(/return item\.id === "schedule" \|\| item\.id === "settings" \|\| item\.id === "advice";/g, 'return item.id === "schedule" || item.id === "settings" || item.id === "advice" || item.id === "products" || item.id === "dealers";');
fs.writeFileSync('src/components/Dashboard.tsx', dashTsx);

console.log("Patched farmer views");
