import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('官方 SDK 启动真实 stdio 子进程并查询静态知识，不监听 HTTP', async () => {
  const root = resolve(import.meta.dirname, '..');
  const temporary = await mkdtemp(join(tmpdir(), 'openresty-mcp-test-'));
  const requestLog = join(temporary, 'requests.jsonl');
  const transport = new StdioClientTransport({ command: process.execPath,
    args: ['--import', join(root, 'test/helpers/preload-fetch.mjs'), join(root, 'mcp/server.mjs'), '--config', join(root, 'project.config.json')],
    env: { KNOWLEDGE_SITE_URL: 'http://knowledge.test/', TEST_STATIC_ROOT: join(root, 'dist'), TEST_REQUEST_LOG: requestLog }, stderr: 'pipe' });
  const client = new Client({ name: 'openresty-protocol-check', version: '0.1.0' });
  let stderr = ''; transport.stderr?.on('data', chunk => { stderr += chunk.toString(); });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.equal(tools.tools.length, 1);
    assert.equal(tools.tools[0].name, 'query_directive');
    assert.equal(tools.tools[0].annotations.readOnlyHint, true);
    assert.ok(tools.tools[0].outputSchema);
    const result = await client.callTool({ name: 'query_directive', arguments: { input: 'lua_shared_dict PRIVATE_CACHE_TOKEN 10m;', context: 'http' } });
    assert.equal(result.structuredContent.status, 'matched');
    assert.equal(result.content[0].text, result.structuredContent.markdown);
    assert.equal(result.structuredContent.detail.verification, 'basic_verified');
    const preview = await client.callTool({ name: 'query_directive', arguments: { input: 'lua_load_resty_core', module: 'ngx_http_lua_module' } });
    assert.equal(preview.structuredContent.status, 'context_required');
    assert.ok(preview.content[0].text.includes('废弃'));
    const outside = await client.callTool({ name: 'query_directive', arguments: { input: 'lua_shared_dict x 10m; lua_code_cache on;' } });
    assert.equal(outside.structuredContent.status, 'out_of_scope');
    const unknown = await client.callTool({ name: 'query_directive', arguments: { input: 'a_nonexistent_directive' } });
    assert.equal(unknown.structuredContent.status, 'unknown');
    const requests = (await readFile(requestLog, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    assert.ok(requests.every(request => request.method === 'GET' && !request.has_body));
    assert.ok(requests.every(request => new URL(request.url).pathname.startsWith('/knowledge/')));
    assert.ok(!JSON.stringify(requests).includes('PRIVATE_CACHE_TOKEN'));
    assert.ok(!stderr.includes('PRIVATE_CACHE_TOKEN'));
  } finally {
    await client.close();
    await rm(temporary, { recursive: true, force: true });
  }
});
