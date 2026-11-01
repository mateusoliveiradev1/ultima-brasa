// Uso: node tools/forja-mapas/export-json.mjs maps/ruinas-01.js data/maps/ruinas.json  (converte um mapa construído por código em JSON publicável)
import path from 'node:path'; import fs from 'node:fs';
const [src, out] = [path.resolve(process.argv[2]), path.resolve(process.argv[3])];
const spec = (await import(src)).default; const { backdrop, platforms, ...game } = spec;
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(game, null, 1)); console.log('ok', out, spec.props.length, 'props');
