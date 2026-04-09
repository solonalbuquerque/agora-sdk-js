import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  clean: true,
  sourcemap: true,
  format: ['esm', 'cjs'],
  target: 'node18',
  treeshake: true,
});