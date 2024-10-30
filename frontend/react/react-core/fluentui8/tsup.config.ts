import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  dts: true,
  clean: true,
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    options.plugins = [
      {
        name: 'core-alias',
        setup(build) {
          build.onResolve({ filter: /^@ianus-core\// }, args => ({
            path: args.path.replace(/^@ianus-core\//, '../../../ianus-core/')
          }));
        },
      },
    ];
  },
});