import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../preview', import.meta.url)));
const port = Number(process.env.PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolveFile(pathname) {
  const target = resolve(join(root, normalize(decodeURIComponent(pathname))));
  if (!target.startsWith(root)) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) return resolveFile(join(pathname, 'index.html'));
    return target;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  let file = await resolveFile(pathname);
  let status = 200;
  if (!file) {
    status = 404;
    file = await resolveFile('/404.html');
  }
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const body = await readFile(file);
  res.writeHead(status, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(body);
}).listen(port, () => console.log(`preview server on http://localhost:${port}`));
