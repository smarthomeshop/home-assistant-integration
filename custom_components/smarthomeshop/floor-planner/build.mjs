// Builds the floor planner that Home Assistant serves from www/floor-planner.
//
//   node build.mjs           write the build to ../www/floor-planner
//   node build.mjs --check   fail when ../www/floor-planner is out of date
//   node build.mjs --out D   write the build somewhere else
//
// The output is bundled but not minified, so what Home Assistant serves stays
// readable next to the source it came from. The one exception is pdf.js, a
// large library from npm that is only loaded when somebody opens a PDF.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(root, 'src');
const target = path.join(root, '..', 'www', 'floor-planner');
const languages = ['en', 'nl', 'de', 'fr', 'es'];
// Modules other bundles import at run time instead of carrying their own copy.
const sharedModules = ['fusion', 'safety'];
// The editor loads this module with import() when somebody opens a PDF. It is
// built as its own file, pdf.js, so it adds nothing to opening the editor.
const pdfModule = 'floor-planner-pdf.mjs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const outIndex = args.indexOf('--out');
const out = check ? await fs.mkdtemp(path.join(os.tmpdir(), 'floor-planner-'))
    : outIndex >= 0 ? path.resolve(args[outIndex + 1]) : target;

const banner = '// Generated from floor-planner/src by floor-planner/build.mjs. Edit the source, then rebuild.';
const hash = text => createHash('sha256').update(text).digest('hex').slice(0, 12);

const options = {
    bundle: true,
    format: 'esm',
    target: 'esnext',
    charset: 'utf8',
    legalComments: 'inline',
    logLevel: 'warning',
    write: false,
    // Module comments in the output name files relative to this folder.
    absWorkingDir: root,
    banner: { js: banner, css: banner.replace('//', '/*') + ' */' },
};

async function bundle(entryPoints, plugins = [], extra = {}) {
    const result = await build({ ...options, ...extra, entryPoints, outdir: out, entryNames: '[name]', plugins });
    return Object.fromEntries(result.outputFiles.map(file => [path.basename(file.path), file.text]));
}

// fusion.js and safety.js go first: the others load them by a versioned URL.
const files = await bundle(Object.fromEntries(sharedModules.map(name => [name, path.join(source, 'ha', `${name}.js`)])));

// So does pdf.js. It is minified because it is a library from npm, not planner
// source. Its first lines say what it contains and its licence goes next to it.
const pdfjs = path.join(root, 'node_modules', 'pdfjs-dist');
const pdfjsVersion = JSON.parse(await fs.readFile(path.join(pdfjs, 'package.json'), 'utf8')).version;
Object.assign(files, await bundle({ pdf: path.join(source, 'js', pdfModule) }, [], { minify: true, banner: { js:
    `${banner}\n// Includes PDF.js ${pdfjsVersion} (pdfjs-dist) by the Mozilla Foundation, Apache License 2.0: see pdf.LICENSE.txt.` } }));
files['pdf.LICENSE.txt'] = await fs.readFile(path.join(pdfjs, 'LICENSE'), 'utf8');

const versions = Object.fromEntries([...sharedModules, 'pdf'].map(name => [name, hash(files[`${name}.js`])]));
const shared = {
    name: 'shared-modules',
    setup(context) {
        const filter = new RegExp(`^\\./(${sharedModules.join('|')})\\.js$`);
        context.onResolve({ filter }, ({ path: request }) => {
            const name = request.match(filter)[1];
            return { path: `./${name}.js?v=${versions[name]}`, external: true };
        });
    },
};
// import('./floor-planner-pdf.mjs') becomes an import of the built pdf.js. Only
// the editor ever runs it; the other bundles drop the code that would.
const lazyPdf = {
    name: 'lazy-pdf',
    setup(context) {
        const filter = new RegExp(`^\\./${pdfModule.replaceAll('.', '\\.')}$`);
        context.onResolve({ filter }, ({ kind }) =>
            kind === 'dynamic-import' ? { path: `./pdf.js?v=${versions.pdf}`, external: true } : null);
    },
};

// `import css from './file.css?inline'` gives the stylesheet as a string, for
// elements that adopt it into their own shadow root.
const inlineCss = {
    name: 'inline-css',
    setup(context) {
        context.onResolve({ filter: /\.css\?inline$/ }, ({ path: request, resolveDir }) =>
            ({ path: path.relative(root, path.resolve(resolveDir, request.replace(/\?inline$/, ''))), namespace: 'inline-css' }));
        context.onLoad({ filter: /.*/, namespace: 'inline-css' }, async ({ path: file }) =>
            ({ contents: await fs.readFile(path.join(root, file), 'utf8'), loader: 'text' }));
    },
};

Object.assign(files, await bundle({
    host: path.join(source, 'ha', 'host.js'),
    'card-scene': path.join(source, 'ha', 'card-scene.js'),
    editor: path.join(source, 'ha', 'editor-entry.js'),
}, [shared, lazyPdf, inlineCss]));
files['editor-ha.css'] = await fs.readFile(path.join(source, 'ha', 'editor-ha.css'), 'utf8');

// Each page asks for the editor files by content hash, so an update is never
// served from a stale browser cache.
const pageVersions = {
    'editor.js': hash(files['editor.js']),
    'editor.css': hash(files['editor.css']),
    'editor-ha.css': hash(files['editor-ha.css']),
};
for (const language of languages) {
    const page = await fs.readFile(path.join(source, 'ha', 'shells', `${language}.html`), 'utf8');
    files[`${language}.html`] = page.replace(/\.\/(editor\.js|editor\.css|editor-ha\.css)\?v=[\da-z]+/g,
        (match, name) => `./${name}?v=${pageVersions[name]}`);
}
files['package.json'] = `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`;
files['README.md'] = `# Floor planner build

Everything in this folder is generated by \`floor-planner/build.mjs\` from the
sources in \`floor-planner/src\`. Do not edit these files: change the source,
then run \`npm run build\` in \`floor-planner/\`. \`npm run check\` fails when
this folder no longer matches the source.
`;

async function staticFiles(directory, prefix = '') {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const found = await Promise.all(entries.map(entry => entry.isDirectory()
        ? staticFiles(path.join(directory, entry.name), path.join(prefix, entry.name))
        : [[path.join(prefix, entry.name), path.join(directory, entry.name)]]));
    return found.flat();
}
const assets = await staticFiles(path.join(source, 'ha', 'static'));

if (check) {
    const stale = [];
    for (const [name, text] of Object.entries(files)) {
        const current = await fs.readFile(path.join(target, name), 'utf8').catch(() => null);
        if (current !== text) stale.push(name);
    }
    for (const [name, file] of assets) {
        const [built, current] = await Promise.all([fs.readFile(file), fs.readFile(path.join(target, name)).catch(() => null)]);
        if (!current || !built.equals(current)) stale.push(name);
    }
    await fs.rm(out, { recursive: true, force: true });
    if (stale.length) {
        console.error(`www/floor-planner is out of date: ${stale.join(', ')}. Run npm run build.`);
        process.exit(1);
    }
    console.log('www/floor-planner matches the source.');
} else {
    await fs.rm(out, { recursive: true, force: true });
    await fs.mkdir(out, { recursive: true });
    for (const [name, text] of Object.entries(files)) await fs.writeFile(path.join(out, name), text);
    for (const [name, file] of assets) {
        await fs.mkdir(path.dirname(path.join(out, name)), { recursive: true });
        await fs.copyFile(file, path.join(out, name));
    }
    console.log(`Built ${Object.keys(files).length + assets.length} files into ${path.relative(process.cwd(), out) || '.'}`);
}
