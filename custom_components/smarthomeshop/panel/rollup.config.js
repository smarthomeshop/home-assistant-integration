import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const production = !process.env.ROLLUP_WATCH;

// Read version from manifest.json
const manifest = JSON.parse(readFileSync('../manifest.json', 'utf8'));
const version = manifest.version;

// Build stamp plugin (runs after terser to preserve the comment)
const buildStamp = () => ({
  name: 'build-stamp',
  renderChunk(code) {
    // Replace __VERSION__ placeholder with actual version
    code = code.replace(/__VERSION__/g, version);
    const stamp = `/* SmartHomeShop.io Panel v${version} - Build: ${new Date().toISOString()} */\n`;
    return { code: stamp + code, map: null };
  }
});

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
    buildStamp()  // After terser so comment is preserved
  ],
};
