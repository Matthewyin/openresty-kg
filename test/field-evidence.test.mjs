import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { inventory } from '../scripts/inventory.mjs';
import { build } from '../scripts/build.mjs';
import { validateDetail, validateFieldEvidence, fieldEvidence, renderMarkdown, FIELD_PENDING_LABEL, FIELD_PENDING_NOTE } from '../src/query/knowledge.mjs';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(join(root, 'project.config.json'), 'utf8'));
const ID = 'fixture-module--fixture_module--fixture_extension_flag';
const fileId = 'B99';
// 覆盖层固定使用的有效条目；各用例在其基础上做单点破坏，确保每个报错只由被改动的约束触发。
const valid = () => ({ id: ID,
  evidence: [{ id: 'flag-impl', component: 'fixture-module', file: 'module.c', start_line: 1, end_line: 4 }],
  syntax_evidence: { status: 'verified', source_ids: ['registration'], note: '注册行参数个数与标志一致' },
  summary_evidence: { status: 'verified', source_ids: ['flag-impl'], note: '实现片段支撑功能' } });

// 构建一个只含单个部门扩展条目的隔离仓库，在其上构建覆盖层；不触碰项目 dist 与 knowledge。
// 盘点耗时较长，整个文件只建一次夹具；每个用例开始时清空覆盖目录与 dist，互不影响。
let shared;
after(() => shared?.then(({ taskDir }) => rm(taskDir, { recursive: true, force: true })));
async function withFixture(fn) {
  shared ??= createFixture();
  const context = await shared;
  await rm(join(context.taskDir, 'field-evidence'), { recursive: true, force: true });
  await rm(join(context.taskDir, 'dist'), { recursive: true, force: true });
  await fn(context);
}
async function createFixture() {
  const taskDir = await mkdtemp(join(tmpdir(), 'field-evidence-fixture-'));
  {
    const directory = join(taskDir, 'fixture');
    await mkdir(directory); await mkdir(join(taskDir, 'site')); await mkdir(join(taskDir, 'src'));
    await writeFile(join(taskDir, 'site/index.html'), '<!doctype html><title>字段证据测试</title>');
    await writeFile(join(directory, 'module.c'), 'static ngx_command_t fixture_commands[] = {\n { ngx_string("fixture_extension_flag"), NGX_HTTP_MAIN_CONF|NGX_CONF_FLAG, ngx_conf_set_flag_slot, 0, 0, NULL }, ngx_null_command\n};\nngx_module_t fixture_module = { NGX_MODULE_V1, NULL, fixture_commands, NGX_HTTP_MODULE };\n');
    await writeFile(join(directory, 'README.md'), '# 夹具说明\n仅用于文档类来源判定。\n');
    await writeFile(join(directory, 'config'), 'ngx_addon_name=fixture_module\nFIXTURE_SRCS="$ngx_addon_dir/module.c"\nif test -n "$ngx_module_link"; then\nngx_module_type=HTTP\nngx_module_name=$ngx_addon_name\nngx_module_srcs="$FIXTURE_SRCS"\n. auto/module\nelse\nHTTP_MODULES="$HTTP_MODULES $ngx_addon_name"\nNGX_ADDON_SRCS="$NGX_ADDON_SRCS $FIXTURE_SRCS"\nfi\n');
    execFileSync('git', ['-C', directory, 'init'], { stdio: 'pipe' });
    execFileSync('git', ['-C', directory, 'remote', 'add', 'origin', 'https://github.com/fixture/department-module']);
    execFileSync('git', ['-C', directory, 'add', '.']);
    execFileSync('git', ['-C', directory, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', '隔离固定模块'], { stdio: 'pipe' });
    const revision = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const extension = { component: 'fixture-module', path: 'fixture', repository: 'https://github.com/fixture/department-module', revision,
      version: 'commit ' + revision.slice(0, 12), version_kind: 'commit_snapshot', deployment_status: 'unknown', registration_build: { entry: 'config' } };
    const nginx = config.sources.find(source => source.component === 'nginx');
    const knowledge = [{ component: extension.component, module: 'fixture_module', name: 'fixture_extension_flag', syntax: 'fixture_extension_flag on | off;', summary: '隔离测试模块的标志配置入口。',
      callback_definition: { component: 'nginx', file: 'src/core/ngx_conf_file.c', start_line: 1026, end_line: 1063 }, evidence: [], limitations: [] }];
    await writeFile(join(taskDir, 'knowledge.json'), '[]');
    await writeFile(join(taskDir, 'extensions.json'), JSON.stringify(knowledge));
    const temporary = { openresty_version: config.openresty_version, main_repo: join(root, config.main_repo), analysis_dir: 'analysis', output_dir: 'dist',
      title: '隔离模块', request_timeout_ms: 1000, knowledge_file: 'knowledge.json', extension_knowledge_file: 'extensions.json', field_evidence_dir: 'field-evidence',
      sources: [{ ...nginx, path: join(root, nginx.path) }], department_extensions: [extension], department_sample_status: { received: true, pending: ['样例已收，深度待验收'] } };
    const configPath = join(taskDir, 'project.config.json');
    await writeFile(configPath, JSON.stringify(temporary));
    await inventory(configPath);
    const overlay = (files, name = fileId) => mkdir(join(taskDir, 'field-evidence'), { recursive: true })
      .then(() => Promise.all(Object.entries(files).map(([file, value]) => writeFile(join(taskDir, 'field-evidence', `${file}.json`), JSON.stringify(value)))));
    return { taskDir, configPath, overlay, batch: entries => ({ batch: fileId, entries }) };
  }
}
const detailOf = taskDir => readFile(join(taskDir, `dist/knowledge/index.json`), 'utf8').then(JSON.parse)
  .then(index => readFile(join(taskDir, 'dist/knowledge', index.directives.find(entry => entry.id === ID).detail_path), 'utf8')).then(JSON.parse);

test('合法覆盖层：字段证据与新增来源进入详情，修正保留原文与理由', () => withFixture(async ({ taskDir, configPath, overlay, batch }) => {
  await build(configPath);
  const plain = await detailOf(taskDir);
  assert.deepEqual(plain.syntax_evidence, { status: 'unverified', source_ids: [], note: null });
  assert.deepEqual(plain.summary_evidence, { status: 'unverified', source_ids: [], note: null });
  await rm(join(taskDir, 'dist'), { recursive: true });
  await overlay({ [fileId]: batch([{ ...valid(), corrections: { summary: { text: '修正后的功能。', reason: '原文与源码不符' } } }]) });
  await build(configPath);
  const detail = await detailOf(taskDir);
  assert.equal(detail.sources.at(-1).id, 'flag-impl');
  assert.equal(detail.sources.at(-1).code.split('\n').length, 4);
  assert.deepEqual(detail.syntax_evidence, valid().syntax_evidence);
  assert.equal(detail.summary, '修正后的功能。');
  assert.deepEqual(detail.summary_evidence.correction, { previous_text: '隔离测试模块的标志配置入口。', reason: '原文与源码不符' });
  // 字段顺序：*_evidence 紧随对应字段之后。
  const keys = Object.keys(detail);
  assert.equal(keys.indexOf('syntax_evidence'), keys.indexOf('syntax') + 1);
  assert.equal(keys.indexOf('summary_evidence'), keys.indexOf('summary') + 1);
  const index = JSON.parse(await readFile(join(taskDir, 'dist/knowledge/index.json'), 'utf8'));
  validateDetail(detail, index.directives.find(entry => entry.id === ID), index);
}));

test('--check 完整校验但不写发布目录与覆盖率，并按批次统计', () => withFixture(async ({ taskDir, configPath, overlay, batch }) => {
  await overlay({ [fileId]: batch([valid()]) });
  // 夹具的 analysis 目录由本测试独占；先写入哨兵，--check 之后必须原样保留。
  const coverage = join(taskDir, 'analysis/coverage.json');
  await writeFile(coverage, 'sentinel');
  const report = await build(configPath, { check: true });
  await assert.rejects(stat(join(taskDir, 'dist')), { code: 'ENOENT' });
  assert.equal(await readFile(coverage, 'utf8'), 'sentinel');
  assert.equal(report.covered_entries, 1);
  assert.equal(report.batches[fileId].syntax_verified, 1);
  assert.equal(report.total.summary_verified, 1);
  assert.equal(report.total.summary_unverified, report.entries - 1);
  // 校验在 --check 下同样生效。
  await overlay({ [fileId]: batch([{ ...valid(), summary_evidence: { status: 'unverified', source_ids: [], note: '' } }]) });
  await assert.rejects(build(configPath, { check: true }), /缺口说明/);
}));

test('覆盖层非法时构建报错且带条目 ID', async () => {
  const missingId = { ...valid(), id: 'fixture-module--fixture_module--missing' };
  const cases = [
    ['未知键', { [fileId]: [{ ...valid(), extra: 1 }] }, /未知键/],
    ['跨文件重复 id', { [fileId]: [valid()], B98: [valid()] }, /重复/],
    ['id 不存在', { [fileId]: [missingId] }, /条目不存在/],
    ['evidence id 与已有来源碰撞', { [fileId]: [{ ...valid(), evidence: [{ ...valid().evidence[0], id: 'registration' }] }] }, /冲突/],
    ['同批新增 evidence id 碰撞', { [fileId]: [{ ...valid(), evidence: [valid().evidence[0], valid().evidence[0]] }] }, /冲突/],
    ['evidence id 不安全', { [fileId]: [{ ...valid(), evidence: [{ ...valid().evidence[0], id: '../x' }] }] }, /evidence\.id 无效/],
    ['source_id 不可解析', { [fileId]: [{ ...valid(), syntax_evidence: { status: 'verified', source_ids: ['registration', 'nope'], note: 'x' } }] }, /无法解析/],
    ['source_id 重复', { [fileId]: [{ ...valid(), syntax_evidence: { status: 'verified', source_ids: ['registration', 'registration'], note: 'x' } }] }, /重复/],
    ['unverified 缺 note', { [fileId]: [{ ...valid(), syntax_evidence: { status: 'unverified', source_ids: [], note: null } }] }, /缺口说明/],
    ['verified syntax 缺 registration', { [fileId]: [{ ...valid(), syntax_evidence: { status: 'verified', source_ids: ['flag-impl'], note: 'x' } }] }, /注册来源/],
    ['verified summary 只有配置类来源', { [fileId]: [{ ...valid(), summary_evidence: { status: 'verified', source_ids: ['registration', 'configuration-definition'], note: 'x' } }] }, /实现类源码/],
    ['verified summary 只有文档类来源（.md，id 不在排除名单）', { [fileId]: [{ ...valid(), evidence: [{ id: 'readme', component: 'fixture-module', file: 'README.md', start_line: 1, end_line: 2 }], summary_evidence: { status: 'verified', source_ids: ['readme'], note: 'x' } }] }, /实现类源码/],
    ['verified summary 只引用 registration-container', { [fileId]: [{ ...valid(), evidence: [{ ...valid().evidence[0], id: 'registration-container' }], summary_evidence: { status: 'verified', source_ids: ['registration-container'], note: 'x' } }] }, /实现类源码/],
    ['verified summary 只引用 owner-include', { [fileId]: [{ ...valid(), evidence: [{ ...valid().evidence[0], id: 'owner-include' }], summary_evidence: { status: 'verified', source_ids: ['owner-include'], note: 'x' } }] }, /实现类源码/],
    ['evidence 项含未知键', { [fileId]: [{ ...valid(), evidence: [{ ...valid().evidence[0], note: '多余' }] }] }, /evidence 含未知键/],
    ['correction 缺 reason', { [fileId]: [{ ...valid(), corrections: { syntax: { text: '新语法;' } } }] }, /reason/],
    ['correction 缺对应 evidence', { [fileId]: [{ id: ID, corrections: { syntax: { text: '新语法;', reason: '不符' } } }] }, /syntax_evidence/],
    ['批次与文件名不一致', { B98: { batch: fileId, entries: [] } }, /批次/],
  ];
  for (const [name, files, pattern] of cases) await withFixture(async ({ taskDir, configPath, overlay, batch }) => {
    const shaped = Object.fromEntries(Object.entries(files).map(([file, value]) => [file, Array.isArray(value) ? { batch: file, entries: value } : value]));
    await overlay(shaped);
    await assert.rejects(build(configPath, { check: true }), error => pattern.test(error.message) && (name.includes('批次') || error.message.includes(ID.split('--')[0]) || error.message.includes('missing')), name);
  });
});

test('patch_status 未核实时 verified 被拒绝；历史详情无 *_evidence 仍通过', async () => {
  const index = JSON.parse(await readFile(join(root, 'dist/knowledge/releases/1.27.1.1-eeabda4eba7f5c16/index.json'), 'utf8'));
  const entry = index.directives.find(item => item.verification !== 'registration_only');
  const detail = JSON.parse(await readFile(join(root, 'dist/knowledge', entry.detail_path), 'utf8'));
  assert.equal(detail.summary_evidence, undefined);
  validateDetail(detail, entry, index);
  assert.deepEqual(fieldEvidence(detail, 'summary'), { status: 'unverified', source_ids: [], note: null });
  const registration = detail.sources.find(source => source.id === 'registration');
  const implementation = { ...registration, id: 'impl', file: 'src/impl.c', url: registration.url.replace(registration.file, 'src/impl.c') };
  const proposed = patch => ({ ...detail, sources: [...detail.sources, implementation], patch_status: { ...detail.patch_status, status: 'verified_unaffected' },
    syntax: 'x;', summary: '功能', syntax_evidence: { status: 'verified', source_ids: ['registration'], note: 'x' },
    summary_evidence: { status: 'verified', source_ids: ['impl'], note: 'x' }, ...patch });
  validateFieldEvidence(proposed({}));
  assert.throws(() => validateFieldEvidence(proposed({ patch_status: { ...detail.patch_status, status: 'unverified' } })), /补丁状态/);
  assert.throws(() => validateFieldEvidence(proposed({ summary_evidence: { status: 'verified', source_ids: ['registration'], note: 'x' } })), /实现类/);
  assert.throws(() => validateFieldEvidence(proposed({ summary_evidence: { status: 'verified', source_ids: [], note: 'x' } })), /来源/);
  assert.throws(() => validateFieldEvidence(proposed({ summary_evidence: { status: 'verified', source_ids: ['impl'], note: 'x', extra: 1 } })), /结构/);
  assert.throws(() => validateFieldEvidence(proposed({ summary_evidence: { status: 'verified', source_ids: ['impl'], note: 'x', correction: { previous_text: 'a', reason: '' } } })), /修正/);
});

test('Markdown 区分已核实、待补出处与未核实', async () => {
  const index = JSON.parse(await readFile(join(root, 'dist/knowledge/releases/1.27.1.1-eeabda4eba7f5c16/index.json'), 'utf8'));
  const load = async entry => JSON.parse(await readFile(join(root, 'dist/knowledge', entry.detail_path), 'utf8'));
  const basic = await load(index.directives.find(item => item.verification === 'basic_verified'));
  const markdown = detail => renderMarkdown({ status: 'matched', release_id: 'r', errors: [], detail });
  const pending = markdown(basic);
  assert.ok(pending.includes(`${FIELD_PENDING_LABEL}（${FIELD_PENDING_NOTE}）`));
  assert.ok(!pending.includes('语法状态：已核实') && !pending.includes('功能状态：已核实'));
  const verifiedDetail = { ...basic, syntax_evidence: { status: 'verified', source_ids: ['registration'], note: 'x' }, summary_evidence: { status: 'unverified', source_ids: [], note: 'y' } };
  const verified = markdown(verifiedDetail);
  const registration = basic.sources.find(source => source.id === 'registration');
  assert.ok(verified.includes(`语法状态：已核实；出处：[${registration.file}:${registration.start_line}–${registration.end_line}](${registration.url})`));
  assert.ok(verified.includes(`功能状态：${FIELD_PENDING_LABEL}`));
  const only = markdown({ ...basic, verification: 'registration_only' });
  assert.ok(only.includes('功能状态：未核实') && only.includes('语法状态：未核实') && !only.includes(FIELD_PENDING_LABEL));
});
