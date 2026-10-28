// Utilitário de dev: empacota um módulo de teste num HTML solto. Uso: node tools/preview.mjs entrada.js saida.html
import { build } from 'esbuild'; import fs from 'node:fs';
const [,, entry, out] = process.argv;
const r = await build({ entryPoints: [entry], bundle: true, write: false, format: 'iife', target: 'es2022', logLevel: 'warning' });
fs.writeFileSync(out, `<!doctype html><meta charset=utf-8><body style="margin:0"><script>${r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);
