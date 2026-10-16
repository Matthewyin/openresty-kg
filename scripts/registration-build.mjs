import { extractCommands, stripComments } from './inventory.mjs';

const unique = values => [...new Set(values)];
const fail = message => { throw new Error(`registration-build: ${message}`); };
const safePath = path => typeof path === 'string' && /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[\w./-]+$/.test(path);

function includeConditions(text, offset) {
  const stack = [];
  for (const match of text.slice(0, offset).matchAll(/^\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b([^\n]*)/gm)) {
    if (match[1] === 'endif') stack.pop();
    else if (['elif', 'else'].includes(match[1])) {
      if (stack.length) stack[stack.length - 1] = `${match[1]} ${match[2].trim()} [原分支: ${stack.at(-1)}]`;
    } else stack.push(`${match[1]} ${match[2].trim()}`);
  }
  return stack;
}

// 只读取赋值和消费者，不执行 shell；条件保留原文，不按当前平台求值。
function statements(text, file) {
  const lines = text.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const start = i;
    let raw = lines[i];
    if (/^\s*#/.test(raw)) continue;
    const quoteCount = value => [...value.matchAll(/(?<!\\)"/g)].length;
    if (/^\s*\w+=/.test(raw)) {
      while ((quoteCount(raw) % 2 || /\\$/.test(raw)) && i + 1 < lines.length) raw += `\n${lines[++i]}`;
      if (quoteCount(raw) % 2) fail(`${file}:${start + 1} 未闭合赋值`);
    }
    const value = raw.replace(/\\\n/g, ' ').trim();
    const assignment = value.match(/^(\w+)=(.*)$/s);
    result.push({ file, start_line: start + 1, end_line: i + 1, raw,
      ...(assignment ? { variable: assignment[1], value: assignment[2].replace(/^"([\s\S]*)"$/, '$1') } : {}),
      value_text: value });
  }
  const conditions = [];
  for (const entry of result) {
    const line = entry.value_text;
    if (/^fi\b/.test(line)) conditions.pop();
    else if (/^(?:else|elif)\b/.test(line) && conditions.length) {
      const old = conditions.pop();
      conditions.push({ ...old, branch: line, branch_line: entry.start_line });
    }
    entry.conditions = structuredClone(conditions);
    if (/^if\b/.test(line)) conditions.push({ file, start_line: entry.start_line, expression: line });
  }
  return result;
}

function listGraph(entries, allowConditionalUnion) {
  const definitions = new Map();
  for (const entry of entries) if (entry.variable) {
    if (!definitions.has(entry.variable)) definitions.set(entry.variable, []);
    definitions.get(entry.variable).push(entry);
  }
  const consumed = new Set();
  function expand(value, stack = [], beforeLine = Infinity) {
    const output = [];
    for (const token of value.replace(/\\\n/g, ' ').split(/\s+/).filter(Boolean)) {
      if (/^\$ngx_addon_dir\/[\w./-]+$/.test(token)) output.push(token.slice('$ngx_addon_dir/'.length));
      else if (/^\$\w+$/.test(token)) {
        const name = token.slice(1);
        if (stack.includes(name)) continue;
        const defs = definitions.get(name)?.filter(definition => definition.start_line < beforeLine);
        if (!defs?.length) fail(`未知构建变量 ${name}`);
        if (!allowConditionalUnion && defs.slice(1).some(definition => !new RegExp(`\\$${name}\\b`).test(definition.value))) fail(`未支持的构建变量覆盖 ${name}`);
        for (const definition of defs) {
          consumed.add(definition);
          output.push(...expand(definition.value, [...stack, name], allowConditionalUnion ? Infinity : definition.start_line));
        }
      } else if (/^[\w./-]+$/.test(token)) output.push(token);
      else fail(`未知构建表达式 ${token}`);
    }
    return unique(output);
  }
  return { expand, consumed, definitions };
}

function ownersIn(text, file) {
  const clean = stripComments(text);
  const all = [...clean.matchAll(/\bngx_module_t\s+(\w+)\s*=\s*\{/g)];
  return all.map(match => {
    const rest = clean.slice(match.index + match[0].length);
    const fields = rest.slice(0, rest.indexOf('};')).replace(/^\s*#.*$/gm, '').split(',').map(field => field.trim());
    if (fields[0] !== 'NGX_MODULE_V1' || !/^(?:NULL|\w+)$/.test(fields[2] ?? '')) fail(`${file}: 未支持的 owner initializer ${match[1]}`);
    return { module: match[1], array: fields[2], file, line: clean.slice(0, match.index).split('\n').length };
  });
}

const recordFields = ['component', 'module', 'array', 'file', 'line', 'end_line', 'name', 'flags', 'context_flags', 'callback', 'post', 'compile_guards'];
function signature(record) {
  return JSON.stringify(recordFields.map(field => record[field]));
}

// 仅解释源码列表赋值；平台分支逐一展开，探测条件的自追加保留为条件并集。
async function nginxPlatformUnits(get) {
  const base = new Map();
  const relevant = name => /^(?:[A-Z0-9_]+_(?:SRCS|MODULES?))$/.test(name ?? '');
  const resolveList = (value, state) => unique(value.split(/\s+/).filter(Boolean).flatMap(token => {
    if (/^\$\w+$/.test(token)) {
      if (!state.has(token.slice(1))) fail(`有序构建引用未知变量 ${token}`);
      return state.get(token.slice(1));
    }
    if (!/^[\w./-]+$/.test(token)) fail(`有序构建未知表达式 ${token}`);
    return [token];
  }));
  const apply = (items, state, assignments) => {
    for (const item of items.filter(item => relevant(item.variable))) {
      if (item.conditions.length && !item.value.includes(`$${item.variable}`)) fail(`${item.file}:${item.start_line} 未核实的条件覆盖 ${item.variable}`);
      state.set(item.variable, resolveList(item.value, state));
      assignments.push(item);
    }
  };
  const initial = [];
  apply(statements(await get('auto/sources'), 'auto/sources'), base, initial);
  const os = await get('auto/os/conf');
  const platformCase = os.match(/case "\$NGX_PLATFORM" in\n([\s\S]*?)\nesac/);
  if (!platformCase) fail('缺少正式 NGX_PLATFORM case');
  const branches = [...platformCase[1].matchAll(/^\s*([^\n]+)\)\n([\s\S]*?)^\s*;;/gm)];
  const supported = ['FreeBSD:*', 'Linux:*', 'SunOS:*', 'Darwin:*', 'win32', 'DragonFly:*', 'NetBSD:*', 'HP-UX:*', 'OSF1:*', 'GNU:*', '*'];
  if (JSON.stringify(branches.map(branch => branch[1].trim())) !== JSON.stringify(supported)) fail('新增或缺失平台分支必须重新核实');
  const result = [];
  for (const branch of branches) {
    const platform = branch[1].trim();
    const state = new Map(base);
    const assignments = [...initial];
    const linked = [...branch[2].matchAll(/^\s*\. (auto\/os\/[\w-]+)\s*$/gm)];
    if (linked.length > 1) fail(`未支持的平台多入口 ${platform}`);
    if (linked.length) apply(statements(await get(linked[0][1]), linked[0][1]), state, assignments);
    else {
      const offset = os.indexOf(branch[2]);
      const padding = '\n'.repeat(os.slice(0, offset).split('\n').length - 1);
      apply(statements(padding + branch[2], 'auto/os/conf'), state, assignments);
    }
    if (platform !== 'win32') {
      apply(statements(await get('auto/unix'), 'auto/unix'), state, assignments);
      apply(statements(await get('auto/threads'), 'auto/threads'), state, assignments);
    }
    const moduleEntries = statements(await get('auto/modules'), 'auto/modules');
    apply(moduleEntries.filter(item => ['CORE_SRCS', 'EVENT_MODULES'].includes(item.variable)), state, assignments);
    result.push({ names: unique([...state.get('CORE_MODULES'), ...state.get('EVENT_MODULES'),
      ...(platform === 'win32' ? [] : state.get('THREAD_POOL_MODULE'))]), files: state.get('CORE_SRCS'),
      platform, assignments, consumer: { file: 'auto/make', start_line: 259,
        conditions: [{ expression: `NGX_PLATFORM: ${platform}` }] } });
  }
  return result;
}

async function nginxGeneratedProof(proof, units) {
  const modules = await proof('auto/modules');
  const make = await proof('auto/make');
  if (/ngx_command_t/.test(modules + make)
    || !modules.includes('echo "extern ngx_module_t  $mod;"')
    || !modules.includes('echo "    &$mod,"')
    || !make.includes('echo "extern ngx_module_t  $mod;"')
    || !make.includes('echo "    &$mod,"')
    || !make.includes('for ngx_src in $ngx_module_srcs $ngx_module_shrd')) fail('模块指针聚合/动态源消费者已变化');
  for (const family of ['MAIL', 'STREAM']) {
    const block = new RegExp(`elif \\[ \\$${family} = DYNAMIC \\]; then([\\s\\S]*?)\\. auto/module`).exec(modules)?.[1];
    if (!block || !block.includes(`ngx_module_name=$${family}_MODULES`) || !block.includes(`ngx_module_srcs=$${family}_SRCS`)
      || !block.includes('ngx_module_link=DYNAMIC')) fail(`${family} 动态聚合绑定已变化`);
  }
  const lib = await proof('auto/lib/make');
  const perl = await proof('auto/lib/perl/make');
  const makefile = await proof('src/http/modules/perl/Makefile.PL');
  const xs = await proof('src/http/modules/perl/nginx.xs');
  if (!/if \[ \$USE_PERL != NO \]; then\s*\. auto\/lib\/perl\/make/.test(lib)
    || !/cp -p src\/http\/modules\/perl\/nginx\.xs/.test(perl)
    || !/\$NGX_PERL Makefile\.PL/.test(perl)
    || !/use ExtUtils::MakeMaker;/.test(makefile)
    || !/NAME\s*=> 'nginx'/.test(makefile) || !/'nginx\.c'\s*=>/.test(makefile)
    || !/^MODULE = nginx\s+PACKAGE = nginx$/m.test(xs)
    || /\bngx_(?:module|command)_t\b|^(?:BOOT|INCLUDE)\s*:/m.test(stripComments(xs))) fail('Perl XS 正向生成/用途边界已变化');
  const headers = [...xs.matchAll(/^#include [<"]([^>"]+)[>"]/gm)].map(match => match[1]);
  if (JSON.stringify(headers) !== JSON.stringify(['ngx_config.h', 'ngx_core.h', 'ngx_http.h', 'ngx_http_perl_module.h', 'XSUB.h'])) fail('Perl XS 新 include 未核');
  const cpp = 'src/misc/ngx_cpp_test_module.cpp';
  const text = stripComments(await proof(cpp));
  const cppUnit = units.find(unit => unit.files.includes(cpp));
  if (!cppUnit || cppUnit.names.length || !/^\s*extern "C"\s*\{(?:\s*#include <\w+\.h>)+\s*\}\s*void ngx_cpp_test_handler\(void \*data\);\s*void\s+ngx_cpp_test_handler\(void \*data\)\s*\{\s*return;\s*\}\s*$/.test(text)) fail('C++ 头兼容测试源不再是已核无注册形态');
  const cppHeaders = ['ngx_config.h', 'ngx_core.h', 'ngx_event.h', 'ngx_event_connect.h', 'ngx_event_pipe.h', 'ngx_http.h',
    'ngx_mail.h', 'ngx_mail_pop3_module.h', 'ngx_mail_imap_module.h', 'ngx_mail_smtp_module.h', 'ngx_stream.h'];
  if (JSON.stringify([...text.matchAll(/#include <(\w+\.h)>/g)].map(match => match[1])) !== JSON.stringify(cppHeaders)) fail('C++ 兼容测试新 include 未核');
  return [
    { kind: 'perl-xs-extension', file: 'src/http/modules/perl/nginx.xs', output: 'nginx.c',
      producer: 'auto/lib/perl/make', condition: 'HTTP_PERL != NO → USE_PERL != NO', registration_owner: 'ngx_http_perl_module', executed: false },
    { kind: 'header-compatibility-test', file: cpp, consumer: cppUnit.consumer, registration_owner: null },
    { kind: 'module-pointer-aggregation', file: 'auto/modules', output: '$NGX_MODULES_C', executed: false },
    { kind: 'dynamic-module-pointer-aggregation', file: 'auto/make', output: '$NGX_OBJS/${ngx_module}_modules.c', executed: false }
  ];
}

async function ndkBuildProof(proof, get, tree, input) {
  if (input.file !== 'objs/ndk_config.c' || input.owner_file !== 'src/ndk.c') fail('未知 NDK 正式容器');
  const config = await get('config');
  const generator = await proof('auto/build');
  const optional = await proof('auto/data/modules_optional');
  const options = optional.trim().split('\n').map(line => {
    const match = line.trim().match(/^(\w+)(?:\s+(\*))?$/);
    if (!match) fail(`未知 NDK optional 数据 ${line}`);
    return { name: match[1], commands: !!match[2] };
  });
  if (new Set(options.map(option => option.name)).size !== options.length) fail('重复 NDK optional');
  if (!/NDK_INCS="\$ngx_addon_dir\/src \$ngx_objs_dirs"/.test(config)
    || !/ngx_objs_dirs="\$ngx_addon_dir\/objs \$NGX_OBJS\/addon\/ndk"/.test(config)
    || (config.match(/\bndk_generate_files\b/g) ?? []).length !== 1) fail('NDK include 搜索顺序或生成调用已变化');
  const commandGenerator = generator.match(/function generate_commands \{([\s\S]*?)\n\}/)?.[1];
  if (!commandGenerator || !commandGenerator.includes('cat $optional_modules_file | sort | while read line; do')
    || !commandGenerator.includes("grep -E '\\*'") || !commandGenerator.includes('add_include  $1  $mod.h')
    || !commandGenerator.includes('static ngx_command_t  ndk_http_commands[] = {')
    || !/generate_optional_c_includes \$out\s+generate_commands \$out/.test(generator)) fail('NDK commands 生成模板已变化');
  const container = await get(input.file);
  const expectedC = options.map(option => `ndk_${option.name}.c`).sort();
  const actualC = [...container.matchAll(/#include\s+<([^>]+\.c)>/g)].map(match => match[1]).sort();
  if (JSON.stringify(expectedC) !== JSON.stringify(actualC)) fail('NDK optional C 与正式生成容器不一致');
  const expectedCommands = options.filter(option => option.commands).map(option => `ndk_${option.name}.h`).sort();
  if (JSON.stringify(expectedCommands) !== JSON.stringify(Object.keys(input.includes ?? {}).sort())) fail('NDK 星号 commands 与注册 include 映射不一致');
  const queue = ['src/ndk.h', input.file];
  const visited = new Set();
  const includes = [];
  while (queue.length) {
    const file = queue.shift();
    if (visited.has(file)) continue;
    visited.add(file);
    const text = stripComments(await proof(file));
    if (file !== input.file && /\bngx_(?:command_t\s+\w+\s*\[|module_t\s+\w+\s*=)/.test(text)) fail(`${file}: NDK include 出现新注册`);
    for (const match of text.matchAll(/^\s*#\s*include\s+([^\n]+)/gm)) {
      const name = match[1].trim().match(/^[<"]([^>"]+)[>"]$/)?.[1];
      if (!name) fail(`${file}: 未知 NDK include 表达式`);
      if (['ngx_config.h', 'ngx_core.h', 'ngx_http.h', 'ngx_md5.h', 'ngx_sha1.h', 'iconv.h'].includes(name)) continue;
      if (!name.startsWith('ndk') && name !== 'hash/murmurhash2.c') fail(`${file}: 未知 NDK include 路径 ${name}`);
      const candidates = unique([`${file.slice(0, file.lastIndexOf('/'))}/${name}`, `src/${name}`, `objs/${name}`]).filter(path => tree.has(path));
      if (candidates.length !== 1) fail(`${file}: NDK include 无唯一正式路径 ${name}`);
      const target = candidates[0];
      includes.push({ file, target, line: text.slice(0, match.index).split('\n').length, conditions: includeConditions(text, match.index) });
      queue.push(target);
    }
  }
  for (const path of ['auto/data/header_files', 'auto/data/headers', 'auto/data/module_dependencies',
    'auto/data/conf_args', 'auto/data/conf_locs', 'auto/data/conf_macros', 'auto/data/action_replacements',
    'auto/data/action_types', 'auto/data/prefixes', 'auto/src/conf_cmd_basic.h', 'auto/src/conf_merge.h']) await proof(path);
  const names = (await get('auto/data/header_files')).trim().split(/\s+/);
  const compact = text => stripComments(text).replace(/\s+/g, '');
  const define = name => `#ifndef NDK_${name.toUpperCase()}\n#define NDK_${name.toUpperCase()} 1\n#endif\n`;
  let expectedConfig = '#ifdef NDK_ALL\n' + options.map(option => define(option.name)).join('') + '#endif\n';
  for (const line of (await get('auto/data/module_dependencies')).trim().split('\n')) {
    const [owner, ...dependencies] = line.trim().split(/\s+/);
    if (!options.some(option => option.name === owner) || !dependencies.length || dependencies.some(name => !/^\w+$/.test(name))) fail('未知 NDK 依赖数据');
    expectedConfig += `#ifdef NDK_${owner.toUpperCase()}\n${dependencies.map(define).join('')}#endif\n`;
  }
  if (compact(await get('objs/ndk_config.h')) !== compact(expectedConfig)) fail('NDK optional 默认/依赖条件与已提交生成头不一致');
  const conditionalInclude = (name, extension) => `#if (NDK_${name.toUpperCase()})\n#include <ndk_${name}.${extension}>\n#endif\n`;
  const ordinary = (await get('auto/data/headers')).trim().split(/\s+/);
  if ([...ordinary, ...names].some(name => !/^\w+$/.test(name))) fail('未知 NDK 头数据表达式');
  const expectedHeaders = options.map(option => conditionalInclude(option.name, 'h')).join('')
    + [...ordinary, ...names, 'conf_merge', 'conf_cmd_basic', 'conf_cmd_extra'].map(name => `#include <ndk_${name}.h>\n`).join('');
  if (compact(await get('objs/ndk_includes.h')) !== compact(expectedHeaders)) fail('NDK 头生成清单与正式 include 不一致');
  const optionalPrefix = container.slice(0, container.indexOf('static ngx_command_t'));
  if (compact(optionalPrefix) !== compact(options.map(option => conditionalInclude(option.name, 'c')).join(''))) fail('NDK optional C guard 与生成数据不一致');
  for (const name of names) {
    if (!/^\w+$/.test(name) || !visited.has(`objs/ndk_${name}.h`)) fail(`未消费的 NDK 生成头 ${name}`);
    await proof(`auto/src/${name}.h`);
    await proof(`auto/actions/${name}`);
  }
  const library = await proof('ngx_auto_lib_core');
  const functions = [...library.matchAll(/^(\w+)\(\) \{/gm)].map(match => match[1]);
  // 冻结 library 的函数均以独立行花括号闭合；先屏蔽定义体，再检查实际顶层命令。
  const functionBlocks = /^(\w+)\(\) \{\n[\s\S]*?^\}[ \t]*$/gm;
  if ([...library.matchAll(functionBlocks)].length !== functions.length) fail('NDK library 函数定义边界未核实');
  const libraryTopLevel = library.replace(functionBlocks, block => block.replace(/[^\n]/g, ' '))
    .replace(/^[ \t]*#.*$/gm, '');
  if (!functions.length || functions.some(name => new RegExp(`(?:^|[;&|])\\s*${name}(?=\\s|$|[;&|])`, 'm').test(config)
    || new RegExp(`(?:^|[;&|])\\s*${name}(?=\\s|$|[;&|])`, 'm').test(libraryTopLevel))) fail('NDK library 从仅定义变为被根入口调用');
  return { kind: 'committed-ndk-generated-inputs', file: input.file, producer: 'auto/build',
    data: 'auto/data/modules_optional', optional: options, includes,
    included_c_files: [...visited].filter(file => file.endsWith('.c')), executed: false,
    condition: 'NDK_ALL/各 NDK_* 条件并集；NDK_UPSTREAM_LIST 不等于单独默认启用' };
}

/** read(file, component) 必须读取调用方已冻结的 Git blob；本模块不读工作树。 */
export async function reviewRegistrationBuild({ source, read, paths, records }) {
  const metadata = source.registration_build;
  if (!metadata) return { status: 'pending', complete: false, reasons: ['缺少 registration_build 正式入口'] };
  if (Object.keys(metadata).some(key => key !== 'entry')) fail('未支持的 registration_build 字段');
  if (!['config', 'auto/configure'].includes(metadata.entry)) fail(`未支持的正式入口 ${metadata.entry}`);
  if (!Array.isArray(paths) || paths.some(path => !safePath(path)) || new Set(paths).size !== paths.length) fail('完整固定 tree 路径缺失、重复或不安全');
  if (!Array.isArray(records) || records.some(record => record.component !== source.component || record.distribution_patch)) fail('records 必须是当前组件的上游注册，发行补丁另核');
  const tree = new Set(paths);
  const cache = new Map();
  const evidence = [];
  const evidenceKeys = new Set();
  const pending = [];
  async function get(file, component = source.component) {
    if (!safePath(file)) fail(`不安全的证据路径 ${file}`);
    if (component === source.component && !tree.has(file)) fail(`缺少固定文件 ${file}`);
    const key = `${component}:${file}`;
    if (!cache.has(key)) {
      const text = await read(file, component);
      if (typeof text !== 'string' || !text.length) fail(`缺少固定原文 ${key}`);
      cache.set(key, text);
    }
    return cache.get(key);
  }
  async function proof(file, component = source.component) {
    const text = await get(file, component);
    const key = `${component}:${file}`;
    if (!evidenceKeys.has(key)) evidence.push({ component, file, start_line: 1, end_line: text.split('\n').length, text });
    evidenceKeys.add(key);
    return text;
  }
  const nginx = source.component === 'nginx';
  if (nginx !== (metadata.entry === 'auto/configure')) fail('组件与正式入口类型不符');
  const consumer = await proof('auto/module', 'nginx');
  const make = await proof('auto/make', 'nginx');
  const modules = await proof('auto/modules', 'nginx');
  const consumedLines = [
    'eval ${ngx_module}_MODULES=\\"$ngx_module_name\\"',
    'eval ${ngx_module}_SRCS=\\"$srcs\\"',
    'eval ${ngx_module_type}_MODULES=\\"\\$${ngx_module_type}_MODULES $ngx_module_name\\"',
    'eval ${ngx_var}_SRCS=\\"\\$${ngx_var}_SRCS $ngx_module_srcs\\"',
    'NGX_ADDON_SRCS="$NGX_ADDON_SRCS $srcs"'
  ];
  const consumerLines = consumer.replace(/\\\n\s*/g, '').split('\n').map(line => line.trim());
  for (const required of consumedLines) if (!consumerLines.includes(required)) fail(`auto/module 正式赋值消费者已变化: ${required}`);
  if (!/for ngx_src in \$NGX_ADDON_SRCS/.test(make) || !/for ngx_module in \$DYNAMIC_MODULES/.test(make)) fail('auto/make 正式编译消费者缺失');
  if (!/\. \$ngx_addon_dir\/config/.test(modules)) fail('auto/modules 没有接入根 config');

  let entries = [];
  const excluded = [];
  if (nginx) {
    const entry = await proof(metadata.entry);
    const entryIncludes = [...entry.matchAll(/^\s*\.\s+(\S+)\s*$/gm)].map(match => match[1]);
    const supportedIncludes = ['auto/options', 'auto/init', 'auto/sources', 'auto/cc/conf', 'auto/headers', 'auto/os/conf',
      'auto/unix', 'auto/threads', 'auto/modules', 'auto/lib/conf', 'auto/define', 'auto/define', 'auto/define', 'auto/define', 'auto/define',
      'auto/make', 'auto/lib/make', 'auto/install', 'auto/stubs', 'auto/summary'];
    if (JSON.stringify(entryIncludes) !== JSON.stringify(supportedIncludes)) fail('Nginx configure 新 include/调用顺序必须重新核实');
    const controlFiles = ['auto/sources', 'auto/os/conf', 'auto/unix', 'auto/threads', 'auto/modules'];
    for (const file of controlFiles) if (!entry.includes(`. ${file}`)) fail(`正式入口未引用 ${file}`);
    const os = await get('auto/os/conf');
    for (const match of os.matchAll(/^\s*\. (auto\/os\/[\w-]+)\s*$/gm)) controlFiles.push(match[1]);
    const options = await proof('auto/options');
    const distribution = await proof('util/configure', 'openresty');
    const assignments = [...options.matchAll(/\bHTTP_STATUS=([^\s;]+)/g)].map(match => match[1]);
    const statusBlock = modules.match(/^[ \t]*if \[ \$HTTP_STATUS = YES \]; then\n[\s\S]*?^[ \t]*fi\s*$/m);
    if (!statusBlock || assignments.length !== 2 || assignments.some(value => value !== 'NO')
      || !/--without-http_status_module\)\s+HTTP_STATUS=NO/.test(options)
      || /--with-http_status_module(?:[\s)=]|$)|HTTP_STATUS/.test(distribution)) fail('HTTP_STATUS 的无启用路径证据已变化');
    const start = modules.slice(0, statusBlock.index).split('\n').length;
    excluded.push({ file: 'src/http/modules/ngx_http_status_module.c', reason: 'options 初始化 NO，唯一参数仍设 NO，固定发行入口未提供启用路径',
      evidence: { file: 'auto/modules', start_line: start, end_line: start + statusBlock[0].split('\n').length - 1 } });
    for (const file of unique(controlFiles)) {
      const text = await proof(file);
      const includes = [...text.replace(/^\s*#.*$/gm, '').matchAll(/(?:^|\s)\. (auto\/[\w/-]+|\$ngx_addon_dir\/\w+)/gm)].map(match => match[1]);
      const probes = ['auto/types/sizeof', 'auto/types/value', 'auto/types/typedef', 'auto/types/uintptr_t', 'auto/endianness', 'auto/include'];
      const known = new Set(['auto/have', 'auto/nohave', 'auto/feature', 'auto/have_headers', 'auto/define', 'auto/module', '$ngx_addon_dir/config', ...probes, ...controlFiles]);
      for (const included of includes) if (!known.has(included)) fail(`${file}: 未核实构建 include ${included}`);
      for (const included of unique(includes.filter(path => probes.includes(path)))) {
        const probe = await proof(included);
        if (!/\$NGX_AUTO(?:TEST|_CONFIG_H)/.test(probe) || /\b[A-Z0-9_]+_(?:SRCS|MODULES?)=/.test(probe)) fail(`${included}: 类型探测不再只是 autoconf 输入`);
      }
      if (/(?<![$\w])HTTP_STATUS=/.test(text.replace(/^\s*#.*$/gm, ''))) fail(`${file}: HTTP_STATUS 新赋值必须重新核实启用路径`);
      entries.push(...statements(text, file).filter(item => !(file === 'auto/modules' && item.start_line >= start && item.start_line <= excluded[0].evidence.end_line)));
    }
    if (!/if \[ "\$NGX_PLATFORM" != win32 \]; then\s*\. auto\/unix/.test(entry)) fail('Unix 平台入口条件已变化');
  } else entries = statements(await proof(metadata.entry), metadata.entry);

  for (const entry of entries) {
    if (/\b(?:eval|export|unset)\b[^\n]*(?:SRCS|MODULES|module_name|module_srcs)/.test(entry.value_text)) fail(`${entry.file}:${entry.start_line} 未支持的构建写入`);
    if (!entry.variable && /\b(?:\w*SRCS|ngx_module_name|ngx_module_srcs)=/.test(entry.value_text)) fail(`${entry.file}:${entry.start_line} 非独立构建赋值`);
    if (!nginx && entry.variable === 'ngx_module_link') fail(`${entry.file}:${entry.start_line} 未支持 addon 覆盖正式 link 选择`);
  }
  if (!nginx && entries.some(entry => /^if\b.*\$ngx_module_link/.test(entry.value_text))
    && !entries.some(entry => entry.value_text === '. auto/module')) fail('现代分支缺少 auto/module 消费者，不能用 legacy 分支代替');

  const graph = listGraph(entries, nginx);
  const expandAt = (value, entry) => graph.expand(value, [], nginx ? Infinity : entry.start_line);
  const units = [];
  const roots = [];
  let lastName;
  let lastSources;
  let lastType;
  for (const entry of entries) {
    if (entry.variable === 'ngx_module_type') lastType = entry.value;
    if (entry.variable === 'ngx_module_name') lastName = entry;
    if (entry.variable === 'ngx_module_srcs') lastSources = entry;
    if (entry.value_text === '. auto/module') {
      if (!lastName || !lastSources) fail(`${entry.file}:${entry.start_line} auto/module 缺少显式 name/srcs`);
      const supportedTypes = nginx ? ['CORE', 'HTTP', 'HTTP_FILTER', 'HTTP_INIT_FILTER', 'MAIL', 'STREAM', 'MISC'] : ['HTTP', 'HTTP_FILTER', 'HTTP_AUX_FILTER', 'STREAM'];
      if (!supportedTypes.includes(lastType)) fail(`未支持正式 module type ${lastType}`);
      const names = expandAt(lastName.value, lastName);
      const files = expandAt(lastSources.value, lastSources);
      units.push({ names, files, consumer: entry, assignments: [lastName, lastSources] });
      roots.push(...files);
      if (nginx && lastType && !/^\$(?:MAIL|STREAM)_MODULES$/.test(lastName.value)) {
        const family = lastType.startsWith('HTTP_') ? 'HTTP' : lastType;
        for (const [variable, value] of [[`${lastType}_MODULES`, names.join(' ')], [`${family}_SRCS`, files.join(' ')]]) {
          if (!graph.definitions.has(variable)) graph.definitions.set(variable, []);
          graph.definitions.get(variable).push({ ...entry, variable, value });
        }
      }
      lastName = lastSources = undefined;
    }
  }
  const legacy = entries.filter(entry => entry.variable === 'NGX_ADDON_SRCS');
  for (const entry of legacy) {
    const files = expandAt(entry.value.replace(/\$NGX_ADDON_SRCS\b/g, ''), entry);
    const names = entries.filter(item => /^(?:HTTP|HTTP_AUX_FILTER|STREAM)_MODULES$/.test(item.variable ?? ''))
      .flatMap(item => expandAt(item.value.replace(new RegExp(`\\$${item.variable}\\b`, 'g'), ''), item));
    if (!names.length) fail('NGX_ADDON_SRCS 没有对应正式 module 集合');
    units.push({ names: unique(names), files, consumer: entry, assignments: [entry] });
    roots.push(...files);
  }
  if (nginx) {
    const platformUnits = await nginxPlatformUnits(get);
    units.push(...platformUnits);
    roots.push(...platformUnits.flatMap(unit => unit.files));
    for (const family of ['HTTP_SRCS', 'MAIL_SRCS', 'STREAM_SRCS']) if (graph.definitions.has(family)) roots.push(...graph.expand(`$${family}`));
  }
  const sourceFiles = unique(roots).filter(file => file.endsWith('.c')).sort();
  const otherSources = unique(roots).filter(file => !file.endsWith('.c'));
  if (otherSources.some(file => !nginx || file !== 'src/misc/ngx_cpp_test_module.cpp')) fail(`未核实非 C 正式源: ${otherSources.join(', ')}`);
  if (!units.length || !sourceFiles.length) fail('没有正向正式源码集合，不能以空扫描完成');
  for (const file of sourceFiles) if (!safePath(file) || !file.endsWith('.c') || !tree.has(file)) fail(`缺少或未支持的正式 C 源 ${file}`);
  const inputs = source.registration_inputs ?? [];
  const inputMap = new Map();
  for (const input of inputs) {
    if (!input.file || inputMap.has(input.owner_file ?? input.file)) fail('重复或无效 registration_inputs');
    if (Object.keys(input).some(key => !['file', 'owner_file', 'includes'].includes(key))) fail('未知 registration_inputs 字段');
    if (!input.owner_file && Object.keys(input.includes ?? {}).length) fail('未消费的 include 映射');
    inputMap.set(input.owner_file ?? input.file, input);
  }
  const extracted = [];
  const bindings = [];
  for (const file of sourceFiles) {
    const text = await get(file);
    const owners = ownersIn(text, file);
    const input = inputMap.get(file);
    if (input) inputMap.delete(file);
    const includeLines = [...stripComments(text).matchAll(/^[ \t]*#[ \t]*include\b([^\n]*)/gm)];
    for (const include of includeLines) if (!/^[ \t]*(?:<[^>\n]+>|"[^"\n]+")\s*$/.test(include[1])) fail(`${file}: 未支持的根 C include 表达式 ${include[1].trim()}`);
    const includes = [...stripComments(text).matchAll(/^\s*#\s*include\s*[<"]([^>"\n]+\.(?:c|inc))[>"]/gm)];
    for (const include of includes) if (!input?.owner_file || include[1] !== input.file.split('/').at(-1)) fail(`${file}: 未核实跨文件 include ${include[1]}`);
    for (const owner of owners) {
      const matched = units.filter(unit => unit.names.includes(owner.module) && (unit.files.includes(file) || nginx && !unit.files.length));
      if (!matched.length) fail(`${file}: owner ${owner.module} 未绑定正式消费者`);
      bindings.push({ ...owner, consumers: matched.map(unit => unit.consumer), commands_null: owner.array === 'NULL' });
    }
    if (input?.owner_file) {
      const included = {};
      for (const [name, path] of Object.entries(input.includes ?? {})) included[name] = { file: path, original: await get(path) };
      extracted.push(...extractCommands(await get(input.file), input.file, source.component,
        { owner_file: file, owner_original: text, includes: included }));
    } else if (/\bngx_command_t\s+\w+\s*\[/.test(stripComments(text))) {
      extracted.push(...extractCommands(text, file, source.component, {}));
    } else if (owners.some(owner => owner.array !== 'NULL')) fail(`${file}: commands 数组未在正式输入中定义`);
    if (input && input.file !== file && !input.owner_file) fail(`${file}: 未消费输入`);
  }
  if (inputMap.size) fail(`未消费 registration_inputs: ${[...inputMap.keys()].join(', ')}`);
  for (const unit of units) for (const name of unit.names) {
    if (!bindings.some(binding => binding.module === name && (unit.files.includes(binding.file) || nginx && !unit.files.length))) fail(`正式 module ${name} 缺少 owner initializer`);
  }
  if (!bindings.length) fail('没有正向 owner，不能以零匹配完成');
  const expected = records.map(signature).sort();
  const actual = extracted.map(signature).sort();
  if (new Set(expected).size !== expected.length || new Set(actual).size !== actual.length) fail('重复注册身份');
  if (JSON.stringify(expected) !== JSON.stringify(actual)) fail('正式构建注册与 records 全身份/字段集合不一致');
  const generated = entries.filter(entry => /autoconf\.h/.test(entry.raw) && /^echo\s/.test(entry.value_text));
  if (nginx) {
    generated.push(...await nginxGeneratedProof(proof, units));
  }
  if (inputs.some(input => input.owner_file)) {
    if (source.component !== 'ngx_devel_kit') fail('未支持的新跨文件构建形态');
    for (const input of inputs.filter(input => input.owner_file)) generated.push(await ndkBuildProof(proof, get, tree, input));
  }
  const otherIncludes = entries.filter(entry => /^\.\s/.test(entry.value_text) && !/^\. auto\/(?:module|feature|have)$/.test(entry.value_text)
    && !(source.component === 'ngx_devel_kit' && generated.some(item => item.kind === 'committed-ndk-generated-inputs') && entry.value_text === '. $ngx_addon_dir/ngx_auto_lib_core'));
  if (!nginx && otherIncludes.length) pending.push(...otherIncludes.map(entry => `${entry.file}:${entry.start_line} 额外 shell include 尚未闭合: ${entry.value_text}`));
  return { status: pending.length ? 'pending' : 'verified', complete: pending.length === 0,
    source_files: sourceFiles, owners: bindings, registrations: extracted, units,
    assignment_evidence: [...graph.consumed], build_evidence: evidence, generated_evidence: generated,
    excluded, reasons: unique(pending), scope: '固定上游正式注册条件并集；不代表本机编译、发行默认或实际部署' };
}
