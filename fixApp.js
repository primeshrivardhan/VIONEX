const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = '  // Check if accessing the neutral public portal (Employee Link)\n  const isPortalView = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "portal";\n  if (isPortalView) {\n    return <NeutralPublicPortal />;\n  }';

const replacement = `  // Check if accessing the public forms
  const isPublicFormView = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "public-form";
  if (isPublicFormView) {
    const PublicFormGateway = React.lazy(() => import("./components/PublicFormGateway"));
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>}>
        <PublicFormGateway />
      </Suspense>
    );
  }

` + target;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
