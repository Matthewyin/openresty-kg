import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';

const position = process.argv.indexOf('--config');
if (position < 0 || !process.argv[position + 1]) throw new Error('需要 --config 配置文件');
const configPath = resolve(process.argv[position + 1]);
const config = JSON.parse(await readFile(configPath, 'utf8'));
const root = resolve(dirname(configPath), config.output_dir);
const { host, port, duration_ms: duration } = config.preview;
if (!['127.0.0.1', '::1'].includes(host) || !Number.isInteger(port) || port < 0 || port > 65535 || !Number.isFinite(duration) || duration <= 0) throw new Error('临时预览配置无效');
await readFile(resolve(root, 'site-config.json'));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  let file;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://preview.local').pathname);
    file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': (types[extname(file)] ?? 'application/octet-stream') + '; charset=utf-8', 'cache-control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404).end(); }
});
server.listen(port, host, () => console.log(`临时预览：http://${host === '::1' ? '[::1]' : host}:${server.address().port}/ （${duration / 60000} 分钟后自动关闭，Ctrl+C 可提前关闭）`));
const timer = setTimeout(() => server.close(), duration);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { clearTimeout(timer); server.close(); });
server.on('close', () => clearTimeout(timer));
