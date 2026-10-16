import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const script = resolve(import.meta.dirname, '../analysis/verify-nginx-patches.mjs');

async function fixture(source, patch, check) {
  const taskDir = await mkdtemp(join(tmpdir(), 'patch-audit-regression-'));
  try {
    const git = (...args) => execFileSync('git', ['-C', taskDir, ...args], { encoding: 'utf8', stdio: 'pipe' }).trim();
    git('init', '--quiet');
    await writeFile(join(taskDir, 'data.txt'), source);
    git('add', 'data.txt');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '--quiet', '-m', '测试上游');
    const nginxRevision = git('rev-parse', 'HEAD');
    await mkdir(join(taskDir, 'patches'));
    await writeFile(join(taskDir, 'patches/nginx-fixture-sample.patch'), patch);
    git('add', 'patches');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '--quiet', '-m', '测试补丁');
    const audit = { openresty_version: 'fixture', nginx_version: 'fixture', nginx_revision: nginxRevision,
      openresty_revision: git('rev-parse', 'HEAD'), patches: ['sample'], substitutions: {}, targets: [] };
    const config = { openresty_version: 'fixture', main_repo: '.', sources: [{ component: 'nginx', path: '.' }] };
    await writeFile(join(taskDir, 'config.json'), JSON.stringify(config));
    const run = async value => {
      await writeFile(join(taskDir, 'audit.json'), JSON.stringify(value));
      return execFileSync(process.execPath, [script, '--config', join(taskDir, 'config.json'), '--audit', join(taskDir, 'audit.json')], { encoding: 'utf8', stdio: 'pipe' });
    };
    await check(audit, run);
  } finally {
    // 只清理测试创建的隔离 Git 夹具。
    await rm(taskDir, { recursive: true, force: true });
  }
}

const offsetPatch = '--- a/data.txt\n+++ b/data.txt\n@@ -1,3 +1,3 @@\n one\n-two\n+TWO\n three\n';
const fuzzPatch = '--- a/data.txt\n+++ b/data.txt\n@@ -1,5 +1,5 @@\n old\n one\n-two\n+TWO\n three\n four\n';

test('真实 patch 偏移不能被普通输出隐藏并误判通过', async () => {
  await fixture('prefix\none\ntwo\nthree\nfour\n', offsetPatch, async (audit, run) => {
    await assert.rejects(run(audit), /偏移或模糊匹配与核定记录不一致/);
  });
});

test('真实 patch 模糊匹配必须拒绝未核定记录', async () => {
  await fixture('changed\none\ntwo\nthree\nfour\nfive\n', fuzzPatch, async (audit, run) => {
    await assert.rejects(run(audit), /偏移或模糊匹配与核定记录不一致/);
  });
});

test('无偏移补丁仍可通过实际回放', async () => {
  await fixture('one\ntwo\nthree\nfour\n', offsetPatch, async (audit, run) => {
    assert.equal(JSON.parse(await run(audit)).patch_count, 1);
  });
});

test('已核定偏移仅接受精确匹配与最终字节，变化或缺失均拒绝', async () => {
  await fixture('prefix\none\ntwo\nthree\nfour\n', offsetPatch, async (audit, run) => {
    audit.hunk_adjustments = { sample: [{ file: 'data.txt', hunk: 1, line: 2, fuzz: 0, offset: 1 }] };
    audit.patched_sha256 = { 'data.txt': createHash('sha256').update('prefix\none\nTWO\nthree\nfour\n').digest('hex') };
    const result = JSON.parse(await run(audit));
    assert.deepEqual(result.patches[0].hunks, audit.hunk_adjustments.sample);
    assert.equal(result.final_files[0].sha256, audit.patched_sha256['data.txt']);
    const changed = structuredClone(audit); changed.hunk_adjustments.sample[0].offset = 2;
    await assert.rejects(run(changed), /匹配与核定记录不一致/);
    const wrongBytes = structuredClone(audit); wrongBytes.patched_sha256['data.txt'] = '0'.repeat(64);
    await assert.rejects(run(wrongBytes), /补丁后内容与核定 SHA256 不一致/);
    const missingBytes = structuredClone(audit); delete missingBytes.patched_sha256;
    await assert.rejects(run(missingBytes), /缺少补丁后内容的核定 SHA256/);
  });
});

test('已核定模糊匹配不等于任意模糊匹配可通过', async () => {
  await fixture('changed\none\ntwo\nthree\nfour\nfive\n', fuzzPatch, async (audit, run) => {
    audit.hunk_adjustments = { sample: [{ file: 'data.txt', hunk: 1, line: 1, fuzz: 1, offset: 0 }] };
    audit.patched_sha256 = { 'data.txt': createHash('sha256').update('changed\none\nTWO\nthree\nfour\nfive\n').digest('hex') };
    assert.equal(JSON.parse(await run(audit)).patches[0].hunks[0].fuzz, 1);
    audit.hunk_adjustments.sample[0].fuzz = 2;
    await assert.rejects(run(audit), /匹配与核定记录不一致/);
  });
});

test('审计不能留下未应用补丁名下的匹配记录', async () => {
  await fixture('one\ntwo\nthree\nfour\n', offsetPatch, async (audit, run) => {
    audit.hunk_adjustments = { never_applied: [{ file: 'data.txt', hunk: 1, line: 1, fuzz: 1, offset: 0 }] };
    audit.patched_sha256 = { 'data.txt': createHash('sha256').update('one\nTWO\nthree\nfour\n').digest('hex') };
    await assert.rejects(run(audit), /未消费的补丁匹配记录/);
  });
});
