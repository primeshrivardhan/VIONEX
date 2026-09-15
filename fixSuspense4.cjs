const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        <main
          className={\`flex-1 flex flex-col w-full overflow-y-auto \${
            view === "add-farmer" ||
            view === "add-product" ||
            view === "add-schedule"
              ? "p-0 gap-0"
              : "max-w-7xl mx-auto gap-4 p-4 md:p-6"
          }\`}
        >`;

const replacement = target + `
          <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>}>`;

code = code.replace(target, replacement);

const targetEnd = `        </main>
      </div>

      {/* Mobile Bottom Navigation Bar matching Image 1 */}`;

const replacementEnd = `          </Suspense>
` + targetEnd;

code = code.replace(targetEnd, replacementEnd);

fs.writeFileSync('src/App.tsx', code);
