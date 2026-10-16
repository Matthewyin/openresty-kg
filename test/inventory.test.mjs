import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, symlink, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { extractCommands, inventory } from '../scripts/inventory.mjs';

const root = resolve(import.meta.dirname, '..');
const fixtureCommand = `static ngx_command_t fixture_commands[2] = {
 { ngx_string("fixture_header"), NGX_HTTP_LOC_CONF|NGX_CONF_TAKE1, fixture_callback, 0, 0, NULL }, ngx_null_command
};
ngx_module_t fixture_module = { fixture_commands };`;

test('显式数组长度与头文件注册不静默漏项', () => {
  const records = extractCommands(fixtureCommand, 'fixture.h', 'fixture');
  assert.equal(records.length, 1);
  assert.equal(records[0].module, 'fixture_module');
  assert.equal(records[0].module_verified, true);
  assert.equal(extractCommands(fixtureCommand.replace('[2]', '[FIXTURE_COMMAND_COUNT]'), 'fixture.h', 'fixture').length, 1);
});

test('实际盘点从固定树读文件和头文件，工作树修改/未跟踪文件不污染目录', async () => {
  const taskDir = await mkdtemp(join(tmpdir(), 'knowledge-inventory-frozen-'));
  try {
    await symlink(resolve(root, 'openresty'), join(taskDir, 'openresty'));
    execFileSync('git', ['clone', '--local', resolve(root, 'repos/memc-nginx-module'), join(taskDir, 'memc')], { stdio: 'pipe' });
    const repo = join(taskDir, 'memc');
    await writeFile(join(repo, 'fixture.h'), fixtureCommand);
    execFileSync('git', ['-C', repo, 'add', 'fixture.h']);
    execFileSync('git', ['-C', repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', '测试固定树头文件'], { stdio: 'pipe' });
    execFileSync('git', ['-C', repo, 'tag', 'fixture-frozen']);
    await writeFile(join(repo, 'src/ngx_http_memc_module.c'), '工作树夹具，不属于冻结版本\n');
    await writeFile(join(repo, 'untracked.h'), fixtureCommand.replaceAll('fixture_header', 'untracked_directive'));
    const config = { openresty_version: '1.27.1.1', main_repo: 'openresty', analysis_dir: 'analysis',
      sources: [{ component: 'memc-nginx-module', path: 'memc', version: '0.20', tag: 'fixture-frozen', role: 'nginx-module' }] };
    await writeFile(join(taskDir, 'project.config.json'), JSON.stringify(config));
    await inventory(join(taskDir, 'project.config.json'));
    const catalog = JSON.parse(await readFile(join(taskDir, 'analysis/directives/catalog.json'), 'utf8'));
    assert.equal(catalog.directives.length, 12);
    assert.ok(catalog.directives.some(record => record.name === 'memc_pass'));
    assert.ok(catalog.directives.some(record => record.name === 'fixture_header' && record.file === 'fixture.h'));
    assert.ok(!catalog.directives.some(record => record.name === 'untracked_directive'));
    const before = await readFile(join(taskDir, 'analysis/directives/catalog.json'), 'utf8');
    config.component_scope_file = 'scope.json';
    await writeFile(join(taskDir, 'project.config.json'), JSON.stringify(config));
    const original = JSON.parse(await readFile(resolve(root, 'knowledge/component-scope.json'), 'utf8'));
    for (const mutate of [
      proof => { proof.components[0].version = 'wrong'; },
      proof => { proof.components[0].truncated = true; },
      proof => { proof.components[0].files.push({path:'generated_module.c',sha:'fake'}); },
      proof => { proof.components[0].installation.blob_sha = 'wrong'; },
      proof => { proof.components[0].installation.code += '\nall: generate_module.c\n'; },
    ]) {
      const broken = structuredClone(original); mutate(broken);
      await writeFile(join(taskDir, 'scope.json'), JSON.stringify(broken));
      await assert.rejects(inventory(join(taskDir, 'project.config.json')), /范围证据/);
      assert.equal(await readFile(join(taskDir, 'analysis/directives/catalog.json'), 'utf8'), before);
    }
  } finally {
    // 仅删除本测试创建的隔离 checkout，保留原源码仓库。
    await rm(taskDir, { recursive: true, force: true });
  }
});

test('范围证据进入实际矩阵，13 个 Lua 库不进入指令分母，原生 signal 单独分类', async () => {
  const matrix = JSON.parse(await readFile(resolve(root, 'analysis/components.json'), 'utf8')).components;
  const scope = JSON.parse(await readFile(resolve(root, 'knowledge/component-scope.json'), 'utf8')).components;
  assert.equal(scope.length, 13);
  for (const proof of scope) {
    const entry = matrix.find(component => component.component === proof.component);
    assert.equal(entry.directive_scope, 'reference_only');
    assert.equal(entry.registrations, 0);
    assert.equal(entry.revision, proof.revision);
    assert.deepEqual(entry.scope_evidence, proof);
    assert.equal(proof.truncated, false);
    assert.ok(proof.installation.code.includes('*.lua'));
  }
  const signal = matrix.find(component => component.component === 'lua-resty-signal');
  assert.equal(signal.inspection, 'fixed_build_and_entry_review');
  assert.equal(signal.role, 'lua_ffi_library');
  assert.equal(signal.registrations, 0);
  assert.ok(signal.scope_review.evidence.some(item => item.id === 'native-entry'));
});
