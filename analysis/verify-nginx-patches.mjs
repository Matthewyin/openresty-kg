import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const argument = name => args[args.indexOf(name) + 1];
if (!args.includes('--config') || !args.includes('--audit')) throw new Error('需要 --config 和 --audit');
const configPath = resolve(argument('--config'));
const root = dirname(configPath);
const config = JSON.parse(await readFile(configPath, 'utf8'));
const audit = JSON.parse(await readFile(resolve(argument('--audit')), 'utf8'));
if (audit.openresty_version !== config.openresty_version) throw new Error('审计与项目版本不一致');
for (const name of Object.keys(audit.hunk_adjustments ?? {})) {
  if (!audit.patches.includes(name)) throw new Error(`${name}: 存在未消费的补丁匹配记录`);
}
const nginx = config.sources.find(source => source.component === 'nginx');
const nginxRepo = resolve(root, nginx.path);
const openrestyRepo = resolve(root, config.main_repo);
const show = (repo, revision, file) => execFileSync('git', ['-C', repo, 'show', `${revision}:${file}`], { encoding: 'utf8' });
const taskDir = await mkdtemp(join(tmpdir(), 'nginx-patch-audit-'));
try {
  execFileSync('tar', ['-xf', '-', '-C', taskDir], { input: execFileSync('git', ['-C', nginxRepo, 'archive', audit.nginx_revision], { maxBuffer: 40 * 1024 * 1024 }) });
  const patches = [];
  for (const name of audit.patches) {
    const file = `patches/nginx-${audit.nginx_version}-${name}.patch`;
    let patch = show(openrestyRepo, audit.openresty_revision, file);
    for (const replacement of audit.substitutions[name] ?? []) patch = patch.replaceAll(replacement.from, replacement.to);
    const output = execFileSync('patch', ['-p1', '--verbose', '--batch', '--forward'], {
      cwd: taskDir, input: patch, encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' },
    });
    const hunks = [];
    let patchedFile;
    for (const line of output.split('\n')) {
      const header = line.match(/^Patching file (?:'([^']+)'|(\S+)) using /) ?? line.match(/^patching file (.+)$/);
      if (header) patchedFile = header[1] ?? header[2];
      const hunk = line.match(/^Hunk #(\d+) succeeded at (\d+)(?: with fuzz (\d+))?(?: \(offset (-?\d+) lines?\))?\.$/);
      if (hunk) {
        if (!patchedFile) throw new Error(`${file}: 缺少补丁目标文件匹配记录`);
        hunks.push({ file: patchedFile, hunk: Number(hunk[1]), line: Number(hunk[2]), fuzz: Number(hunk[3] ?? 0), offset: Number(hunk[4] ?? 0) });
      }
    }
    if (hunks.length !== [...patch.matchAll(/^@@ /gm)].length) throw new Error(`${file}: 详细补丁匹配记录不完整`);
    const adjustments = hunks.filter(hunk => hunk.fuzz || hunk.offset);
    if (JSON.stringify(adjustments) !== JSON.stringify(audit.hunk_adjustments?.[name] ?? [])) {
      throw new Error(`${file}: 偏移或模糊匹配与核定记录不一致\n${JSON.stringify(adjustments)}`);
    }
    patches.push({ file, hunks, files: [...patch.matchAll(/^\+\+\+\s+([^\s]+)/gm)].map(match => match[1].split('/').slice(1).join('/')) });
  }
  const targets = [];
  for (const target of audit.targets) {
    const unchanged = show(nginxRepo, audit.nginx_revision, target.file) === await readFile(join(taskDir, target.file), 'utf8');
    if (unchanged !== target.unchanged) throw new Error(`${target.file}: 与审计记录不一致`);
    targets.push({ ...target, patches: patches.filter(patch => patch.files.includes(target.file)).map(patch => patch.file) });
  }
  const finalFiles = [];
  if (audit.hunk_adjustments) {
    for (const file of new Set([...patches.flatMap(patch => patch.files), ...audit.targets.map(target => target.file)])) {
      if (!/^[a-f0-9]{64}$/.test(audit.patched_sha256?.[file] ?? '')) throw new Error(`${file}: 缺少补丁后内容的核定 SHA256`);
    }
  }
  for (const [file, expected] of Object.entries(audit.patched_sha256 ?? {})) {
    const sha256 = createHash('sha256').update(await readFile(join(taskDir, file))).digest('hex');
    if (sha256 !== expected) throw new Error(`${file}: 补丁后内容与核定 SHA256 不一致`);
    finalFiles.push({ file, sha256 });
  }
  console.log(JSON.stringify({ openresty_revision: audit.openresty_revision, nginx_revision: audit.nginx_revision, patch_count: patches.length, patches, targets, final_files: finalFiles }, null, 2));
} finally {
  // 只删除本次 mkdtemp 创建的隔离源码副本，保留用户仓库。
  await rm(taskDir, { recursive: true, force: true });
}
