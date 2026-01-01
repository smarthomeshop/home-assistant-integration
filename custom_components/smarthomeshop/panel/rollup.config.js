import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/smarthomeshop-panel.js',
    format: 'es',
    sourcemap: !production,
  },
  plugins: [
    resolve(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),
    production && terser({
      format: {
        comments: false,
      },
    }),
  ],
};
