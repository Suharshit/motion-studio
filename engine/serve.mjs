// engine/serve.mjs — tiny static server rooted at the repo, so projects can fetch
// style.json / beats.json / vo/*.json and import ../../engine/lib/*.js (file:// can't).
//
//   npm run preview -- <slug> [--format 9x16|1x1|16x9] [--port 4321]
//
// Also imported by render.mjs / stills.mjs (startServer()).
import http from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import {extname, join, normalize, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
};

export function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (!p.startsWith(ROOT)) return res.writeHead(403).end();
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) return res.writeHead(404).end('not found');
    res.writeHead(200, {'content-type': TYPES[extname(p).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store'});
    createReadStream(p).pipe(res);
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r({server, port: server.address().port})));
}

export const FORMATS = {'9x16': [1080, 1920], '1x1': [1080, 1080], '4x5': [1080, 1350], '16x9': [1920, 1080], '4k': [3840, 2160]};

export function projectUrl(port, slug, format = '9x16', extra = '') {
  const [w, h] = FORMATS[format] ?? format.split('x').map(Number);
  return `http://127.0.0.1:${port}/projects/${slug}/index.html?w=${w}&h=${h}${extra}`;
}

export function args(argv = process.argv.slice(2)) {
  const out = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[k] = v;
    } else out._.push(a);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = args();
  const slug = a._[0];
  const {port} = await startServer(Number(a.port ?? 4321));
  if (slug) console.log(`Preview: ${projectUrl(port, slug, a.format ?? '9x16')}`);
  else console.log(`Serving repo at http://127.0.0.1:${port}/projects/<slug>/index.html`);
  console.log('Ctrl+C to stop.');
}
