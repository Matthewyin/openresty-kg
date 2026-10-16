const $ = id => document.getElementById(id);
const fixtures = {
  events: 'events {\n  multi_accept on;\n  worker_connections 1024;\n}',
  stream: 'stream {\n server {\n  listen 9000;\n  resolver 192.0.2.53;\n  proxy_connect_timeout 5s;\n  proxy_timeout 10s;\n  set $target example.invalid:443;\n  proxy_pass $target;\n }\n}',
  vts: 'http {\n vhost_traffic_status_zone;\n server {\n  listen 8080;\n  location /status {\n   vhost_traffic_status_display;\n   vhost_traffic_status_display_format html;\n  }\n }\n}',
  fragment: 'server { listen 9000; proxy_pass example.invalid:443; }',
  map: 'http {\n map $host $backend {\n  default example.invalid;\n  include conf.d/*.conf;\n }\n}',
  invalid: 'events { worker_connections 1024;',
};
const statuses = { running: '运行中', completed: '完成', awaiting_input: '等待补充', cancelled: '已取消', failed: '失败', matched: '唯一匹配', ambiguous: '候选不唯一', context_required: '需要上下文', block_entry: '块内数据', unknown: '未知指令', invalid_input: '输入无效', context_conflict: '上下文冲突', context_mismatch: '上下文不适用', module_mismatch: '模块不适用' };
let current;
let environment;
const request = async (url, body) => {
  const response = await fetch(url, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
};
function node(tag, text, parent) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; parent?.append(el); return el; }
function link(url, label, parent) { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) return; const a = node('a', label, parent); a.href = parsed.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
function render(job) {
  $('status').textContent = `${statuses[job.state] ?? job.state} · ${job.mode} · 缓存${job.cacheHit ? '命中' : '未命中'}${job.error ? ` · ${job.error}` : ''}`;
  $('result').replaceChildren();
  node('p', `SDK 活动工具：${job.tools.join('、')}；会话：${job.sessionId}`, $('result'));
  if (job.knowledgeVersion) node('p', `知识发布：${job.knowledgeVersion.release} · 内容摘要 ${job.knowledgeVersion.digest.slice(0, 16)}${job.knowledgeChanged ? '（版本变化，已重置旧知识上下文）' : ''}`, $('result'));
  if (job.summary) node('p', `普通指令 ${job.summary.directives} · 唯一匹配 ${job.summary.matched} · 块内数据 ${job.summary.block_entries} · 外部引用 ${job.summary.external_references}`, $('result'));
  for (const question of job.questions ?? []) node('p', question, $('result'));
  for (const error of job.parsed?.errors ?? []) node('p', `解析诊断：${error.message}（${error.line}:${error.column}）`, $('result'));
  for (const item of job.items ?? []) {
    const article = node('article', undefined, $('result'));
    node('h2', `${item.name} · ${statuses[item.status] ?? item.status} · ${item.line}:${item.column}`, article);
    for (const external of item.external_references) node('p', `外部引用：${external.value}（未分析、不读取）`, article);
    for (const entry of item.entries) {
      node('h3', entry.id, article); node('small', `核对层级：${entry.verification}`, article);
      node('p', `功能：${entry.summary ?? '未核实'}`, article);
      node('p', `默认值：${entry.defaults.text ?? '未核实'}（${entry.defaults.status}）`, article);
      node('p', `继承：${entry.inheritance.text ?? '未核实'}（${entry.inheritance.status}）`, article);
      for (const limitation of entry.limitations) node('p', `限制：${limitation.text}（${limitation.status}）`, article);
      if (environment) { const url = new URL(environment.siteBase); url.searchParams.set('id', entry.id); url.searchParams.set('release', job.knowledgeVersion.release); link(url, '知识站详情', article); }
      for (const source of entry.source_refs) {
        const details = node('details', undefined, article);
        node('summary', `${source.id} · ${source.component} · ${source.file}:${source.start_line}-${source.end_line}`, details);
        node('p', `固定 revision：${source.revision}`, details); link(source.url, '查看固定源码锚点', details); node('pre', source.code, details);
      }
    }
  }
  if (job.modelSelection) {
    node('h2', '模型选取（与知识事实分区）', $('result'));
    node('p', '这里只接受逐字知识事实与已存在的源码引用。引用合法不代表任意模型结论成立；本轮未开放自由解释。', $('result'));
    node('pre', JSON.stringify(job.modelSelection, null, 2), $('result'));
  }
  for (const limitation of job.limitations ?? []) node('p', limitation, $('result'));
  const debug = node('details', undefined, $('result')); node('summary', 'SDK trace 与结构化调试数据', debug); node('pre', JSON.stringify(job, null, 2), debug);
}
function chooseFixture() { const selected = $('fixture').value; $('input').value = fixtures[selected]; $('parseMode').value = selected === 'fragment' ? 'fragment' : 'main'; $('context').value = ''; $('module').value = ''; }
$('fixture').onchange = chooseFixture; chooseFixture();
$('sessionId').value = localStorage.getItem('pi-spike-session') ?? '';
$('submit').onclick = async () => {
  try {
    $('submit').disabled = true;
    const job = await request('/api/run', { request: { input: $('input').value, mode: $('parseMode').value, question: $('question').value, context: $('context').value, module: $('module').value }, ...($('sessionId').value ? { sessionId: $('sessionId').value } : {}) });
    current = job.requestId; $('sessionId').value = job.sessionId; localStorage.setItem('pi-spike-session', job.sessionId); $('cancel').disabled = false; render(job);
    const id = current;
    while (current === id) {
      const value = await request(`/api/jobs/${id}`); if (current !== id) break; render(value);
      if (value.state !== 'running') break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) { $('status').textContent = error.message; }
  finally { $('submit').disabled = false; $('cancel').disabled = true; }
};
$('cancel').onclick = async () => { try { const value = await request('/api/cancel', { requestId: current }); render(value); } catch (error) { $('status').textContent = error.message; } };
$('fresh').onclick = () => { if (!$('submit').disabled) { current = undefined; $('sessionId').value = ''; localStorage.removeItem('pi-spike-session'); $('status').textContent = '新会话；配置与问题不变时可比较缓存'; } };
$('restore').onclick = async () => {
  try { const data = await request(`/api/sessions/${$('sessionId').value}`); for (const key of ['input', 'question', 'context', 'module']) $(key).value = data.request[key]; $('parseMode').value = data.request.mode; $('status').textContent = `已恢复 ${data.messages} 条 SDK 上下文；${data.interrupted ? '上次中断，回到完整轮次；' : ''}${data.knowledgeChanged ? '知识变化，下次重新分析' : '知识摘要一致'}。可继续追问。`; }
  catch (error) { $('status').textContent = error.message; }
};
environment = await request('/api/status'); $('environment').textContent = `模式：${environment.mode === 'live' ? `真实模型 ${environment.model}` : `本地模拟（${environment.mockDelayMs}ms/次）`} · SDK 仅开放 ${environment.tools.join('、')}`;
