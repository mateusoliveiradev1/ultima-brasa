// Uso: node tools/forja-mapas/run3d.mjs maps/ruinas-01.js [saida.png]  (render WebGL final; ~3 min em GPU de software)
import { build } from 'esbuild'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const mapFile = path.resolve(process.argv[2] || 'maps/ruinas-01.js'), out = path.resolve(process.argv[3] || '/tmp/mapa3d.png');
const sc = process.env.SCALE || '', tg = process.env.TARGET || '';
const entry = `import spec from ${JSON.stringify(mapFile)}; import { buildMap3D } from ${JSON.stringify(path.resolve('tools/forja-mapas/render3d.js'))};
${sc ? `spec.camera.scale = ${+sc};` : ''} ${tg ? `spec.camera.target = ${JSON.stringify(tg.split(',').map(Number))};` : ''}
const t0 = performance.now(); const m = buildMap3D(spec, { paint: !new URLSearchParams(location.search).has('nopaint') }); m.render(); window.__info = { ms: Math.round(performance.now() - t0), props: m.props, lights: m.lights.length }; window.__ready = true;`;
const r = await build({ stdin: { contents: entry, resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', target: 'es2022', logLevel: 'error' });
fs.writeFileSync('/tmp/forja-mapa3d.html', '<!doctype html><meta charset=utf-8><body><script>' + r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script>');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('pageerror', (e) => console.log('[erro]', e.message.slice(0, 300)));
await p.goto('file:///tmp/forja-mapa3d.html', { timeout: 170000, waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 420000, polling: 1000 }); await p.waitForTimeout(500);
console.log('INFO', JSON.stringify(await p.evaluate(() => window.__info))); await p.screenshot({ path: out }); await b.close();
