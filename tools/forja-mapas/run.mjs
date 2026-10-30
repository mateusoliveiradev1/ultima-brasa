// Uso: node tools/forja-mapas/run.mjs maps/ruinas-01.js [saida.png]
// Empacota o mapa + a prévia 2D, renderiza em navegador headless, imprime o relatório do avaliador e salva o PNG.
import { build } from 'esbuild'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const mapFile = path.resolve(process.argv[2] || 'maps/ruinas-01.js'), out = path.resolve(process.argv[3] || '/tmp/mapa.png');
const entry = `import spec from ${JSON.stringify(mapFile)}; import { lint } from ${JSON.stringify(path.resolve('src/shared/mapspec.js'))}; import { renderPreview } from ${JSON.stringify(path.resolve('tools/forja-mapas/preview2d.js'))};
if ('__SCALE__') spec.camera.scale = +'__SCALE__'; if ('__TARGET__') spec.camera.target = '__TARGET__'.split(',').map(Number); const rep = lint(spec); window.__lint = rep; const c = renderPreview(spec); c.style.cssText='display:block'; document.body.style.margin='0'; document.body.append(c); window.__ready = true;`;
const entry2 = entry.replaceAll("'__SCALE__'", JSON.stringify(process.env.SCALE || '')).replaceAll("'__TARGET__'", JSON.stringify(process.env.TARGET || ''));
const r = await build({ stdin: { contents: entry2, resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', target: 'es2022', logLevel: 'error' });
fs.writeFileSync('/tmp/forja-mapa.html', '<!doctype html><meta charset=utf-8><body><script>' + r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script>');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', (e) => console.log('[erro]', e.message.slice(0, 300)));
await p.goto('file:///tmp/forja-mapa.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const rep = await p.evaluate(() => window.__lint); await p.screenshot({ path: out }); await b.close();
console.log('ERROS (' + rep.errors.length + '):', rep.errors.join(' | ') || '—'); console.log('AVISOS (' + rep.warns.length + '):\n  ' + (rep.warns.join('\n  ') || '—')); console.log('STATS', JSON.stringify(rep.stats));
