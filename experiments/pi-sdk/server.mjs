import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Spike, ROOT } from './src/session.mjs';
import { publicError } from './src/errors.mjs';
import { within } from './src/knowledge-tools.mjs';

export async function serve(overrides, { website = false } = {}) {
  const spike = await Spike.create(overrides);
  let staticRoot;
  try { staticRoot = await realpath(website ? spike.config.distDir : join(ROOT, 'web')); }
  catch (error) { await spike.close(); throw error; }
  let origin;
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.mp4': 'video/mp4' };
  const server = createServer(async (req, res) => {
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    try {
      if (req.headers.host !== new URL(origin).host || (req.headers.origin !== undefined && req.headers.origin !== origin)) { json(403, { error: '拒绝非同源请求', code: 'origin_rejected' }); return; }
      const url = new URL(req.url, origin);
      if (url.origin !== origin) { json(403, { error: '拒绝非同源请求', code: 'origin_rejected' }); return; }
      if (req.method === 'GET' && url.pathname === '/api/ready') {
        try { json(200, await spike.ready()); }
        catch { json(503, { ready: false, error: '服务尚未就绪，请稍后重试', code: 'not_ready' }); }
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/status') { json(200, { unifiedInput: true, mode: spike.config.mode, model: spike.config.modelId, tools: ['analyze_config', 'query_knowledge'], siteBase: spike.config.siteBase, mockDelayMs: spike.config.mockDelayMs, website, pollIntervalMs: spike.config.pollIntervalMs, requestTimeoutMs: spike.config.timeoutMs }); return; }
      const jobMatch = url.pathname.match(/^\/api\/jobs\/([0-9a-f-]{36})$/);
      if (req.method === 'GET' && jobMatch) {
        spike.pruneJobs();
        const job = spike.jobs.get(jobMatch[1]);
        const view = job ? spike.view(job) : { error: '请求已过期或不存在，请恢复会话或重新提交', code: 'job_unavailable' };
        if (job?.state === 'running' && url.searchParams.get('brief') === '1') for (const key of ['items', 'matches', 'parsed']) delete view[key];
        json(job ? 200 : 404, view); return;
      }
      const sessionMatch = url.pathname.match(/^\/api\/sessions\/([0-9a-f-]{36})$/);
      if (req.method === 'GET' && sessionMatch) { json(200, await spike.restore(sessionMatch[1])); return; }
      if (req.method === 'POST') {
        if (!req.headers['content-type']?.startsWith('application/json')) { json(415, { error: '需要 JSON', code: 'unsupported_media_type' }); return; }
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > spike.config.maxInputBytes * 2) throw new Error('请求过大'); chunks.push(chunk); }
        const body = JSON.parse(Buffer.concat(chunks));
        if (url.pathname === '/api/run') {
          if (website && !body?.request?.release) { json(400, { error: '请刷新网站后提交当前知识发布标识', code: 'release_required' }); return; }
          const job = spike.start(body.request, body.sessionId); json(202, spike.view(job)); return;
        }
        if (url.pathname === '/api/cancel') { json(200, await spike.cancel(body.requestId)); return; }
      }
      if (['GET', 'HEAD'].includes(req.method) && !url.pathname.startsWith('/api/')) {
        const pathname = decodeURIComponent(url.pathname);
        if (pathname.split('/').some(part => part.startsWith('.')) || pathname.includes('\\')) { json(404, { error: '文件不存在', code: 'not_found' }); return; }
        const path = resolve(staticRoot, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
        if (!within(staticRoot, path) || !types[extname(path)]) { json(404, { error: '文件不存在', code: 'not_found' }); return; }
        let body;
        try {
          const actual = await realpath(path);
          if (!within(staticRoot, actual)) throw new Error('越界');
          body = await readFile(actual);
        } catch { json(404, { error: '文件不存在', code: 'not_found' }); return; }
        res.writeHead(200, { 'Content-Type': types[extname(path)] + (extname(path) === '.mp4' ? '' : '; charset=utf-8'), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
        res.end(req.method === 'HEAD' ? undefined : body); return;
      }
      json(404, { error: '入口不存在', code: 'not_found' });
    } catch (error) { const failure = publicError(error, spike.config.apiKey); json(failure.status, { error: failure.error, code: failure.code }); }
  });
  try { await new Promise((resolve, reject) => { server.once('error', reject); server.listen(spike.config.port, spike.config.host, resolve); }); }
  catch (error) { await spike.close(); throw error; }
  const host = spike.config.host.includes(':') ? `[${spike.config.host}]` : spike.config.host;
  const listenOrigin = `http://${host}:${server.address().port}`;
  origin = spike.config.publicOrigin || listenOrigin;
  if (website) spike.config.siteBase = spike.config.relativeLinks ? spike.config.basePath : new URL(spike.config.basePath, `${origin}/`).href;
  return { server, spike, url: `${listenOrigin}/`, close: async () => { await spike.close(); await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); } };
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const app = await serve(undefined, { website: process.env.PI_SPIKE_WEBSITE === '1' });
  if (app.spike.config.logRequests) console.log(JSON.stringify({ event: 'agent_start', pid: process.pid, mode: app.spike.config.mode }));
  console.log(`${process.env.PI_SPIKE_WEBSITE === '1' ? 'OpenResty 知识站与 Agent' : 'Pi SDK 接入验证'}（${app.spike.config.mode}）：${app.url}`);
  let closing = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { if (!closing) { closing = true; await app.close(); if (app.spike.config.logRequests) console.log(JSON.stringify({ event: 'agent_stop', pid: process.pid, signal })); process.exit(0); } });
}
