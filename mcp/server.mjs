import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createKnowledgeClient } from '../src/query/knowledge.mjs';

export function createServer(client, version) {
  const server = new McpServer({ name: 'openresty-config-knowledge', version }, {
    instructions: '查询 OpenResty v1.27.1.1 配置项时使用 query_directive。输入指令名称或一条配置；工具只查询已有知识，不检查配置有效性或安全性。保留上下文不足、歧义及核实状态，并引用返回的源码和网站链接。知识不可用时明确说明，不用模型常识冒充查询结果。'
  });
  const looseObject = z.record(z.string(), z.unknown());
  server.registerTool('query_directive', {
    title: '查询 OpenResty 配置知识',
    description: '查询指令名称或单条 OpenResty 配置的功能、已记录限制和源码依据。可提供该指令的 context 与模块消歧。支持单条 Lua 块但不解释 Lua 语义；不接受多条配置、读取外部文件、判断参数或变更安全性。未知仅指当前知识发布未收录。',
    inputSchema: { input: z.string(), context: z.string().optional(), module: z.string().optional() },
    outputSchema: {
      status: z.string(), schema_version: z.union([z.literal(1), z.literal(2)]), release_id: z.string().nullable(),
      match: looseObject.nullable(), detail: looseObject.nullable(), markdown: z.string(),
      detail_url: z.string().nullable(), errors: z.array(looseObject)
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async ({ input, context, module }) => {
    const result = await client.querySingle(input, { context: context ?? null, module: module ?? null });
    return { structuredContent: result, content: [{ type: 'text', text: result.markdown }], isError: ['knowledge_unavailable', 'invalid_index'].includes(result.status) };
  });
  return server;
}

async function main() {
  const position = process.argv.indexOf('--config');
  if (position < 0 || !process.argv[position + 1]) throw new Error('需要 --config 项目配置文件');
  const config = JSON.parse(await readFile(resolve(process.argv[position + 1]), 'utf8'));
  if (!process.env.KNOWLEDGE_SITE_URL) throw new Error('需要配置 KNOWLEDGE_SITE_URL，指向可访问的静态站点目录');
  const site = new URL(process.env.KNOWLEDGE_SITE_URL);
  if (!site.pathname.endsWith('/')) site.pathname += '/';
  const client = createKnowledgeClient({ siteBase: site.href, knowledgeBase: new URL('knowledge/', site).href,
    timeoutMs: Number(process.env.KNOWLEDGE_TIMEOUT_MS ?? config.request_timeout_ms) });
  const packageInfo = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const server = createServer(client, packageInfo.version);
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => { process.stderr.write('OpenResty 知识工具启动失败，请检查项目配置、站点地址和依赖。\n'); process.exitCode = 1; });
}
