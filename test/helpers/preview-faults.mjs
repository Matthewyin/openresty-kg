import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';

const option = name => process.argv[process.argv.indexOf(name) + 1];
if (!process.argv.includes('--config') || !process.argv.includes('--fault')) throw new Error('需要--config及--fault');
const configPath = resolve(option('--config'));
const config = JSON.parse(await readFile(configPath, 'utf8'));
const fault = option('--fault');
if (!['examples-json', 'examples-network'].includes(fault)) throw new Error('不支持的测试故障');
const root = resolve(dirname(configPath), config.output_dir);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
// 仅本机临时验收：产品文件保持原样，仅替换可选示例响应。
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://fixture.test').pathname);
    if (pathname === '/examples.json') {
      console.log(`已触发故障：${fault}`);
      if (fault === 'examples-network') { response.destroy(); return; }
      response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end('{'); return;
    }
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': (types[extname(file)] ?? 'application/octet-stream') + '; charset=utf-8', 'cache-control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(404).end(); }
});
server.listen(0, config.preview.host, () => console.log(`故障验收：http://${config.preview.host}:${server.address().port}/`));
const timer = setTimeout(() => { server.closeAllConnections(); server.close(); }, config.preview.duration_ms);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { clearTimeout(timer); server.closeAllConnections(); server.close(); });
server.on('close', () => clearTimeout(timer));
