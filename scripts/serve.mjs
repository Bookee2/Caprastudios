import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webm':'video/webm','.mp4':'video/mp4','.json':'application/json'};
createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const decoded = decodeURIComponent(url.pathname);
    const file = path.resolve(root, '.' + decoded);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || relative.split(path.sep).some(p=>p.startsWith('.')) || (!['','index.html','privacy.html','404.html'].includes(relative) && !relative.startsWith('assets' + path.sep))) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const target = (await stat(file)).isDirectory() ? path.join(file, 'index.html') : file;
    res.writeHead(200, {'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(await readFile(target));
  } catch { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Capra Studios preview: http://127.0.0.1:${port}/`));
