const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '    const PublicFormGateway = React.lazy(() => import("./components/PublicFormGateway"));\n',
  ''
);

code = code.replace(
  'const NeutralPublicPortal = React.lazy(() => import("./components/NeutralPublicPortal"));',
  'const NeutralPublicPortal = React.lazy(() => import("./components/NeutralPublicPortal"));\nconst PublicFormGateway = React.lazy(() => import("./components/PublicFormGateway"));'
);

fs.writeFileSync('src/App.tsx', code);
