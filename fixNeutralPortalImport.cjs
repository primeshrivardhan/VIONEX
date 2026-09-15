const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const NeutralPublicPortal = React.lazy(() => import("./components/NeutralPublicPortal"));\n',
  ''
);

code = code.replace(
  'import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";',
  'import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";\nimport NeutralPublicPortal from "./components/NeutralPublicPortal";'
);

fs.writeFileSync('src/App.tsx', code);
