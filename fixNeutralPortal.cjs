const fs = require('fs');
let code = fs.readFileSync('src/components/NeutralPublicPortal.tsx', 'utf8');

code = code.replace(
  'फील्ड एंट्री पोर्टल (Field Entry Portal)',
  'VIONEX Registration'
);

code = code.replace(
  'नोंदणी करण्यासाठी खालील योग्य पर्याय निवडा आणि अचूक माहिती भरा.',
  'VIONEX मध्ये नोंदणी करण्यासाठी खालील अचूक माहिती भरा.'
);

fs.writeFileSync('src/components/NeutralPublicPortal.tsx', code);
