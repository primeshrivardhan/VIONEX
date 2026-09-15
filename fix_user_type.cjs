const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/if \(user\.type === "farmer"\) return "schedule";/g, 'if (user?.type === "farmer") return "schedule";');

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed");
