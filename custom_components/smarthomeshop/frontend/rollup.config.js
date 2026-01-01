import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

// Build stamp plugin
const buildStamp = () => ({
  name: 'build-stamp',
  renderChunk(code) {
    const stamp = `/* SmartHomeShop.io Cards - Build: ${new Date().toISOString()} */\n`;
    return { code: stamp + code, map: null };
  }
});

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/smarthomeshop-cards.js',
    format: 'es',
    sourcemap: !production,
    inlineDynamicImports: true
  },
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: !production
    }),
    buildStamp(),
    production && terser({
      format: {
        comments: false
      }
    })
  ].filter(Boolean)
};







