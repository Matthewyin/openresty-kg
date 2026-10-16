import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { inputEnvelope } from './input-resolution.mjs';

function mockIntent(prompt, config) {
  if (config.mockIntentResult !== undefined) return config.mockIntentResult;
  const message = prompt.message;
  const envelope = inputEnvelope(message);
  if (envelope.blocks > 1 || envelope.incomplete) return { action: 'clarify', input: '', question: '' };
  if (envelope.completeInput !== undefined) {
    const question = envelope.outside.trim();
    return { action: 'config', input: envelope.completeInput, question: message.includes(question) ? question : '' };
  }
  const fence = message.match(/```[^\r\n]*\r?\n([\s\S]*?)\r?\n```/);
  const start = message.search(/^[ \t]*[A-Za-z_][A-Za-z0-9_]*(?:[ \t]+|(?=[;{]))/m);
  const end = Math.max(message.lastIndexOf('}'), message.lastIndexOf(';')) + 1;
  if (fence || (start >= 0 && end > start)) {
    const input = fence ? fence[1] : message.slice(start, end);
    const question = fence ? message.replace(fence[0], '').trim() : (message.slice(0, start).trim() || message.slice(end).trim());
    // 测试提问只取一侧连续原文，不在 mock 中拼接用户文本。
    return { action: 'config', input, question: message.includes(question) ? question : '' };
  }
  if (/(刚才|上次|这段|继续|它的|它有哪些)/.test(message)) return { action: 'followup', input: '', question: message };
  if (prompt.hasPreviousSubject && /^(默认值|继承|限制|语法|运行时)(呢|是什么|规则)?[？?]?$/.test(message)) return { action: 'followup', input: '', question: message };
  const names = message.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  if (names.length === 1) return { action: 'directive', input: names[0], question: message === names[0] ? '' : message };
  return { action: 'clarify', input: '', question: '' };
}

export async function startMock(config) {
  const requests = [];
  const server = createServer(async (req, res) => {
    try {
      if (req.url !== '/v1/chat/completions' || req.method !== 'POST') { res.writeHead(404).end(); return; }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks));
      const lastUser = body.messages.findLastIndex(message => message.role === 'user');
      const raw = body.messages[lastUser].content;
      const prompt = JSON.parse(typeof raw === 'string' ? raw : raw.map(item => item.text ?? '').join(''));
      const results = body.messages.slice(lastUser + 1).filter(message => message.role === 'tool');
      const record = { phase: prompt.phase ?? 'selection', tools: (body.tools ?? []).map(item => item.function.name), userTurns: body.messages.filter(item => item.role === 'user').length, resultCount: results.length, inputBytes: Buffer.concat(chunks).length, thinking: body.thinking, messages: body.messages };
      requests.push(record);
      const controller = new AbortController();
      res.on('close', () => controller.abort());
      await delay(config.mockDelayMs, undefined, { signal: controller.signal });
      let calls;
      let text;
      const scenario = prompt.request.mockScenario;
      if (prompt.phase === 'input_resolution') {
        const value = mockIntent(prompt, config);
        if (scenario === 'intent-rewrite') value.input = 'http { server { listen 80; } }';
        if (scenario === 'intent-name') { value.action = 'directive'; value.input = 'proxy_pass'; }
        if (scenario === 'intent-mode') value.mode = 'main';
        text = scenario === 'intent-invalid' ? 'not json' : JSON.stringify(value);
      } else if (scenario === 'forbidden' && !results.length) {
        calls = ['bash', 'read', 'write', 'edit', 'unknown_tool'].map(name => ({ name, arguments: JSON.stringify({ command: 'false', path: 'SHOULD_NOT_EXIST', content: 'forbidden' }) }));
      } else {
        const candidates = prompt.manifest.candidates;
        if (scenario === 'query' && !results.length) calls = [{ name: 'query_knowledge', arguments: JSON.stringify({ entryIds: candidates.map(entry => entry.entryId), fields: ['defaults', 'inheritance'] }) }];
        else if (scenario === 'analyze' && !results.length) calls = [{ name: 'analyze_config', arguments: '{}' }];
        else {
          const fields = scenario === 'extended' ? ['limitations', 'runtime'] : ['summary', 'defaults', 'inheritance'];
          const facts = candidates.flatMap(entry => fields.filter(field => entry.fields[field]).map(field => ({ entryId: entry.entryId, field })));
          if (scenario === 'bad-citation') facts.push({ entryId: 'invented', field: 'defaults' });
          if (scenario === 'unknown-field') facts.push({ entryId: candidates[0].entryId, field: 'invented' });
          text = scenario === 'invalid-json' ? 'not json' : JSON.stringify(scenario === 'unsupported' ? { facts: [], status: 'unsupported' } : { facts: scenario === 'empty-selection' ? [] : facts });
          if (scenario === 'fenced-json') text = '```json\n' + text + '\n```';
        }
      }
      record.outputBytes = Buffer.byteLength(text ?? JSON.stringify(calls));
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
      const send = (delta, finish_reason = null) => res.write(`data: ${JSON.stringify({ id: 'spike', object: 'chat.completion.chunk', created: 0, model: body.model, choices: [{ index: 0, delta, finish_reason }] })}\n\n`);
      send({ role: 'assistant' });
      if (calls) send({ tool_calls: calls.map((call, i) => ({ index: i, id: `call_${requests.length}_${i}`, type: 'function', function: call })) });
      else send({ content: text });
      send({}, calls ? 'tool_calls' : 'stop');
      res.end('data: [DONE]\n\n');
    } catch (error) {
      if (error.name !== 'AbortError' && !res.destroyed) res.writeHead(500).end(JSON.stringify({ error: { message: error.message } }));
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.mockPort, config.host, resolve); });
  return { baseUrl: `http://${config.host}:${server.address().port}/v1`, requests,
    close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
