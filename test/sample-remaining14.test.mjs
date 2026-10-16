import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const config = json('project.config.json');
const matrix = json('analysis/components.json');
const index = json('dist/knowledge/releases/1.27.1.1-647706874ae7c03c/index.json');
const baseline = json('dist/knowledge/releases/1.27.1.1-2dca5fdd6a398672/index.json');
const runtimeBaseline = json('dist/knowledge/releases/1.27.1.1-ca870e6c128ac027/index.json');
const knowledge = [...json(config.knowledge_file), ...json(config.extension_knowledge_file)];
const identities = [
  ...['server', 'listen', 'location', 'error_log'].map(name => `nginx--ngx_http_core_module--${name}`),
  'nginx--ngx_conf_module--include', 'nginx--ngx_events_module--events',
  'nginx--ngx_stream_module--stream', 'nginx--ngx_http_module--http',
  'nginx--ngx_http_proxy_module--proxy_limit_rate',
  ...['worker_cpu_affinity', 'pid', 'worker_rlimit_nofile'].map(name => `nginx--ngx_core_module--${name}`),
  'nginx--ngx_errlog_module--error_log',
  'nginx-module-vts--ngx_http_vhost_traffic_status_module--vhost_traffic_status_display',
];
const detailFor = entry => json(`dist/knowledge/${entry.detail_path}`);
const historicalEvidenceCounts = {
  ...Object.fromEntries(json('test/fixtures/final25-baseline.json').targets.map(target => [target.id, target.count])),
  'nginx--ngx_core_module--worker_cpu_affinity': 9, 'nginx--ngx_core_module--worker_rlimit_nofile': 5,
};
const curatedFor = entry => {
  const curated = knowledge.find(item => item.component === entry.component && item.module === entry.module && item.name === entry.name);
  const count = historicalEvidenceCounts[entry.id];
  if (count === undefined) return curated;
  // 本专项验证历史默认值批次；后续运行时新增由容量及final25专项独立保护。
  return { ...curated, evidence: curated.evidence.slice(0, count),
    patch_status: detailFor(runtimeBaseline.directives.find(item => item.id === entry.id)).patch_status };
};
const sourceConfigs = new Map([
  ...matrix.components.map(item => [item.component, item]),
  ...config.documentation_sources.map(item => [item.component, { ...item, local_path: item.path }]),
  ...config.department_extensions.map(item => [item.component, { ...item, local_path: item.path }]),
]);
sourceConfigs.set('openresty', { local_path: config.main_repo, repository: 'https://github.com/openresty/openresty',
  revision: json(config.nginx_patch_audit).openresty_revision, version: config.openresty_version });
const files = new Map();
function fixedSource(evidence, component) {
  const owner = evidence.component ?? component;
  const source = sourceConfigs.get(owner);
  assert.ok(source, owner);
  const key = `${owner}/${evidence.file}`;
  if (!files.has(key)) files.set(key, execFileSync('git', ['-C', resolve(root, source.local_path), 'show', `${source.revision}:${evidence.file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replaceAll('\r\n', '\n').split('\n'));
  const lines = files.get(key);
  assert.ok(evidence.start_line > 0 && evidence.end_line >= evidence.start_line && evidence.end_line <= lines.length);
  return { id: evidence.id, component: owner, version: source.version, revision: source.revision,
    file: evidence.file, start_line: evidence.start_line, end_line: evidence.end_line,
    code: lines.slice(evidence.start_line - 1, evidence.end_line).join('\n'),
    url: `${source.repository}/blob/${source.revision}/${evidence.file}#L${evidence.start_line}-L${evidence.end_line}`,
    kind: evidence.file.endsWith('.patch') ? 'openresty_patch' : 'upstream' };
}

for (const id of identities) test(`剩余样例事实及实际发布证据：${id}`, () => {
  const entry = index.directives.find(item => item.id === id);
  assert.ok(entry);
  const curated = curatedFor(entry);
  assert.equal(new Set(curated.evidence.map(source => source.id)).size, curated.evidence.length);
  const published = detailFor(entry);
  const before = detailFor(baseline.directives.find(item => item.id === id));
  const expected = new Map(before.sources.map(source => [source.id, source]));
  for (const evidence of curated.evidence) expected.set(evidence.id, fixedSource(evidence, entry.component));
  const ordered = sources => [...sources].sort((a, b) => a.id.localeCompare(b.id));
  const check = sources => assert.deepEqual(ordered(sources), ordered(expected.values()));
  check(published.sources);
  const checkFact = fact => {
    assert.ok(['verified', 'not_applicable'].includes(fact.status));
    assert.ok(fact.text?.trim());
    assert.ok(fact.source_ids.length > 0);
    for (const sourceId of fact.source_ids) assert.ok(expected.has(sourceId), sourceId);
  };
  for (const field of ['defaults', 'inheritance']) {
    assert.deepEqual(published[field], curated[field]);
    checkFact(published[field]);
    for (const change of [{ text: '' }, { source_ids: [] }, { source_ids: ['missing-source'] }]) {
      assert.throws(() => checkFact({ ...published[field], ...change }), assert.AssertionError);
    }
  }
  const added = published.sources.find(source => !before.sources.some(old => old.id === source.id));
  assert.ok(added, '新事实应有专项证据');
  for (const [field, value] of [['code', '错误片段'], ['revision', '0'.repeat(40)], ['start_line', 0], ['url', 'https://invalid.example/source']]) {
    const wrong = structuredClone(published.sources);
    wrong.find(source => source.id === added.id)[field] = value;
    assert.throws(() => check(wrong), assert.AssertionError);
  }
  assert.throws(() => check([...published.sources, { ...added, id: 'extra-source' }]), assert.AssertionError);
  assert.throws(() => check([...published.sources, added]), assert.AssertionError);
});

test('本批只改变14个身份的事实与证据，其他字段及所有旧证据保留', () => {
  assert.deepEqual(index.directives.map(entry => entry.id), baseline.directives.map(entry => entry.id));
  const stable = ({ release_id, ...fields }) => fields;
  for (const entry of index.directives) {
    const before = stable(detailFor(baseline.directives.find(item => item.id === entry.id)));
    const published = stable(detailFor(entry));
    const check = value => {
      const after = structuredClone(value);
      if (identities.includes(entry.id)) {
        assert.deepEqual(after.patch_status, curatedFor(entry).patch_status ?? before.patch_status);
        for (const source of before.sources) assert.deepEqual(after.sources.find(item => item.id === source.id), source);
        for (const id of before.patch_status.source_ids) assert.ok(after.patch_status.source_ids.includes(id));
        after.defaults = before.defaults;
        after.inheritance = before.inheritance;
        after.sources = before.sources;
        after.patch_status.source_ids = before.patch_status.source_ids;
      }
      assert.deepEqual(after, before, entry.id);
    };
    check(published);
    if (identities.includes(entry.id)) for (const mutate of [
      value => value.patch_status.source_ids.push('extra-patch-source'),
      value => value.patch_status.source_ids.push(value.patch_status.source_ids[0]),
      value => { value.patch_status.note = '错误补丁结论'; },
      value => { value.patch_status.status = 'unverified'; },
      value => { value.sources[0].code = '错误旧证据'; },
      value => { value.sources.shift(); },
      value => { value.summary = '误改原说明'; },
    ]) {
      const wrong = structuredClone(published);
      mutate(wrong);
      assert.throws(() => check(wrong), assert.AssertionError);
    }
  }
});

test('VTS展示入口不是可继承的普通开关字段', () => {
  const entry = index.directives.find(item => item.id === identities.at(-1));
  const detail = detailFor(entry);
  const code = id => detail.sources.find(item => item.id === id)?.code ?? '';
  assert.match(code('display-binding'), /clcf->handler = ngx_http_vhost_traffic_status_display_handler/);
  assert.match(code('core-location-create'), /ngx_pcalloc/);
  assert.doesNotMatch(code('core-location-merge'), /conf->handler\s*=/);
  assert.doesNotMatch(code('display-module-create-merge'), /clcf->handler\s*=/);
  assert.match(detail.inheritance.text, /独立子 location/);
  assert.match(detail.defaults.text, /默认不由本指令安装/);
});
