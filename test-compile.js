const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/components/LocationMapping.tsx'],
  bundle: true,
  format: 'cjs',
  outfile: 'out-loc.js',
  external: ['react', 'lucide-react', 'firebase/*', '../hooks/*', '../lib/*']
});
console.log("Built");
