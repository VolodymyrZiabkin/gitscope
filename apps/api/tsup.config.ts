import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  clean: true,
  sourcemap: true,
  // The shared contract is TypeScript source — bundle it; npm dependencies stay external.
  noExternal: [/^@gitscope\//],
});
