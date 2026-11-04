// Monta a pasta publicável "site/": landing em /, jogo em /jogar, ferramentas internas em /forja-de-*.
// Uso: node site-src/build-site.mjs   (o jogo e as Forjas vêm de dist/, gerados por `node build.mjs`)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const font = (pkg, file, family, weight) => `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64')}) format('woff2')}`;
const FONTS = [font('rajdhani', 'rajdhani-latin-500-normal.woff2', 'Rajdhani', 500), font('rajdhani', 'rajdhani-latin-700-normal.woff2', 'Rajdhani', 700), font('bebas-neue', 'bebas-neue-latin-400-normal.woff2', 'Bebas Neue', 400)].join('\n');
const svg = fs.readFileSync('build.mjs', 'utf8').match(/const FAVICON_SVG = `(.*)`;/)?.[1] || '';
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(svg);

const r = await build({ entryPoints: ['site-src/landing.js'], bundle: true, minify: true, write: false, format: 'iife', target: 'es2022', legalComments: 'none', logLevel: 'warning' });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = FONTS + '\n' + fs.readFileSync('site-src/landing.css', 'utf8');
const html = fs.readFileSync('site-src/index.html', 'utf8').replace('{{FAVICON}}', () => FAVICON).replace('{{CSS}}', () => css).replace('{{JS}}', () => js);

fs.rmSync('site', { recursive: true, force: true });
const put = (to, data) => { fs.mkdirSync(path.dirname(to), { recursive: true }); typeof data === 'string' ? fs.writeFileSync(to, data) : fs.copyFileSync(data.from, to); };
put('site/index.html', html);
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(`${d}/${e.name}`) : put(`site/${d.slice(9)}/${e.name}`, { from: `${d}/${e.name}` }); };
walk('site-src/img');
for (const [from, to] of [['dist/ultima-brasa.html', 'site/jogar/index.html'], ['dist/forja-de-efeitos.html', 'site/forja-de-efeitos/index.html'], ['dist/forja-de-mapas.html', 'site/forja-de-mapas/index.html']]) if (fs.existsSync(from)) put(to, { from });
put('site/robots.txt', 'User-agent: *\nAllow: /\nDisallow: /forja-de-efeitos/\nDisallow: /forja-de-mapas/\n');
console.log('site/index.html', (html.length / 1024).toFixed(0) + ' KB;', fs.readdirSync('site').join(', '));
