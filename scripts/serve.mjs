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
    if (relative.startsWith('..') || relative.split(path.sep).some(p=>p.startsWith('.')) || (!['','index.html','privacy.html','404.html','blender/preview.html'].includes(relative) && !relative.startsWith('assets' + path.sep))) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const target = (await stat(file)).isDirectory() ? path.join(file, 'index.html') : file;
    const body = await readFile(target);
    const headers = {'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store', 'Accept-Ranges':'bytes'};
    // Browsers seek within MP4s using byte ranges, including during a format change.
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start, end;
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, body.length - Number(match[2]));
        end = match[1] && match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= body.length || (match && !match[1] && Number(match[2]) === 0)) {
        res.writeHead(416, {...headers, 'Content-Range':`bytes */${body.length}`}); res.end(); return;
      }
      res.writeHead(206, {...headers, 'Content-Range':`bytes ${start}-${end}/${body.length}`, 'Content-Length':end-start+1});
      res.end(req.method === 'HEAD' ? undefined : body.subarray(start, end+1)); return;
    }
    res.writeHead(200, {...headers, 'Content-Length':body.length});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Capra Studios preview: http://127.0.0.1:${port}/`));
