const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
code = code.replace(
  /const isFarmer = currentUser\?\.type === "farmer";/,
  `const isFarmer = currentUser?.type === "farmer";
  const isAdmin = currentUser?.type === "admin" || (currentUser?.type === "user" && currentUser?.data?.role === "admin");`
);
fs.writeFileSync('src/components/SettingsView.tsx', code);
