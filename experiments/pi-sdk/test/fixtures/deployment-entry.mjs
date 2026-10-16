import { createServer, request } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { serve } from '../../server.mjs';
import { within } from '../../src/knowledge-tools.mjs';

// 仅用于本地验收，模拟独立静态入口；不是生产反向代理。
export async function deploymentEntry(config) {
  const root = await realpath(config.distDir);
  let backend;
  const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const server = createServer(async (req, res) => {
    const fail = (status, code) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: '本地验收入口不可用', code })); };
    if (req.url.startsWith('/api/')) {
      if (!backend) { fail(503, 'unavailable'); return; }
      const target = new URL(req.url, backend.url);
      const upstream = request(target, { method: req.method, headers: req.headers }, incoming => {
        res.writeHead(incoming.statusCode, incoming.headers); incoming.pipe(res);
      });
      upstream.on('error', () => { if (!res.headersSent) fail(503, 'unavailable'); else res.destroy(); });
      req.pipe(upstream); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { fail(405, 'method_not_allowed'); return; }
    try {
      const url = new URL(req.url, origin);
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) throw new Error('路径无效');
      const path = await realpath(resolve(root, '.' + (pathname.endsWith('/') ? `${pathname}index.html` : pathname)));
      if (!within(root, path) || !types[extname(path)]) throw new Error('文件无效');
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': `${types[extname(path)]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { fail(404, 'not_found'); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const startBackend = async () => { backend = await serve({ ...config, port: 0, publicOrigin: origin }, { website: true }); };
  const stopBackend = async () => { const active = backend; backend = null; if (active) await active.close(); };
  try { await startBackend(); } catch (error) { server.close(); throw error; }
  return { url: `${origin}/`, get backend() { return backend; }, stopBackend, startBackend,
    async close() { await stopBackend(); await new Promise(done => { server.close(done); server.closeAllConnections(); }); } };
}
