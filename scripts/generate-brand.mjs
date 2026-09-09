// Run after editing ribbon-shapes.json. Every brand application shares the same curves.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const { viewBox, shapes } = JSON.parse(await readFile(path.join(root, 'scripts/ribbon-shapes.json'), 'utf8'));
const paths = shapes.map(s => `<path d="${s.d}"/>`).join('');
const svg = (body, box = viewBox) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><title>Capra Studios — ribbon unicorn</title>${body}</svg>\n`;
for (const [file, color] of [['mark.svg','#7aa2f7'], ['mark-light.svg','#c0caf5'], ['mark-dark.svg','#1a1b26']]) {
  await writeFile(path.join(root, 'assets/brand', file), svg(`<g fill="${color}">${paths}</g>`));
}
await writeFile(path.join(root, 'assets/brand/favicon.svg'), svg(`<rect width="144" height="144" rx="10" fill="#1a1b26"/><g transform="translate(23 7) scale(.24)" fill="#7aa2f7">${paths}</g>`, '0 0 144 144'));
// Preserve the original outlined Red Hat wordmark lettering; replace only its emblem.
const original = await readFile(path.join(root, 'docs/brand-archive/cut-c/wordmark.svg'), 'utf8');
const lettering = original.match(/<path d="[\s\S]*<\/svg>/)[0].replace('</svg>', '');
await writeFile(path.join(root, 'assets/brand/wordmark.svg'), svg(`<g transform="translate(8 5) scale(.26)" fill="#7aa2f7">${paths}</g>${lettering}`, '0 0 420 150'));
const home = path.join(root, 'index.html');
const html = await readFile(home, 'utf8');
const symbol = `<symbol id="capra-mark" viewBox="${viewBox}">${shapes.map(s => `<path id="${s.id}" d="${s.d}"/>`).join('')}</symbol>`;
await writeFile(home, html.replace(/<symbol id="capra-mark"[\s\S]*?<\/symbol>/, symbol));
console.log('Updated ribbon unicorn marks, favicon, wordmark and shared page geometry.');
