// Empacota jogo + Forja em HTMLs únicos (JS, CSS e fontes embutidos). Uso: node build.mjs
import { build } from 'esbuild';
import fs from 'node:fs';

const font = (pkg, file, family, weight) => {
  const b64 = fs.readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64');
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
};
const FONTS = [
  font('rajdhani', 'rajdhani-latin-500-normal.woff2', 'Rajdhani', 500),
  font('rajdhani', 'rajdhani-latin-600-normal.woff2', 'Rajdhani', 600),
  font('rajdhani', 'rajdhani-latin-700-normal.woff2', 'Rajdhani', 700),
  font('bebas-neue', 'bebas-neue-latin-400-normal.woff2', 'Bebas Neue', 400),
].join('\n');

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const targets = [
  { entry: 'src/main-forja.js', out: 'dist/forja-de-efeitos.html', title: 'Forja de Efeitos — Última Brasa', css: ['src/styles-base.css', 'src/styles-forja.css'] },
  { entry: 'src/main-game.js', out: 'dist/ultima-brasa.html', title: 'Última Brasa', css: ['src/styles-base.css', 'src/styles-forja.css', 'src/styles-game.css'] },
];
const only = process.argv[2];
for (const t of targets) {
  if (only && !t.out.includes(only)) continue;
  if (!fs.existsSync(t.entry)) continue;
  const r = await build({ entryPoints: [t.entry], bundle: true, minify: !process.env.DEV, write: false, format: 'iife', target: 'es2022', legalComments: 'none', logLevel: 'warning' });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = FONTS + '\n' + t.css.map(read).join('\n');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>${t.title}</title><style>${css}</style></head><body><div id="app"></div><script>${js}</script></body></html>`;
  fs.writeFileSync(t.out, html);
  console.log(t.out, (html.length / 1024).toFixed(0) + ' KB');
}
