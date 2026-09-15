const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    // Check if accessing the public forms
  const isPublicFormView = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "public-form";
  if (isPublicFormView) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>}>
        <PublicFormGateway />
      </Suspense>
    );
  }`;

code = code.replace(target, '');

fs.writeFileSync('src/App.tsx', code);
