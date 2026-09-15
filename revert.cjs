const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>}>\n        <main',
  '<main'
);

code = code.replace(
  '</main>\n        </Suspense>',
  '</main>'
);

fs.writeFileSync('src/App.tsx', code);
