const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '            <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>}>\n          {showInstallBanner && renderPWAInstallBanner()}',
  '          {showInstallBanner && renderPWAInstallBanner()}'
);

const suspiciousSuspenseIndex = code.lastIndexOf('</Suspense>\n        </main>');
if (suspiciousSuspenseIndex !== -1) {
  code = code.substring(0, suspiciousSuspenseIndex) + '</main>' + code.substring(suspiciousSuspenseIndex + 20);
}

fs.writeFileSync('src/App.tsx', code);
