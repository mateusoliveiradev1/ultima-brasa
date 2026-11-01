// Gera todos os mapas temáticos em data/maps/*.json. Uso: node maps/gen-all.mjs [chave|bioma]
// (ruinas.json — "Cruzamento" — é o mapa original e não é gerado aqui.)
import fs from 'node:fs';
import { MAPS, REJ } from './lib.mjs';
import { lint } from '../src/shared/mapspec.js';
for (const f of ['ruinas', 'pantano', 'deserto', 'tundra', 'arenas']) { try { await import(`./gen-${f}.mjs`); } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND' || !String(e.message).includes(`gen-${f}`)) throw e; } }
const only = process.argv[2];
fs.mkdirSync('data/maps', { recursive: true });
for (const [key, mk] of Object.entries(MAPS)) {
  if (only && key !== only && !key.startsWith(only + '-')) continue;
  const spec = mk(), rep = lint(spec); fs.writeFileSync(`data/maps/${key}.json`, JSON.stringify(spec, null, 1));
  console.log(key.padEnd(22), String(spec.props.length).padStart(3) + ' props', String(spec.lights.length).padStart(2) + ' luzes', `err ${rep.errors.length}`, `warn ${rep.warns.length}`, REJ[key].length ? `recusados ${REJ[key].length}: ${REJ[key].slice(0, 6).join(' ')}` : '');
  for (const e of rep.errors.slice(0, 6)) console.log('   ERRO', e); for (const w of rep.warns.filter((x) => !x.startsWith('sobreposição')).slice(0, 4)) console.log('   aviso', w);
}
