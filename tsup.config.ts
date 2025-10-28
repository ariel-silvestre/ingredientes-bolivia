import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  external: ['fuse.js'],
  treeshake: true,
  outDir: 'dist',
  shims: true,
  platform: 'neutral',
  
  onSuccess: 'echo "✅ Build completado exitosamente"'
});