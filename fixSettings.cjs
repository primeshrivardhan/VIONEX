const fs = require('fs');
let code = fs.readFileSync('src/components/PublicLinksSettings.tsx', 'utf8');

code = code.replace(
  '          dealer: { enabled: false, token: crypto.randomUUID() },\n          consultant: { enabled: false, token: crypto.randomUUID() }',
  '          dealer: { enabled: true, token: crypto.randomUUID() },\n          consultant: { enabled: true, token: crypto.randomUUID() }'
);

fs.writeFileSync('src/components/PublicLinksSettings.tsx', code);
