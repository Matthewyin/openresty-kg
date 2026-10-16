import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { reviewRegistrationBuild } from '../scripts/registration-build.mjs';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(resolve(root, 'project.config.json')));
const catalog = JSON.parse(readFileSync(resolve(root, 'analysis/directives/catalog.json'))).directives;
const revisions = {
  nginx: 'e06bdbd4a20912c5223d7c6c6e2b3f0d6086c928',
  openresty: '8c37412c31621225e7aa7e825b5b50106c9c71c4',
  'lua-nginx-module': 'ea09d92adf835e30cab8d79343c7b8266e888128',
  'stream-lua-nginx-module': '69f0cd762112a6e0cddb07f2b5192e9a65034a93',
  'echo-nginx-module': '8376edc2bbc427e8812d105f4061045449e0db2b',
  'headers-more-nginx-module': '06dc0be56e5ec9f7fd814e881b066b5540a85bec',
  'memc-nginx-module': 'b889a6fc3e18b784b454e1bc74e5d0b3513a07ce',
  'srcache-nginx-module': 'be22ac0dcd9245aadcaca3220da96a0c1a0285a7',
  'xss-nginx-module': '6c41076ac066c30c96d70e86da5400ffd49a6186',
  ngx_devel_kit: '91e30eb05085e7f9762f130cbb883a0e753cf74d',
  'set-misc-nginx-module': '31c4ad67bb9e392a734e4e58ea8048e24012311f',
  'array-var-nginx-module': '32188f86599b47f7cd34340e5a2985bd9d550bf8',
  'form-input-nginx-module': '43ee690c359c06af7d178379cfc37ebc858d9de2',
  'rds-json-nginx-module': '2d7e07f7c39f98bbb2a8b07f4bae4d892f00329d',
  'rds-csv-nginx-module': 'b4095fcb8a866835ddec7ea0c414b8a4af35741a',
  'drizzle-nginx-module': 'fb6cf255d91135e18145a98a93947ead4e703b68',
  'lua-upstream-nginx-module': 'a84fbbb3d3b07684c232f642eccbc5334bafcbfe',
  'iconv-nginx-module': '67d55c7edd3ab0535afa1e55ec8b2cdeb5167a82',
  'encrypted-session-nginx-module': '0f81b5728db0ece0f60c72354da69f158dc1d2a7',
  'redis-nginx-module': '411fef36e130129b670fa7f2672bcad6ab2cbdd3',
  ngx_postgres: '681980598529f67fcec5c7448452046764a68429',
  ngx_coolkit: '462b863babe121b900465b4ec8dfba612d723e9a',
  'redis2-nginx-module': 'c989c829a2877132cb100f901e320921250e068d'
};
const cache = new Map();
function git(component, args) {
  return execFileSync('git', ['-C', resolve(root, component === 'openresty' ? 'openresty' : `repos/${component}`), ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}
function fixedRead(file, component) {
  const key = `${component}:${file}`;
  if (!cache.has(key)) cache.set(key, git(component, ['show', `${revisions[component]}:${file}`]));
  return cache.get(key);
}
function input(component = 'echo-nginx-module') {
  return {
    source: { ...structuredClone(config.sources.find(source => source.component === component)),
      revision: revisions[component], registration_build: { entry: component === 'nginx' ? 'auto/configure' : 'config' } },
    read: fixedRead,
    paths: git(component, ['ls-tree', '-r', '--name-only', revisions[component]]).trim().split('\n'),
    records: structuredClone(catalog.filter(record => record.component === component && !record.distribution_patch))
  };
}
function mutateRead(args, file, change, component = args.source.component) {
  args.read = (path, owner) => path === file && owner === component ? change(fixedRead(path, owner)) : fixedRead(path, owner);
  return args;
}

test('16 个正式字面模块：完整源、全身份、帮助源和 root config 排除测试模块', async () => {
  const cases = [
    ['lua-nginx-module', 64, 79], ['stream-lua-nginx-module', 44, 50],
    ['echo-nginx-module', 12, 19], ['headers-more-nginx-module', 4, 4],
    ['xss-nginx-module', 2, 6], ['memc-nginx-module', 5, 11], ['srcache-nginx-module', 6, 20],
    ['rds-json-nginx-module', 5, 10], ['rds-csv-nginx-module', 4, 6], ['drizzle-nginx-module', 9, 12],
    ['iconv-nginx-module', 1, 3], ['encrypted-session-nginx-module', 2, 5], ['redis-nginx-module', 1, 8],
    ['ngx_postgres', 10, 10], ['ngx_coolkit', 3, 1], ['redis2-nginx-module', 4, 11]
  ];
  let registrations = 0;
  for (const [component, files, count] of cases) {
    const result = await reviewRegistrationBuild(input(component));
    assert.equal(result.status, 'verified', component);
    assert.equal(result.complete, true);
    assert.equal(result.source_files.length, files, component);
    assert.equal(result.registrations.length, count, component);
    assert.ok(result.owners.every(owner => owner.consumers.length));
    assert.ok(result.units.every(unit => unit.consumer.conditions));
    assert.ok(!result.source_files.some(file => file.startsWith('t/') || file.startsWith('examples/')));
    if (component === 'ngx_postgres') assert.equal(result.owners[0].module, 'ngx_postgres_module');
    if (/^(?:lua|stream-lua)-nginx/.test(component)) assert.equal(result.generated_evidence.length, 1);
    registrations += count;
  }
  assert.equal(registrations, 255);
});

test('NDK 四组件实际 1+29+4+2；正式 include 和已提交生成输入闭合', async () => {
  for (const [component, count] of [['ngx_devel_kit', 1], ['set-misc-nginx-module', 29], ['array-var-nginx-module', 4], ['form-input-nginx-module', 2]]) {
    const result = await reviewRegistrationBuild(input(component));
    assert.equal(result.registrations.length, count);
    if (component === 'ngx_devel_kit') {
      assert.equal(result.complete, true);
      assert.equal(result.status, 'verified');
      const generated = result.generated_evidence.find(item => item.kind === 'committed-ndk-generated-inputs');
      assert.equal(generated.included_c_files.length, 17);
      assert.ok(generated.included_c_files.includes('src/hash/murmurhash2.c'));
      assert.ok(generated.includes.find(edge => edge.target === 'src/hash/murmurhash2.c').conditions.includes('ifdef NDK_MURMUR2'));
      assert.equal(generated.optional.length, 15);
      assert.equal(generated.executed, false);
      assert.ok(result.build_evidence.some(proof => proof.file === 'auto/data/modules_optional'));
      assert.ok(result.registrations[0].compile_guards.some(guard => guard.includes('NDK_UPSTREAM_LIST')));
    } else assert.equal(result.status, 'verified');
  }
});

test('Nginx 有序平台分支、可选条件、同文件双 owner、NULL owner 和生成用途闭合', async () => {
  const result = await reviewRegistrationBuild(input('nginx'));
  assert.equal(result.status, 'verified');
  assert.equal(result.complete, true);
  const windows = result.units.find(unit => unit.platform === 'win32');
  assert.ok(windows.files.includes('src/event/modules/ngx_win32_select_module.c'));
  assert.ok(!windows.files.includes('src/event/modules/ngx_select_module.c'));
  assert.ok(!windows.files.includes('src/core/ngx_thread_pool.c'));
  assert.ok(result.generated_evidence.some(item => item.kind === 'perl-xs-extension'));
  assert.equal(result.registrations.length, 724);
  assert.equal(result.source_files.length, 253);
  assert.equal(new Set(result.registrations.map(record => record.file)).size, 102);
  assert.equal(new Set(result.registrations.map(record => record.module)).size, 103);
  assert.equal(result.owners.filter(owner => owner.file === 'src/event/ngx_event.c').length, 2);
  assert.ok(result.owners.some(owner => owner.module === 'ngx_http_range_body_filter_module' && owner.commands_null));
  for (const file of ['src/event/modules/ngx_iocp_module.c', 'src/http/v3/ngx_http_v3_module.c', 'src/http/modules/perl/ngx_http_perl_module.c', 'src/stream/ngx_stream.c']) assert.ok(result.source_files.includes(file));
  assert.ok(!result.source_files.includes('src/http/modules/ngx_http_status_module.c'));
  assert.match(result.excluded[0].reason, /唯一参数仍设 NO/);
  assert.ok(result.build_evidence.some(proof => proof.component === 'openresty' && proof.file === 'util/configure'));
  assert.ok(result.build_evidence.some(proof => proof.file === 'src/http/modules/perl/nginx.xs'));
});

test('NULL commands 正向无指令，假空和缺少 metadata 不完成', async () => {
  const result = await reviewRegistrationBuild(input('lua-upstream-nginx-module'));
  assert.equal(result.status, 'verified');
  assert.equal(result.registrations.length, 0);
  assert.equal(result.owners[0].commands_null, true);
  const args = input();
  delete args.source.registration_build;
  assert.equal((await reviewRegistrationBuild(args)).status, 'pending');
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input(), 'config', () => 'ngx_addon_name=fake\n')), /不能以空扫描完成/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input('lua-upstream-nginx-module'), 'src/ngx_http_lua_upstream_module.c', text => text.replace(/ngx_module_t\s+ngx_http_lua_upstream_module\s*=/, 'ngx_module_t not_the_owner ='))), /owner|initializer/);
});

test('未知变量、表达式、覆盖、隐藏赋值、缺正式文件和消费者断链均拒绝', async () => {
  for (const [change, pattern] of [
    [text => text.replace('$ECHO_SRCS', '$UNKNOWN_SRCS'), /未知构建变量/],
    [text => text.replace('$ECHO_SRCS', '$(unknown)'), /未知构建表达式/],
    [text => text.replace('if [ -n "$ngx_module_link" ]; then', 'ECHO_SRCS="other.c"\nif [ -n "$ngx_module_link" ]; then'), /构建变量覆盖/],
    [text => `${text}\neval 'NGX_ADDON_SRCS=other.c'\n`, /构建写入/],
    [text => `${text}\nngx_module_link=NO\n`, /link/],
    [text => text.replace('ngx_module_type=HTTP_AUX_FILTER', 'ngx_module_type=UNKNOWN'), /module type/],
    [text => text.replace('. auto/module', '# disabled consumer'), /现代分支/]
  ]) await assert.rejects(() => reviewRegistrationBuild(mutateRead(input(), 'config', change)), pattern);
  const missing = input();
  missing.paths = missing.paths.filter(file => file !== 'src/ngx_http_echo_util.c');
  await assert.rejects(() => reviewRegistrationBuild(missing), /缺少.*正式 C 源/);
  const duplicate = input(); duplicate.paths.push(duplicate.paths[0]);
  await assert.rejects(() => reviewRegistrationBuild(duplicate), /重复/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input(), 'auto/module', text => text.replaceAll('$ngx_module_srcs', '$wrong_sources'), 'nginx')), /消费者已变化/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input(), 'config', text => text.replaceAll('$ngx_addon_name', 'ngx_unbound_module'))), /未绑定/);
});

test('完整身份和字段、未消费映射、未知 C include、HTTP_STATUS 新启用路径拒绝', async () => {
  for (const key of ['name', 'flags', 'callback', 'post', 'file', 'line', 'compile_guards', 'context_flags']) {
    const args = input(); args.records[0][key] = 'tampered';
    await assert.rejects(() => reviewRegistrationBuild(args), /全身份\/字段/);
  }
  const missing = input(); missing.records.pop();
  await assert.rejects(() => reviewRegistrationBuild(missing), /全身份\/字段/);
  const unused = input(); unused.source.registration_inputs = [{ file: 't/unconsumed.c' }];
  await assert.rejects(() => reviewRegistrationBuild(unused), /未消费/);
  const header = input(); header.source.registration_inputs = [{ file: 'src/ngx_http_echo_module.c', includes: { 'unused.h': 'src/unused.h' } }];
  await assert.rejects(() => reviewRegistrationBuild(header), /未消费/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input(), 'src/ngx_http_echo_module.c', text => `${text}\n#include "unknown.c"\n`)), /未核实跨文件/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input('nginx'), 'src/http/ngx_http_core_module.c', text => `${text}\n#define EXTRA "unreviewed.c"\n#include EXTRA\n`)), /根 C include 表达式/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input('nginx'), 'auto/options', text => `${text}\nHTTP_STATUS=YES\n`)), /HTTP_STATUS/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input('nginx'), 'auto/modules', text => `${text}\nHTTP_STATUS=YES\n`)), /HTTP_STATUS/);
  await assert.rejects(() => reviewRegistrationBuild(mutateRead(input('nginx'), 'util/configure', text => `${text}\n--with-http_status_module\n`, 'openresty')), /HTTP_STATUS/);
});

test('Nginx 有序输入/平台覆盖/动态聚合/生成用途发生新形态时拒绝', async () => {
  for (const [file, change, expected] of [
    ['auto/configure', text => `${text}\n. auto/new-source\n`, /新 include/],
    ['auto/configure', text => text.replace('. auto/modules', '. auto/sources\n. auto/modules'), /调用顺序/],
    ['auto/modules', text => `${text}\neval 'HTTP_SRCS="src/http/ngx_http.c"'\n`, /构建写入/],
    ['auto/modules', text => `${text}\nexport HTTP_SRCS="src/http/ngx_http.c"\n`, /构建写入/],
    ['auto/modules', text => `${text}\nunset HTTP_SRCS\n`, /构建写入/],
    ['auto/modules', text => text.replace('ngx_module_type=HTTP', 'ngx_module_type=UNKNOWN'), /module type/],
    ['auto/os/conf', text => text.replace('Darwin:*)', 'NewOS:*)'), /平台分支/],
    ['auto/os/win32', text => text.replace('SELECT_SRCS=$WIN32_SELECT_SRCS', 'SELECT_SRCS=$UNKNOWN_SRCS'), /未知变量/],
    ['auto/os/linux', text => `${text}\n. auto/new-source\n`, /未核实构建 include/],
    ['auto/modules', text => text.replace('ngx_module_srcs=$MAIL_SRCS', 'ngx_module_srcs=$STREAM_SRCS'), /聚合绑定|缺少 owner initializer/],
    ['auto/make', text => text.replaceAll('echo "    &$mod,"', 'echo "wrong"'), /指针聚合/],
    ['src/http/modules/perl/nginx.xs', text => `${text}\nINCLUDE: unknown.xs\n`, /Perl XS/],
    ['src/http/modules/perl/Makefile.PL', text => text.replace("NAME              => 'nginx'", "NAME              => 'other'"), /Perl XS/],
    ['src/misc/ngx_cpp_test_module.cpp', text => text.replace('return;', 'unknown();'), /兼容测试/]
  ]) await assert.rejects(() => reviewRegistrationBuild(mutateRead(input('nginx'), file, change)), expected, file);
});

test('NDK optional、嵌套 include、生成数据、根生成器或 library 新调用均拒绝', async () => {
  for (const [file, change, expected] of [
    ['auto/data/modules_optional', text => text.replace('buf\n', 'buf *\n'), /星号 commands/],
    ['objs/ndk_config.c', text => text.replace('#include  <ndk_buf.c>', '#include <ndk_unknown.c>'), /optional C/],
    ['src/ndk_hash.c', text => text.replace('hash/murmurhash2.c', 'hash/unknown.c'), /未知 NDK include/],
    ['src/hash/murmurhash2.c', text => `${text}\nngx_command_t injected[] = {};\n`, /新注册/],
    ['auto/data/header_files', text => `${text}\nunknown\n`, /头生成清单与正式 include 不一致/],
    ['auto/data/headers', text => `${text}\nunknown\n`, /头生成清单/],
    ['objs/ndk_config.h', text => text.replace('#define NDK_BUF 1', '#define NDK_BUF 0'), /默认\/依赖条件/],
    ['objs/ndk_config.c', text => text.replace('#if (NDK_BUF)', '#if (NDK_HTTP)'), /C guard/],
    ['auto/build', text => text.replaceAll('add_include  $1  $mod.h', 'add_include $1 other.h'), /生成模板/],
    ['config', text => `${text}\nndk_generate_files\n`, /生成调用/],
    ['config', text => `${text}\n:; ngx_auto_lib_init\n`, /根入口调用/],
    ['config', text => `${text}\n: && ngx_auto_lib_init\n`, /根入口调用/],
    ['config', text => `${text}\n: || ngx_auto_lib_init\n`, /根入口调用/],
    ['ngx_auto_lib_core', text => `${text}\nngx_auto_lib_init\n`, /根入口调用/],
    ['ngx_auto_lib_core', text => `${text}\n:; ngx_auto_lib_init\n`, /根入口调用/],
    ['ngx_auto_lib_core', text => `${text}\n: && ngx_auto_lib_init\n`, /根入口调用/],
    ['ngx_auto_lib_core', text => `${text}\nfalse || ngx_auto_lib_init\n`, /根入口调用/]
  ]) await assert.rejects(() => reviewRegistrationBuild(mutateRead(input('ngx_devel_kit'), file, change)), expected, file);
  const definedOnly = mutateRead(input('ngx_devel_kit'), 'ngx_auto_lib_core', text => text.replace('ngx_auto_lib_init() {',
    'ngx_auto_lib_init() {\n    :; ngx_auto_lib_init_latest\n    : && ngx_auto_lib_init_latest\n    false || ngx_auto_lib_init_latest'));
  assert.equal((await reviewRegistrationBuild(definedOnly)).status, 'verified');
  const missing = input('ngx_devel_kit');
  missing.paths = missing.paths.filter(path => path !== 'src/hash/murmurhash2.c');
  await assert.rejects(() => reviewRegistrationBuild(missing), /无唯一正式路径/);
});
