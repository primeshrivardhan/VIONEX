const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const PublicFormGateway = React.lazy(() => import("./components/PublicFormGateway"));\n',
  ''
);

code = code.replace(
  'import NeutralPublicPortal from "./components/NeutralPublicPortal";',
  'import NeutralPublicPortal from "./components/NeutralPublicPortal";\nimport PublicFormGateway from "./components/PublicFormGateway";'
);

fs.writeFileSync('src/App.tsx', code);
