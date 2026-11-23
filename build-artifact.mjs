// LapFit · build the claude.ai Artifact page from index.html:   node build-artifact.mjs
// The Artifact tool wraps the file in its own <!doctype><html><head>…<body>, so this writes the page content only:
// <title> first, then head links/styles/scripts, then the body. The <html> attributes the design system reads
// (lang, data-type, data-radius, data-ground, data-buttons, data-motion) are set by a tiny script before any CSS.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('index.html', 'utf8');
const htmlTag = src.match(/<html([^>]*)>/i)[1];
const attrs = [...htmlTag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([, k, v]) => [k, v ?? '']);
const head = src.match(/<head>([\s\S]*?)<\/head>/i)[1]
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '');
const title = head.match(/<title>[\s\S]*?<\/title>/i)[0];
const headRest = head.replace(title, '');
const body = src.match(/<body>([\s\S]*?)<\/body>/i)[1];

const setAttrs = `<script>(function(r){${attrs.map(([k, v]) => `r.setAttribute(${JSON.stringify(k)},${JSON.stringify(v)});`).join('')}})(document.documentElement)</script>`;
const out = `<title>LapFit</title>\n${setAttrs}\n${headRest.trim()}\n${body.trim()}\n`;

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', out);
console.log(`dist/index.html ${(out.length / 1024).toFixed(1)} KB; html attributes: ${attrs.map(([k]) => k).join(', ')}`);
