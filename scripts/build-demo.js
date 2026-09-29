// Builds dist/demo.html: the whole app (API + client + demo data) in one self-contained page.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const js = await build({ entryPoints: ['demo/entry.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2022', legalComments: 'none' });
const css = readFileSync('client/styles.css', 'utf8').replace(/url\("fonts\/([^"]+)"\)/g, (_, f) => `url("data:font/woff2;base64,${readFileSync(`client/fonts/${f}`).toString('base64')}")`);
// Brand files are inlined so the demo is one self-contained page.
const assets = Object.fromEntries(readdirSync('client/brand').filter((f) => f.endsWith('.png')).map((f) => [f, `data:image/png;base64,${readFileSync(`client/brand/${f}`).toString('base64')}`]));
const html = `<title>Cyber Academy</title>
<style>${css}</style>
<div id="app"><p style="padding:24px;font-family:system-ui">Loading the demo…</p></div>
<script>globalThis.__LMS_ASSETS__=${JSON.stringify(assets)};</script>
<script>${js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>
`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/demo.html', html);
console.log(`dist/demo.html ${(html.length / 1024).toFixed(0)} KB`);
