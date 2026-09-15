const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/components/LocationMapping.tsx'],
  bundle: true,
  format: 'cjs',
  outfile: 'out-loc.cjs',
  external: ['react', 'lucide-react', 'idb-keyval'],
  alias: {
    '../lib/firebase': './mock-firebase.cjs'
  }
});
console.log("Built");
