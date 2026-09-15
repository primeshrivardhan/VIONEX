const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '          {showInstallBanner && renderPWAInstallBanner()}',
  '          <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>}>\n          {showInstallBanner && renderPWAInstallBanner()}'
);

const lastMainCloseIndex = code.lastIndexOf('</main>');
if (lastMainCloseIndex !== -1) {
  code = code.substring(0, lastMainCloseIndex) + '          </Suspense>\n        </main>' + code.substring(lastMainCloseIndex + 7);
}

fs.writeFileSync('src/App.tsx', code);
