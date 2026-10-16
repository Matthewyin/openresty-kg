import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { extractCommands, stripComments } from './inventory.mjs';

const identity = record => `${record.module}/${record.name}`;
const fields = (original, record) => JSON.stringify([record.module, record.name, record.context_flags, record.compile_guards,
  stripComments(original.split('\n').slice(record.line - 1, record.end_line).join('\n')).replace(/\s/g, '').replace(/,$/, '')]);

export function registrationChanges(before, after, file, component) {
  const oldRecords = extractCommands(before, file, component);
  const records = extractCommands(after, file, component);
  for (const collection of [oldRecords, records]) {
    if (new Set(collection.map(identity)).size !== collection.length) throw new Error(`${file}: 重复注册身份无法支持`);
  }
  const previous = new Map(oldRecords.map(record => [identity(record), record]));
  const current = new Map(records.map(record => [identity(record), record]));
  for (const old of oldRecords) {
    const actual = current.get(identity(old));
    if (!actual || fields(after, actual) !== fields(before, old)) throw new Error(`${identity(old)}: 未支持的发行补丁注册删除或字段变化`);
  }
  return { oldRecords, added: records.filter(item => !previous.has(identity(item))) };
}

export async function redisPatchScope({ root, config, show, mainRevision }) {
  const audit = JSON.parse(await readFile(resolve(root, config.redis_patch_audit), 'utf8'));
  const source = config.sources.find(item => item.component === audit.component);
  if (!source || audit.openresty_version !== config.openresty_version || audit.openresty_revision !== mainRevision
    || audit.version !== source.version || audit.revision !== source.revision || !Array.isArray(audit.patches) || !audit.patches.length
    || !Array.isArray(audit.targets) || !audit.targets.length) throw new Error('Redis 补丁核定与固定来源不一致');
  const repo = resolve(root, source.path);
  if (execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== audit.revision) throw new Error('Redis 补丁原始 revision 不一致');
  if (audit.processing?.file !== 'util/mirror-tarballs' || !Number.isInteger(audit.processing.start_line)
    || !Number.isInteger(audit.processing.end_line) || audit.processing.start_line < 1
    || audit.processing.end_line < audit.processing.start_line) throw new Error('Redis 发行处理段无效');
  const processing = show(resolve(root, config.main_repo), mainRevision, audit.processing.file)
    .split('\n').slice(audit.processing.start_line - 1, audit.processing.end_line).join('\n');
  const chain = [...processing.matchAll(/^patch -p1 < \$root\/patches\/ngx_http_redis-\$ver-([\w]+)\.patch/mg)]
    .map(([, name]) => `patches/ngx_http_redis-${source.version}-${name}.patch`);
  const conditional = processing.match(/answer=`\$root\/util\/ver-ge "\$main_ver" 1\.23\.0`\nif \[ "\$answer" = "Y" \]; then\n([\s\S]*?)\nfi(?:\n|$)/);
  if (!processing.includes(`ver=${source.version}`) || !conditional
    || !conditional[1].includes('patch -p1 < $root/patches/ngx_http_redis-$ver-remove_content_encoding.patch || exit 1')
    || config.openresty_version.split('.').slice(0, 2).map(Number).reduce((major, minor) => major * 1000 + minor) < 1023
    || JSON.stringify(chain) !== JSON.stringify(audit.patches.map(item => item.file))) throw new Error('Redis 有效发行处理链未闭合');
  const directory = await mkdtemp(join(tmpdir(), 'redis-registration-diff-'));
  try {
    execFileSync('tar', ['-xf', '-', '-C', directory], { input: execFileSync('git', ['-C', repo, 'archive', audit.revision]) });
    const targets = new Set();
    for (const item of audit.patches) {
      if (typeof item.file !== 'string' || !/^patches\/[\w.-]+\.patch$/.test(item.file)) throw new Error('Redis 补丁路径无效');
      const patch = show(resolve(root, config.main_repo), mainRevision, item.file);
      for (const [, target] of patch.matchAll(/^\+\+\+\s+([^\s]+)/gm)) {
        const file = target.split('/').slice(1).join('/');
        if (!file || file.split('/').includes('..')) throw new Error('Redis 补丁目标无效');
        targets.add(file);
      }
      const output = execFileSync('patch', ['-p1', '--verbose', '--batch', '--forward'], {
        cwd: directory, input: patch, encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' },
      });
      const hunks = [...output.matchAll(/^Hunk #(\d+) succeeded at (\d+)(?: with fuzz (\d+))?(?: \(offset (-?\d+) lines?\))?\.$/gm)]
        .map(([, hunk, line, fuzz, offset]) => ({ hunk: Number(hunk), line: Number(line), fuzz: Number(fuzz ?? 0), offset: Number(offset ?? 0) }));
      if (hunks.length !== [...patch.matchAll(/^@@ /gm)].length || JSON.stringify(hunks) !== JSON.stringify(item.hunks)) throw new Error(`${item.file}: Redis 补丁匹配记录与核定不一致`);
    }
    if (JSON.stringify([...targets].sort()) !== JSON.stringify(audit.targets.map(item => item.file).sort())) throw new Error('Redis 补丁目标集合未闭合');
    for (const target of audit.targets) {
      const after = await readFile(join(directory, target.file), 'utf8');
      if (createHash('sha256').update(after).digest('hex') !== target.sha256) throw new Error('Redis 补丁回放摘要不一致');
      const { added } = registrationChanges(show(repo, audit.revision, target.file), after, target.file, source.component);
      if (added.length) throw new Error('Redis 存在尚未支持的补丁新增注册');
    }
    return { ...audit, added: [], removed: [], changed: [] };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function nginxPatchRegistrations({ root, config, configPath, show, mainRevision, existingDirectives }) {
  const auditPath = resolve(root, config.nginx_patch_audit);
  const audit = JSON.parse(await readFile(auditPath, 'utf8'));
  const source = config.sources.find(item => item.component === 'nginx');
  const repo = resolve(root, source.path);
  const revision = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (audit.openresty_revision !== mainRevision || audit.nginx_revision !== revision
    || audit.openresty_version !== config.openresty_version || audit.nginx_version !== source.version) throw new Error('补丁注册审计与固定来源不一致');
  const identities = new Set();
  for (const record of existingDirectives) {
    if (identities.has(identity(record))) throw new Error('既有 Nginx 注册身份重复');
    identities.add(identity(record));
  }
  // 复用已核定的匹配及最终内容门禁，不能只凭补丁文件存在推定生效。
  const verified = JSON.parse(execFileSync(process.execPath, [resolve(import.meta.dirname, '../analysis/verify-nginx-patches.mjs'),
    '--config', configPath, '--audit', auditPath], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
  const directory = await mkdtemp(join(tmpdir(), 'openresty-registration-diff-'));
  try {
    execFileSync('tar', ['-xf', '-', '-C', directory], { input: execFileSync('git', ['-C', repo, 'archive', revision], { maxBuffer: 40 * 1024 * 1024 }) });
    const patches = [];
    for (const name of audit.patches) {
      const file = `patches/nginx-${source.version}-${name}.patch`;
      const original = show(resolve(root, config.main_repo), mainRevision, file);
      let applied = original;
      for (const replacement of audit.substitutions[name] ?? []) applied = applied.replaceAll(replacement.from, replacement.to);
      execFileSync('patch', ['-p1', '--batch', '--forward'], { cwd: directory, input: applied, encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } });
      patches.push({ file, original });
    }
    const directives = [];
    const differences = [];
    for (const { file, sha256 } of verified.final_files) {
      const after = await readFile(join(directory, file), 'utf8');
      if (createHash('sha256').update(after).digest('hex') !== sha256) throw new Error(`${file}: 注册回放内容不符合核定摘要`);
      if (!/\.(?:c|h)$/.test(file)) continue;
      const before = show(repo, revision, file);
      const { oldRecords, added } = registrationChanges(before, after, file, source.component);
      for (const record of added) {
        if (!record.module_verified) throw new Error(`${identity(record)}: 补丁后注册 owner 未核实`);
        if (identities.has(identity(record))) throw new Error(`${identity(record)}: 补丁新增与完整目录的注册身份冲突`);
        identities.add(identity(record));
        const candidates = [];
        for (const patch of patches) {
          const lines = patch.original.split('\n');
          for (const [index, line] of lines.entries()) {
            if (!/^\+\s*\{\s*ngx_string\s*\(/.test(line)) continue;
            let end = index;
            while (end < lines.length && lines[end].startsWith('+') && !/\},?\s*$/.test(lines[end])) end++;
            if (end === lines.length || !lines[end].startsWith('+')) continue;
            const entry = lines.slice(index, end + 1).map(value => value.slice(1)).join('\n');
            const fragment = `ngx_command_t additions[] = {\n${entry}\n};\nngx_module_t ${record.module} = { NGX_MODULE_V1, NULL, additions };`;
            const parsed = extractCommands(fragment, patch.file, source.component, {});
            if (parsed.length === 1 && fields(fragment, parsed[0]) === fields(after, record)) candidates.push({ ...patch, start: index + 1, end: end + 1 });
          }
        }
        if (candidates.length !== 1) throw new Error(`${identity(record)}: 无法唯一关联真实补丁注册原文`);
        const patch = candidates[0];
        const owner = oldRecords.find(item => item.module === record.module && item.module_verified);
        if (!owner) throw new Error(`${identity(record)}: 上游没有可核对的正式 module owner`);
        const lines = before.split('\n');
        let ownerEnd = owner.module_line - 1;
        while (ownerEnd < lines.length && !/^\s*\};/.test(lines[ownerEnd])) ownerEnd++;
        if (ownerEnd === lines.length) throw new Error(`${identity(record)}: 正式 owner 范围未闭合`);
        directives.push({ ...record, file: patch.file, line: patch.start, end_line: patch.end,
          module_line: owner.module_line, module_file: file, registration_component: 'openresty',
          registration_evidence: [{ id: 'module-owner', component: source.component, file,
            start_line: owner.module_line, end_line: ownerEnd + 1 }],
          distribution_patch: { file: patch.file, target_file: file, patched_sha256: sha256 },
          version: source.version, revision, repository: 'https://github.com/nginx/nginx', local_path: source.path });
        differences.push({ module: record.module, name: record.name, patch: patch.file, target_file: file, patched_sha256: sha256 });
      }
    }
    return { directives, scope: { openresty_revision: mainRevision, nginx_revision: revision,
      patches: verified.patches.map(patch => patch.file), added: differences,
      removed: [], changed: [], final_files: verified.final_files } };
  } finally {
    // 只清理本次回放副本，不触碰用户固定来源仓库。
    await rm(directory, { recursive: true, force: true });
  }
}
