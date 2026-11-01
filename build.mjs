// Empacota jogo + Forja em HTMLs únicos (JS, CSS e fontes embutidos). Uso: node build.mjs
import { build } from 'esbuild';
import fs from 'node:fs';

const font = (pkg, file, family, weight) => {
  const b64 = fs.readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64');
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
};
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="b" cx="50%" cy="60%" r="70%"><stop offset="0" stop-color="#3a1c10"/><stop offset="1" stop-color="#120a07"/></radialGradient><linearGradient id="f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset=".6" stop-color="#ff9a2e"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#b)"/><path d="M33 8c2 9 12 14 12 28 0 9-6 17-14 17s-14-7-14-15c0-6 3-9 6-13 0 5 2 7 4 8-1-9 2-17 6-25z" fill="url(#f)"/><path d="M32 30c1 5 6 8 6 14 0 5-3 8-7 8s-7-3-7-7c0-4 2-6 4-8 0 3 1 4 2 4 0-4 0-7 2-11z" fill="#fff0b8" opacity=".92"/></svg>`;
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG);
const FONTS = [
  font('rajdhani', 'rajdhani-latin-500-normal.woff2', 'Rajdhani', 500),
  font('rajdhani', 'rajdhani-latin-600-normal.woff2', 'Rajdhani', 600),
  font('rajdhani', 'rajdhani-latin-700-normal.woff2', 'Rajdhani', 700),
  font('bebas-neue', 'bebas-neue-latin-400-normal.woff2', 'Bebas Neue', 400),
].join('\n');

// índice dos mapas publicados (data/maps/<bioma>.json) → src/game/maps.index.js
{ const names = fs.existsSync('data/maps') ? fs.readdirSync('data/maps').filter((f) => f.endsWith('.json')).sort() : [];
  fs.writeFileSync('src/game/maps.index.js', '// GERADO por build.mjs — não editar. Lista os mapas de data/maps/*.json.\n' + names.map((f, i) => `import M${i} from '../../data/maps/${f}';`).join('\n') + `\nexport const FILES = { ${names.map((f, i) => `${JSON.stringify(f.replace('.json', ''))}: M${i}`).join(', ')} };\n`); }
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const targets = [
  { entry: 'src/main-forja.js', out: 'dist/forja-de-efeitos.html', title: 'Forja de Efeitos — Última Brasa', css: ['src/styles-base.css', 'src/styles-forja.css'] },
  { entry: 'src/main-mapas.js', out: 'dist/forja-de-mapas.html', title: 'Forja de Mapas — Última Brasa', css: ['src/styles-base.css', 'src/styles-forja.css', 'src/styles-mapas.css'] },
  { entry: 'src/main-game.js', out: 'dist/ultima-brasa.html', title: 'Última Brasa', css: ['src/styles-base.css', 'src/styles-forja.css', 'src/styles-game.css', 'src/styles-mapas.css'] },
];
const only = process.argv[2];
for (const t of targets) {
  if (only && !t.out.includes(only)) continue;
  if (!fs.existsSync(t.entry)) continue;
  const r = await build({ entryPoints: [t.entry], bundle: true, minify: !process.env.DEV, write: false, format: 'iife', target: 'es2022', legalComments: 'none', logLevel: 'warning' });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = FONTS + '\n' + t.css.map(read).join('\n');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>${t.title}</title><link rel="icon" type="image/svg+xml" href="${FAVICON}"><meta name="theme-color" content="#120c0a"><style>${css}</style></head><body><div id="app"></div><script>${js}</script></body></html>`;
  fs.writeFileSync(t.out, html);
  console.log(t.out, (html.length / 1024).toFixed(0) + ' KB');
}
