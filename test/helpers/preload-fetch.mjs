import { readFile, appendFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

// 仅供 stdio 协议测试：以已构建静态文件代替网络，不启动 HTTP 服务。
const root = resolve(process.env.TEST_STATIC_ROOT);
globalThis.fetch = async (input, options) => {
  const url = new URL(input);
  const path = resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!path.startsWith(root + sep)) throw new Error('测试路径超出静态目录');
  await appendFile(process.env.TEST_REQUEST_LOG, JSON.stringify({ url: url.href, method: options?.method, has_body: options?.body !== undefined }) + '\n');
  try { return new Response(await readFile(path), { headers: { 'content-type': 'application/json' } }); }
  catch { return new Response('', { status: 404 }); }
};
