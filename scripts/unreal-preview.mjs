import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('output/unreal');
const host = process.env.CAPRA_PREVIEW_HOST || '127.0.0.1';
const port = Number(process.env.CAPRA_PREVIEW_PORT || 4180);
const allowed = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/capra-electric-dreams-creek-720p.mp4', ['capra-electric-dreams-creek-720p.mp4', 'video/mp4']],
  ['/capra-electric-dreams-creek-poster.jpg', ['capra-electric-dreams-creek-poster.jpg', 'image/jpeg']],
  ['/capra-world-wakes-wedge-720p.mp4', ['capra-world-wakes-wedge-720p.mp4', 'video/mp4']],
  ['/capra-world-wakes-wedge-poster.jpg', ['capra-world-wakes-wedge-poster.jpg', 'image/jpeg']],
  ['/capra-ribbon-light-study-720p.mp4', ['capra-ribbon-light-study-720p.mp4', 'video/mp4']],
  ['/capra-ribbon-light-study-poster.jpg', ['capra-ribbon-light-study-poster.jpg', 'image/jpeg']],
]);

createServer(async (request, response) => {
  try {
    const item = allowed.get(new URL(request.url, 'http://local').pathname);
    if (!item) { response.writeHead(404); response.end(); return; }
    const body = await readFile(resolve(root, item[0]));
    const headers = { 'Content-Type': item[1], 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range || '');
    if (request.headers.range && !match) { response.writeHead(416); response.end(); return; }
    if (match) {
      const start = match[1] ? Number(match[1]) : Math.max(0, body.length - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
      if (start > end || start >= body.length) {
        response.writeHead(416, { ...headers, 'Content-Range': `bytes */${body.length}` }); response.end(); return;
      }
      response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Content-Length': end-start+1 });
      response.end(request.method === 'HEAD' ? undefined : body.subarray(start, end+1));
      return;
    }
    response.writeHead(200, { ...headers, 'Content-Length': body.length });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(500); response.end(); }
}).listen(port, host, () => process.stdout.write(`Capra Unreal preview: http://${host}:${port}/\n`));
