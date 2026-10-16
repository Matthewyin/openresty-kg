import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { nginxPatchRegistrations, redisPatchScope } from './distribution-registrations.mjs';
import { reviewRegistrationBuild } from './registration-build.mjs';
import { validSource } from '../src/core/source.mjs';

export function stripComments(text) {
  return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, value =>
    value.startsWith('/*') || value.startsWith('//') ? value.replace(/[^\n]/g, ' ') : value);
}

function closingBrace(text, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return i;
  }
  throw new Error('命令注册数组的括号未闭合');
}

function fieldsOf(text) {
  const fields = [];
  let start = 0;
  let nesting = 0;
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if ('({['.includes(char)) nesting++;
    else if (')}]'.includes(char)) nesting--;
    else if (char === ',' && nesting === 0) { fields.push(text.slice(start, i).trim()); start = i + 1; }
  }
  fields.push(text.slice(start).trim());
  const normalized = fields.map(value => value.replace(/^\s*#.*$/gm, '').replace(/\s+/g, ' ').trim());
  if (normalized.at(-1) === '') normalized.pop();
  return normalized;
}

function guardsAt(text, offset) {
  const guards = [];
  for (const line of text.slice(0, offset).split('\n')) {
    const match = line.match(/^\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b(.*)/);
    if (!match) continue;
    const [, kind, expression] = match;
    if (['if', 'ifdef', 'ifndef'].includes(kind)) guards.push({ initial: `${kind} ${expression.trim()}`, current: `${kind} ${expression.trim()}` });
    else if (kind === 'endif') guards.pop();
    else if (guards.length) guards.at(-1).current = `${kind} ${expression.trim()} [原分支: ${guards.at(-1).initial}]`;
  }
  return guards.map(guard => guard.current);
}

export function extractCommands(original, file, component, input = null) {
  const clean = stripComments(original);
  const records = [];
  const ownerFile = input?.owner_file ?? file;
  const ownerClean = input?.owner_original === undefined ? clean : stripComments(input.owner_original);
  const consumedIncludes = new Set();
  const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;
  const evidence = (id, path, text, start, end) => ({ id, file: path, start_line: lineAt(text, start), end_line: lineAt(text, end) });
  const arrays = clean.matchAll(/\bngx_command_t\s+(\w+)\s*\[[^\]]*\]\s*=\s*\{/g);
  for (const array of arrays) {
    const start = array.index + array[0].length - 1;
    const end = closingBrace(clean, start);
    const owners = [...ownerClean.matchAll(/\bngx_module_t\s+(\w+)\s*=\s*\{/g)].filter(owner => {
      const bodyStart = owner.index + owner[0].length - 1;
      const fields = fieldsOf(ownerClean.slice(bodyStart + 1, closingBrace(ownerClean, bodyStart)));
      return fields[0] === 'NGX_MODULE_V1' && fields[2] === array[1]
        || !input && fields.length === 1 && fields[0] === array[1];
    });
    if (input && owners.length !== 1) throw new Error(`${file}: 正式 commands 字段无法唯一核实 owner`);
    const registrationEvidence = [];
    const ownerGuards = input ? guardsAt(ownerClean, owners[0].index) : [];
    if (input) {
      const owner = owners[0];
      registrationEvidence.push(evidence('module-owner', ownerFile, ownerClean, owner.index,
        closingBrace(ownerClean, owner.index + owner[0].length - 1)));
      if (ownerFile !== file) {
        const links = [...ownerClean.matchAll(/^\s*#\s*include\s*[<"]([^>"\n]+)[>"][^\S\n]*$/gm)]
          .filter(link => link[1] === file.split('/').at(-1));
        if (links.length !== 1) throw new Error(`${file}: owner 文件未唯一包含注册容器`);
        const link = links[0];
        const offset = link.index + link[0].indexOf('#');
        ownerGuards.push(...guardsAt(ownerClean, offset));
        registrationEvidence.push(evidence('owner-include', ownerFile, ownerClean, offset, offset + link[0].trimStart().length - 1));
      }
      registrationEvidence.push(evidence('registration-container', file, clean, array.index, end));
    }
    const parseEntries = (text, path, from, to, inheritedGuards = [], localDefines = []) => {
      let cursor = from;
      while (cursor < to) {
        if (/\s|,/.test(text[cursor])) { cursor++; continue; }
        if (text[cursor] === '#') {
          const directive = text.slice(cursor, to).match(/^#\s*(if|ifdef|ifndef|elif|else|endif)\b[^\n]*(?:\n|$)/);
          if (directive) { cursor += directive[0].length; continue; }
          // 仅支持正式数组中临时定义、包含片段、随即取消定义的已核形态。
          const include = text.slice(cursor, to).match(/^#\s*define\s+(\w+)\s+1[^\S\n]*\n\s*#\s*include\s*[<"]([^>"\n]+)[>"][^\S\n]*\n\s*#\s*undef\s+\1[^\S\n]*(?:\n|$)/);
          const target = include && input?.includes?.[include[2]];
          if (!target || consumedIncludes.has(include[2])) throw new Error(`${path}: 未支持、重复或未配置的命令 include/宏定义`);
          consumedIncludes.add(include[2]);
          const fragment = stripComments(target.original);
          const branch = fragment.match(/^\s*#\s*if\s*\(\s*(\w+)\s*\)[^\S\n]*\n/);
          const alternate = fragment.match(/^\s*#\s*else[^\S\n]*$/m);
          const terminal = fragment.match(/^\s*#\s*endif[^\S\n]*\s*$/m);
          if (!branch || branch[1] !== include[1] || !alternate || !terminal
            || terminal.index < alternate.index
            || /^\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b/m.test(fragment.slice(branch[0].length, alternate.index))) {
            throw new Error(`${target.file}: 未支持的 include 片段条件结构`);
          }
          const before = records.length;
          parseEntries(fragment, target.file, branch[0].length, alternate.index,
            [...inheritedGuards, ...guardsAt(text, cursor)],
            [{ name: include[1], value: '1', file: path, line: lineAt(text, cursor), temporary: true }]);
          if (records.length === before) throw new Error(`${target.file}: include 片段没有可核实注册`);
          cursor += include[0].length;
          continue;
        }
        const sentinel = text.slice(cursor, to).match(/^ngx_null_command\b/);
        if (sentinel) { cursor += sentinel[0].length; continue; }
        if (text[cursor] !== '{') throw new Error(`${path}:${lineAt(text, cursor)}: 未支持的命令注册表达式 ${text.slice(cursor, to).split('\n')[0].trim()}`);
        const entryEnd = closingBrace(text, cursor);
        if (entryEnd >= to) throw new Error(`${path}: 注册项跨越容器或片段范围`);
        if ([...text.slice(cursor, entryEnd).matchAll(/^\s*#\s*(\w+)/gm)]
          .some(match => !['if', 'ifdef', 'ifndef', 'elif', 'else', 'endif'].includes(match[1]))) {
          throw new Error(`${path}: 注册项内存在未支持的 include/宏定义`);
        }
        const fields = fieldsOf(text.slice(cursor + 1, entryEnd));
        const named = fields[0]?.match(/^ngx_string\s*\(\s*"([^"\\]+)"\s*\)$/);
        if (named) {
          if (input && !/^NGX_[A-Z0-9_]+(?:\s*\|\s*NGX_[A-Z0-9_]+)*$/.test(fields[1] ?? '')) {
            throw new Error(`${path}: 未支持的命令标志表达式 ${fields[1]}`);
          }
          const internalGuards = [...text.slice(cursor, entryEnd).matchAll(/^\s*#\s*(if|ifdef|ifndef|elif|else)\b(.*)$/gm)].map(match => `${match[1]} ${match[2].trim()}`);
          // 条件分支中的两个 offsetof 会重复计数；保留分支，不假设当前环境启用哪一侧。
          if (fields.length < 6 || (fields.length !== 6 && !internalGuards.length) || fields.some(field => !field)) throw new Error(`${path}: ${named[1]} 注册字段数量或内容异常，需要人工核对`);
          records.push({
            name: named[1], component, module: owners.length === 1 ? owners[0][1] : array[1].replace(/_(?:cmds|commands)$/, '_module'),
            module_verified: owners.length === 1,
            module_line: owners.length === 1 ? lineAt(ownerClean, owners[0].index) : null,
            ...(input ? { module_file: ownerFile, registration_evidence: registrationEvidence,
              ...(localDefines.length ? { registration_defines: localDefines } : {}) } : {}),
            array: array[1], file: path, line: lineAt(text, cursor),
            end_line: lineAt(text, entryEnd),
            context_flags: [...fields[1].matchAll(/\bNGX_[A-Z_]+_CONF\b/g)].map(match => match[0]),
            flags: fields[1], callback: fields[2], post: fields.at(-1),
            compile_guards: [...inheritedGuards, ...guardsAt(text, cursor), ...internalGuards], verification: 'registration_only'
          });
        } else if (input || fields.length !== 1 || fields[0] !== 'ngx_null_command') {
          throw new Error(`${path}: 存在未支持的命令名称表达式 ${fields[0]}`);
        }
        cursor = entryEnd + 1;
      }
    };
    parseEntries(clean, file, start + 1, end, ownerGuards);
  }
  if (input) {
    if (!records.length) throw new Error(`${file}: 正式输入没有可核实注册`);
    for (const header of Object.keys(input.includes ?? {})) {
      if (!consumedIncludes.has(header)) throw new Error(`${file}: 未消费的 include 映射 ${header}`);
    }
  }
  return records;
}

export function componentMatrix(script, mainVersion) {
  let version = '';
  const components = [];
  for (const [index, line] of script.split('\n').entries()) {
    const assignment = line.match(/^ver=(.*)$/);
    if (assignment) version = assignment[1].replaceAll('"', '').replace('$main_ver', mainVersion);
    if (!line.startsWith('$root/util/get-tarball ')) continue;
    const url = line.match(/get-tarball\s+"([^"]+)"/)[1].replaceAll('$ver', version);
    const archive = line.match(/-O\s+"?([^\s"]+)/)[1].replaceAll('$ver', version);
    const github = url.match(/^https:\/\/github.com\/([^/]+\/[^/]+)\/(?:tarball|archive)\/(.*)$/);
    const name = github ? github[1].split('/')[1] : archive.replace(`-${version}.tar.gz`, '');
    const likelyC = name === 'nginx' || /nginx-module|ngx_devel_kit|ngx_postgres|ngx_coolkit/.test(name);
    components.push({ component: name, version, download_url: url, repository: github ? `https://github.com/${github[1]}` : null,
      tag: github ? github[2].replace(/\.tar\.gz$/, '') : null, source_line: index + 1,
      role: likelyC ? 'configuration-source-candidate' : 'library-or-tool',
      directive_scope: 'pending', inspection: 'not_inspected' });
  }
  return components;
}

async function verifyArchive(root, source, expected, directory, revision) {
  const proof = source.archive_evidence;
  if (!proof || proof.url !== expected.download_url || typeof proof.path !== 'string' || !proof.path
    || !/^[a-f0-9]{64}$/.test(proof.sha256 ?? '') || !Array.isArray(proof.files) || !proof.files.length) {
    throw new Error(`${source.component}: 缺失或无效的 archive_evidence`);
  }
  const archive = resolve(root, proof.path);
  if (createHash('sha256').update(await readFile(archive)).digest('hex') !== proof.sha256) throw new Error(`${source.component}: 归档 SHA-256 不一致`);
  const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n');
  const types = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8' }).trim().split('\n');
  if (types.length !== entries.length || types.some(line => !['-', 'd'].includes(line[0]))
    || entries.some(path => !/^[A-Za-z0-9_./-]+$/.test(path) || path.startsWith('/') || path.split('/').some(part => part === '..' || part === '.'))) {
    throw new Error(`${source.component}: 归档存在未支持的条目类型或路径`);
  }
  const prefix = entries[0].split('/')[0] + '/';
  if (entries.some(path => !path.startsWith(prefix))) throw new Error(`${source.component}: 归档目录结构不一致`);
  const actual = entries.filter(path => !path.endsWith('/')).map(path => {
    // 只把归档成员读到 stdout，不解包到任何源码目录。
    const data = execFileSync('tar', ['-xOf', archive, '--', path], { maxBuffer: 8 * 1024 * 1024 });
    return { path: path.slice(prefix.length), sha: createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex') };
  });
  const tree = execFileSync('git', ['-C', directory, 'ls-tree', '-r', revision], { encoding: 'utf8' }).trim().split('\n').map(line => {
    const match = line.match(/^100(?:644|755) blob ([a-f0-9]{40})\t(.+)$/);
    if (!match) throw new Error(`${source.component}: Git 固定树存在未支持的条目`);
    return { path: match[2], sha: match[1] };
  });
  const normalize = files => [...files].sort((a, b) => a.path.localeCompare(b.path));
  if (proof.files.some(file => typeof file?.path !== 'string' || !/^[a-f0-9]{40}$/.test(file.sha ?? ''))
    || new Set(actual.map(file => file.path)).size !== actual.length
    || JSON.stringify(normalize(actual)) !== JSON.stringify(normalize(proof.files))
    || JSON.stringify(normalize(tree)) !== JSON.stringify(normalize(proof.files))) {
    throw new Error(`${source.component}: 归档、完整文件清单与 Git 固定树不一致`);
  }
  const origin = execFileSync('git', ['-C', directory, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim().replace(/\.git$/, '');
  if (origin !== source.repository) throw new Error(`${source.component}: 归档桥 repository 与真实 Git 来源不一致`);
  return { ...proof, path: source.archive_evidence.path, revision, repository: source.repository, tree_matches: true };
}

function reviewScope(source, paths, read, mainRevision, readMain) {
  const review = source.scope_review;
  const required = {
    nginx_lua_api_module: ['build-entry', 'module-owner', 'api-entry'],
    lua_c_extension: ['build-entry', 'installation', 'api-entry'],
    lua_ffi_library: ['build-entry', 'installation', 'api-entry', 'native-entry'],
    lua_runtime: ['build-entry', 'installation', 'api-entry', 'vm-entry'],
    lua_reference_library: ['installation', 'api-entry'],
    cli_tool: ['distribution-install', 'cli-entry']
  };
  if (!review || !Object.hasOwn(required, review.classification) || !Array.isArray(review.evidence)
    || review.evidence.length !== required[review.classification].length || source.registration_inputs !== undefined) {
    throw new Error(`${source.component}: scope_review 分类、证据或输入组合无效`);
  }
  const byId = new Map();
  const evidence = review.evidence.map(item => {
    const component = item?.component ?? source.component;
    if (!item || !required[review.classification].includes(item.id) || byId.has(item.id)
      || ![source.component, 'openresty'].includes(component)
      || (component === 'openresty' && item.id !== 'distribution-install')
      || typeof item.file !== 'string' || !item.file || item.file.startsWith('/') || item.file.split('/').some(part => !part || part === '.' || part === '..')
      || (component === source.component && !paths.includes(item.file))) throw new Error(`${source.component}: scope_review 证据身份或文件无效`);
    const text = component === 'openresty' ? readMain(item.file) : read(item.file);
    const lines = text.split('\n');
    if (!Number.isInteger(item.start_line) || !Number.isInteger(item.end_line) || item.start_line < 1
      || item.end_line < item.start_line || item.end_line > lines.length) throw new Error(`${source.component}: scope_review 证据范围无效`);
    const record = { ...item, component, ...(component === 'openresty' ? { revision: mainRevision } : {}), code: lines.slice(item.start_line - 1, item.end_line).join('\n') };
    byId.set(item.id, record);
    return record;
  });
  const code = id => byId.get(id)?.code ?? '';
  const api = byId.get('api-entry');
  const build = code('build-entry');
  const installation = code('installation');
  let valid = false;
  if (review.classification === 'nginx_lua_api_module') {
    const initializer = stripComments(code('module-owner')).match(/\bngx_module_t\s+(\w+)\s*=\s*\{/);
    if (initializer) {
      const clean = stripComments(code('module-owner'));
      const start = initializer.index + initializer[0].length - 1;
      const fields = fieldsOf(clean.slice(start + 1, closingBrace(clean, start)));
      valid = fields[0] === 'NGX_MODULE_V1' && fields[2] === 'NULL' && build.includes(initializer[1])
        && build.includes(api.file) && /ngx_module_srcs|NGX_ADDON_SRCS/.test(build)
        && /\bngx_http_lua_add_package_preload\s*\([^;]+"[^"\n]+"/.test(code('api-entry'));
    }
  } else if (review.classification === 'lua_c_extension') {
    const apiFile = api.file.split('/').at(-1);
    valid = /\bluaopen_\w+\s*\(\s*lua_State\s*\*[^)]*\)\s*\{/.test(stripComments(code('api-entry')))
      && (build.includes(api.file) || build.includes(apiFile.replace(/\.c$/, '.o')))
      && /\bshared\b|\bMODULE\b/.test(build) && /^install\s*:/m.test(installation)
      && /LUA_(?:C?MODULE|LIB)_DIR/.test(installation) && /\.so|\$\(TARGET\)/.test(installation);
  } else if (review.classification === 'lua_ffi_library') {
    const native = byId.get('native-entry');
    const declaration = code('api-entry').match(/\bint\s+(\w+)\s*\([^;]+\);/);
    const library = build.match(/\bC_SO_NAME\s*:?=\s*(\w+\.so)/);
    valid = Boolean(declaration && library && /ffi\.cdef/.test(code('api-entry')) && /ffi\.load\s*\(/.test(code('api-entry'))
      && code('api-entry').includes(library[1]) && build.includes(native.file) && /-shared/.test(build)
      && new RegExp(`\\b${declaration[1]}\\s*\\([^)]*\\)\\s*\\{`).test(stripComments(code('native-entry')))
      && /^install\s*:/m.test(installation) && /LUA_LIB_DIR/.test(installation) && /C_SO_NAME/.test(installation));
  } else if (review.classification === 'lua_runtime') {
    const vm = byId.get('vm-entry');
    const object = file => file.split('/').at(-1).replace(/\.c$/, '.o');
    const vmCode = stripComments(code('vm-entry')).replace(/^\s*#.*$/gm, '');
    valid = api.file.endsWith('.c') && vm.file.endsWith('.c')
      && byId.get('build-entry').file === `${api.file.slice(0, api.file.lastIndexOf('/'))}/Makefile`
      && vm.file.slice(0, vm.file.lastIndexOf('/')) === api.file.slice(0, api.file.lastIndexOf('/'))
      && build.includes(object(api.file)) && build.includes(object(vm.file))
      && /\bint\s+main\s*\([^)]*\)\s*\{/.test(stripComments(code('api-entry')))
      && /\blua_open\s*\(\s*\)/.test(code('api-entry'))
      && /^#if LJ_64\b[\s\S]*\blj_state_newstate\s*\([^)]*\)\s*#else[\s\S]*\blua_newstate\s*\([^)]*\)\s*#endif/m.test(code('vm-entry'))
      && /\blua_State\s*\*\s*lua_newstate\s*\(\s*lua_Alloc\b[^)]*\)\s*\{/.test(vmCode)
      && /\bLJVMCORE_O\s*=\s*\$\(LJVM_O\)\s+\$\(LJCORE_O\)/.test(build)
      && /\$\(LJVM_BOUT\):\s*\$\(BUILDVM_T\)/.test(build)
      && /\$\(BUILDVM_X\) -m \$\(LJVM_MODE\) -o \$@/.test(build)
      && /host\/buildvm_arch\.h:\s*\$\(DASM_DASC\)/.test(build)
      && /\$\(LUAJIT_A\):\s*\$\(LJVMCORE_O\)/.test(build)
      && /\$\(LUAJIT_SO\):\s*\$\(LJVMCORE_O\)/.test(build)
      && /\$\(LUAJIT_T\):\s*\$\(TARGET_O\)\s+\$\(LUAJIT_O\)\s+\$\(TARGET_DEP\)/.test(build)
      && installation.includes(`INSTALL_DEP= ${api.file.replace(/\.c$/, '')}`)
      && /\$\(MAKE\) -C src/.test(installation) && /^install:\s*\$\(INSTALL_DEP\)/m.test(installation)
      && ['T', 'A', 'SO'].every(suffix => {
        const target = build.match(new RegExp(`^LUAJIT_${suffix}=\\s*(\\S+)`, 'm'))?.[1];
        return target && new RegExp(`^FILE_${suffix}=\\s*${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(installation)
          && installation.includes(`$(FILE_${suffix}) $(INSTALL_`);
      });
  } else if (review.classification === 'lua_reference_library') {
    const luaFiles = paths.filter(file => file.startsWith('lib/') && file.endsWith('.lua'));
    const installs = [...installation.matchAll(/^\s*\$\(INSTALL\) (lib\/[\w/-]+\/\*\.lua) \$\(DESTDIR\)\$\(LUA_LIB_DIR\)\/([\w/-]+)\/?\s*$/gm)];
    const installed = file => installs.some(([, pattern, destination]) => {
      const directory = pattern.slice(0, -5);
      return destination.replace(/\/$/, '') === directory.slice(4, -1)
        && file.startsWith(directory) && !file.slice(directory.length).includes('/');
    });
    const imports = [...code('api-entry').matchAll(/\brequire\s*(?:\(\s*)?["']([\w.]+)["']/g)];
    valid = !paths.some(file => /\.(?:c|h|cc|cpp|cxx|inc|in|tt|erb|tmpl|rl|dasc|s|y|l)$/i.test(file)
        || /(?:^|\/)(?:config|configure)$/.test(file))
      && /^all:\s*;\s*$/m.test(installation) && /^install:\s*all\s*$/m.test(installation)
      && luaFiles.includes(api.file) && luaFiles.every(installed)
      && imports.length > 0 && imports.every(([, module]) => luaFiles.includes(`lib/${module.replaceAll('.', '/')}.lua`))
      && /\breturn\s*\{[^}]+\}/.test(code('api-entry'));
  } else {
    const install = byId.get('distribution-install');
    const entry = byId.get('cli-entry');
    valid = install.component === 'openresty' && install.file === 'util/configure'
      && code('distribution-install').includes(`auto_complete '${source.component}'`)
      && /\$\(INSTALL\) bin\/\*/.test(code('distribution-install')) && entry.file.startsWith('bin/')
      && /^#![^\n]*\bperl\b/m.test(code('cli-entry'))
      && !paths.some(file => /\.(?:c|h|cc|cpp|inc)$/.test(file) && !/^(?:t|test|tests)\//.test(file));
  }
  if (!valid) throw new Error(`${source.component}: scope_review 正向构建/安装与入口证据未闭合`);
  return { classification: review.classification, evidence };
}

export async function inspectExtensionSource(root, source, readBuildSource) {
  const identity = { kind: 'department_extension', repository: source?.repository, revision: source?.revision,
    version: source?.version, version_kind: source?.version_kind, deployment_status: source?.deployment_status };
  if (!validSource(identity) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(source.component ?? '')
    || typeof source.path !== 'string' || !source.path || source.path.startsWith('/')
    || source.path.split('/').some(part => !part || part === '.' || part === '..')
    || source.tag !== undefined || source.registration_build?.entry !== 'config') throw new Error('部门扩展来源配置无效');
  const directory = resolve(root, source.path);
  const git = args => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const revision = git(['rev-parse', 'HEAD']).trim();
  const repository = git(['remote', 'get-url', 'origin']).trim().replace(/\.git$/, '');
  if (revision !== source.revision || repository !== source.repository) throw new Error(`${source.component}: 扩展固定版本或来源不一致`);
  const paths = git(['ls-tree', '-r', '--name-only', revision]).trim().split('\n');
  const get = file => git(['show', `${revision}:${file}`]);
  const nativeFiles = paths.filter(file => /\.(?:c|h|cc|cpp|inc)$/.test(file)
    && !file.split('/').some(part => ['t', 'test', 'tests', 'doc'].includes(part)));
  const inputs = source.registration_inputs;
  if (inputs !== undefined && (!Array.isArray(inputs) || !inputs.length)) throw new Error(`${source.component}: 扩展注册输入无效`);
  const records = inputs === undefined ? nativeFiles.flatMap(file => extractCommands(get(file), file, source.component))
    : inputs.flatMap(input => {
      if (!input || !paths.includes(input.file) || !nativeFiles.includes(input.file) || input.owner_file !== undefined || input.includes !== undefined) throw new Error(`${source.component}: 扩展注册输入形态未支持`);
      return extractCommands(get(input.file), input.file, source.component, {});
    });
  const registrationBuild = await reviewRegistrationBuild({ source,
    read: (file, component) => component === source.component ? get(file) : readBuildSource(file, component), paths, records });
  if (!registrationBuild.complete || registrationBuild.status !== 'verified') throw new Error(`${source.component}: 扩展正式构建范围未闭合`);
  const identities = records.map(record => [record.component, record.module, record.name].join('--'));
  if (new Set(identities).size !== identities.length) throw new Error(`${source.component}: 扩展注册身份重复`);
  return {
    component: { component: source.component, version: source.version, repository, revision, local_path: source.path,
      source: identity, inspection: 'fixed_registration_build_review', registrations: records.length, registration_build: registrationBuild },
    directives: records.map(record => ({ ...record, version: source.version, repository, revision, local_path: source.path, source: identity })),
  };
}

export async function inventory(configPath) {
  const root = resolve(configPath, '..');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const main = resolve(root, config.main_repo);
  const actualTag = execFileSync('git', ['-C', main, 'describe', '--tags', '--exact-match'], { encoding: 'utf8' }).trim();
  if (actualTag !== `v${config.openresty_version}`) throw new Error('主仓库 tag 与配置版本不一致');
  const mainRevision = execFileSync('git', ['-C', main, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const show = (repo, revision, file) => execFileSync('git', ['-C', repo, 'show', `${revision}:${file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const mainVersion = show(main, mainRevision, 'util/ver').match(/^main_ver=(.*)$/m)[1];
  const matrix = componentMatrix(show(main, mainRevision, 'util/mirror-tarballs'), mainVersion);
  const extensionSources = config.department_extensions ?? [];
  if (!Array.isArray(extensionSources) || new Set([...matrix.map(item => item.component), ...extensionSources.map(item => item?.component)]).size !== matrix.length + extensionSources.length) throw new Error('部门扩展组件重复或与发行组件冲突');
  const directives = [];
  const frozenSources = new Map();
  const readBuildSource = (file, component) => {
    if (component === 'openresty') return show(main, mainRevision, file);
    if (!frozenSources.has(component)) {
      const source = [...config.sources, ...extensionSources].find(item => item.component === component);
      if (!source) throw new Error(`${component}: 正式构建证据缺少配置来源`);
      const directory = resolve(root, source.path);
      const revision = execFileSync('git', ['-C', directory, 'rev-parse', source.tag ? `${source.tag}^{commit}` : `${source.revision}^{commit}`], { encoding: 'utf8' }).trim();
      if (source.revision && source.revision !== revision) throw new Error(`${component}: 构建证据固定版本不一致`);
      frozenSources.set(component, { directory, revision });
    }
    const source = frozenSources.get(component);
    return show(source.directory, source.revision, file);
  };
  for (const source of config.sources) {
    const directory = resolve(root, source.path);
    const tag = execFileSync('git', ['-C', directory, 'describe', '--tags', '--exact-match'], { encoding: 'utf8' }).trim();
    if (tag !== source.tag) throw new Error(`${source.component}: tag 不匹配`);
    const expected = matrix.find(item => item.component === source.component);
    if (!expected || expected.version !== source.version) throw new Error(`${source.component}: 与发行版矩阵版本不一致`);
    if (expected.inspection !== 'not_inspected') throw new Error(`${source.component}: 来源配置重复`);
    const revision = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (source.revision !== undefined && source.revision !== revision) throw new Error(`${source.component}: 固定 revision 不一致`);
    let archiveEvidence;
    if (source.repository !== undefined) {
      if (typeof source.repository !== 'string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(source.repository)
        || (expected.repository && source.repository !== expected.repository)) throw new Error(`${source.component}: repository 与发行版来源不一致`);
      if (!expected.repository) archiveEvidence = await verifyArchive(root, source, expected, directory, revision);
    } else if (!expected.repository && source.component !== 'nginx') {
      throw new Error(`${source.component}: 缺少真实 repository 与归档桥证据`);
    }
    if (source.archive_evidence !== undefined && !archiveEvidence) throw new Error(`${source.component}: 未消费的 archive_evidence`);
    const repository = source.repository ?? expected.repository ?? 'https://github.com/nginx/nginx';
    const sourceRecords = [];
    const paths = execFileSync('git', ['-C', directory, 'ls-tree', '-r', '--name-only', revision], { encoding: 'utf8' }).trim().split('\n');
    let nativeFiles;
    if (source.registration_inputs !== undefined) {
      if (!Array.isArray(source.registration_inputs) || !source.registration_inputs.length) throw new Error(`${source.component}: 正式注册输入不能为空`);
      const selected = new Set();
      const validateFile = file => {
        if (typeof file !== 'string' || !file || file.startsWith('/') || file.split('/').some(part => !part || part === '.' || part === '..')
          || !paths.includes(file) || !/\.(?:c|h|cc|cpp|inc)$/.test(file)) throw new Error(`${source.component}: 正式输入文件缺失或路径无效 ${file}`);
        if (selected.has(file)) throw new Error(`${source.component}: 正式输入文件重复 ${file}`);
        selected.add(file);
        return show(directory, revision, file);
      };
      for (const input of source.registration_inputs) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`${source.component}: 正式注册输入结构无效`);
        const original = validateFile(input.file);
        const ownerOriginal = input.owner_file === undefined ? original : validateFile(input.owner_file);
        if (input.includes !== undefined && (!input.includes || typeof input.includes !== 'object' || Array.isArray(input.includes))) throw new Error(`${source.component}: include 映射结构无效`);
        const includes = {};
        for (const [header, file] of Object.entries(input.includes ?? {})) {
          if (!/^[\w.-]+\.h$/.test(header) || typeof file !== 'string' || file.split('/').at(-1) !== header) throw new Error(`${source.component}: include 映射名称与文件不一致`);
          includes[header] = { file, original: validateFile(file) };
        }
        sourceRecords.push(...extractCommands(original, input.file, source.component,
          { owner_file: input.owner_file, owner_original: ownerOriginal, includes }));
      }
      nativeFiles = [...selected];
    } else {
      nativeFiles = paths.filter(file => /\.(?:c|h|cc|cpp|inc)$/.test(file) && !file.split('/').some(part => ['t', 'test', 'tests', 'doc'].includes(part)));
      for (const file of nativeFiles) sourceRecords.push(...extractCommands(show(directory, revision, file), file, source.component));
    }
    let scopeReview;
    if (source.scope_review !== undefined) {
      if (sourceRecords.length) throw new Error(`${source.component}: 非指令 scope_review 与实际注册冲突`);
      scopeReview = reviewScope(source, paths, file => show(directory, revision, file), mainRevision, file => show(main, mainRevision, file));
    }
    let registrationBuild;
    if (source.registration_build !== undefined) {
      registrationBuild = await reviewRegistrationBuild({ source, read: readBuildSource, paths, records: sourceRecords });
      if (!registrationBuild.complete || registrationBuild.status !== 'verified') throw new Error(`${source.component}: 正式构建范围未闭合: ${registrationBuild.reasons.join('；')}`);
    }
    Object.assign(expected, { local_path: source.path, revision, repository,
      inspection: registrationBuild ? 'fixed_registration_build_review' : scopeReview ? 'fixed_build_and_entry_review' : source.registration_inputs ? 'fixed_registration_inputs' : 'local_c_registration_scan',
      directive_scope: scopeReview ? 'no_own_directives' : sourceRecords.length ? 'has_directives' : 'no_c_registrations_found', registrations: sourceRecords.length,
      scanned_files: nativeFiles,
      ...(source.registration_inputs ? { registration_inputs: source.registration_inputs } : {}),
      ...(scopeReview ? { role: scopeReview.classification, scope_review: scopeReview } : {}),
      ...(registrationBuild ? { registration_build: registrationBuild } : {}),
      ...(archiveEvidence ? { archive_evidence: archiveEvidence } : {}),
      caveat: source.role === 'nginx-core' ? '上游 Nginx 注册表；OpenResty 补丁影响尚未逐项核定' : '扫描 C 注册表不等于功能知识已完成或模块已启用' });
    directives.push(...sourceRecords.map(record => ({ ...record, version: source.version, revision,
      repository, local_path: source.path })));
  }
  if (config.component_scope_file) {
    const scope = JSON.parse(await readFile(resolve(root, config.component_scope_file), 'utf8'));
    if (scope.schema_version !== 1 || scope.openresty_version !== config.openresty_version || !Array.isArray(scope.components)) throw new Error('组件范围证据版本或结构不一致');
    const seen = new Set();
    for (const reviewed of scope.components) {
      const expected = matrix.find(item => item.component === reviewed.component);
      if (!expected || expected.inspection !== 'not_inspected' || seen.has(reviewed.component)
        || reviewed.version !== expected.version || reviewed.repository !== expected.repository || reviewed.tag !== expected.tag
        || !/^[a-f0-9]{40}$/.test(reviewed.revision ?? '') || reviewed.classification !== 'lua_reference_library'
        || reviewed.truncated !== false || !Array.isArray(reviewed.files) || !reviewed.files.length
        || !Array.isArray(reviewed.native_or_generator_files) || reviewed.native_or_generator_files.length
        || !reviewed.readme?.code || !reviewed.installation?.code
        || reviewed.files.some(file => !file || typeof file.path !== 'string' || /\.(?:c|h|cc|cpp|inc|in|tt|erb|tmpl|rl)$/.test(file.path) || /(?:^|\/)(?:config|configure)$/.test(file.path))
        || reviewed.files.find(file => file.path === reviewed.installation.file)?.sha !== reviewed.installation.blob_sha) throw new Error(`${reviewed.component}: 组件范围证据不完整或与发行版不一致`);
      Object.assign(expected, { revision: reviewed.revision, inspection: 'fixed_tree_and_install_review', directive_scope: 'reference_only',
        role: reviewed.classification, registrations: 0, scope_evidence: reviewed,
        caveat: '固定源码树及安装脚本已核对：Lua 接口参考库，不作为新增 Nginx 配置指令模块；这不表示 API 内容已全量核实。' });
      seen.add(reviewed.component);
      const installation = reviewed.installation;
      const actualBlob = createHash('sha1').update(`blob ${Buffer.byteLength(installation.code)}\0`).update(installation.code).digest('hex');
      if (actualBlob !== installation.blob_sha) throw new Error(`${reviewed.component}: 安装入口原文与范围证据 blob 不一致`);
    }
  }
  if (config.nginx_patch_audit) {
    const result = await nginxPatchRegistrations({ root, config, configPath, show, mainRevision,
      existingDirectives: directives.filter(item => item.component === 'nginx') });
    const nginx = matrix.find(item => item.component === 'nginx');
    if (!nginx?.local_path || !Array.isArray(result.directives) || !result.scope) throw new Error('Nginx 补丁注册结果或正式来源无效');
    directives.push(...result.directives);
    nginx.registrations += result.directives.length;
    nginx.patch_scope = result.scope;
  }
  if (config.redis_patch_audit) {
    const scope = await redisPatchScope({ root, config, show, mainRevision });
    const redis = matrix.find(item => item.component === scope.component);
    if (!redis?.local_path) throw new Error('Redis 补丁范围缺少正式来源');
    redis.patch_scope = scope;
  }
  const scopeComplete = matrix.every(item => ['fixed_registration_build_review', 'fixed_build_and_entry_review',
    'fixed_tree_and_install_review'].includes(item.inspection))
    && Boolean(matrix.find(item => item.component === 'nginx')?.patch_scope)
    && Boolean(matrix.find(item => item.component === 'redis-nginx-module')?.patch_scope);
  const extensions = [];
  for (const source of extensionSources) {
    const result = await inspectExtensionSource(root, source, readBuildSource);
    extensions.push(result.component);
    directives.push(...result.directives);
  }
  const output = resolve(root, config.analysis_dir);
  await mkdir(join(output, 'directives'), { recursive: true });
  const json = data => JSON.stringify(data, null, 2) + '\n';
  await writeFile(join(output, 'components.json'), json({ openresty_version: config.openresty_version, scope_complete: scopeComplete, components: matrix,
    department_extensions: { scope_complete: extensions.every(item => item.registration_build.complete), components: extensions } }));
  await writeFile(join(output, 'directives/catalog.json'), json({ openresty_version: config.openresty_version, directives }));
  const headers = ['component', 'module', 'name', 'context_flags', 'callback', 'file', 'line', 'compile_guards', 'verification'];
  const quote = value => `"${String(Array.isArray(value) ? value.join(' | ') : value).replaceAll('"', '""')}"`;
  await writeFile(join(output, 'directives/catalog.csv'), [headers.map(quote).join(','), ...directives.map(record => headers.map(key => quote(record[key])).join(','))].join('\n') + '\n');
  console.log(JSON.stringify({ components: matrix.length, local_sources: config.sources.length,
    inspected: matrix.filter(item => item.inspection !== 'not_inspected').length, registrations: directives.length,
    scope_complete: scopeComplete }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const position = process.argv.indexOf('--config');
  if (position < 0 || !process.argv[position + 1]) throw new Error('需要 --config 配置文件');
  await inventory(resolve(process.argv[position + 1]));
}
