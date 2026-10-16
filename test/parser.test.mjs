import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parseConfig, parseSingle } from '../src/core/core.mjs';
import {
  HTTP_LUA_BLOCK_DIRECTIVES, STREAM_LUA_BLOCK_DIRECTIVES,
  HTTP_LUA_FILE_DIRECTIVES, STREAM_LUA_FILE_DIRECTIVES, LUA_BLOCK_DIRECTIVES,
} from '../src/core/lua-directives.mjs';

test('完整主配置声明只确定顶层，默认片段及未知后代保持保守', () => {
  const input = 'worker_processes auto; include conf.d/main.conf; server { listen 80; } unknown { http { sendfile on; } }';
  const fragment = parseConfig(input);
  assert.equal(fragment.directives[0].context, null);
  const complete = parseConfig(input, { mode: 'main' });
  assert.deepEqual(complete.errors, []);
  assert.ok(complete.directives.filter(item => item.parent_index === null).every(item => item.context === 'main'));
  assert.ok(complete.directives.filter(item => item.parent_index !== null).every(item => item.context === null));
  assert.equal(complete.directives[1].external_references[0].status, 'not_analyzed');
  assert.equal(parseSingle('worker_processes auto;').directive.context, null);
  assert.equal(parseConfig('worker_processes auto', { mode: 'main' }).directives[0].context, null);
  assert.equal(parseConfig('worker_processes auto;', { mode: 'http' }).errors[0].code, 'invalid_input');
});

test('charset_map 仅在 HTTP main 识别数据，不扩展 include 或 Lua 文件', () => {
  const input = 'http { charset_map koi8-r utf-8 { C0 D18E; include data.conf; content_by_lua_file code.lua; } }';
  const parsed = parseConfig(input);
  assert.deepEqual(parsed.errors, []);
  for (const item of parsed.directives.slice(2)) {
    assert.equal(item.kind, 'block_entry');
    assert.equal(item.entry_role, 'data');
    assert.deepEqual(item.external_references, []);
    assert.deepEqual(item.contexts, ['http', 'charset_map']);
    assert.equal(item.parent_index, 1);
    assert.equal(item.complete, true);
  }
  for (const invalidParent of ['server', 'unknown']) {
    assert.equal(parseConfig(`http { ${invalidParent} { charset_map a b { C0 D18E; } } }`).directives.at(-1).kind, 'simple');
  }
  assert.equal(parseConfig('stream { charset_map a b { C0 D18E; } }').directives.at(-1).kind, 'simple');
  assert.equal(parseConfig('charset_map a b { C0 D18E; }').directives.at(-1).kind, 'simple');
  for (const name of ['nested', 'content_by_lua_block']) {
    assert.ok(parseConfig(`http { charset_map a b { ${name} {} } }`).errors.some(error => error.code === 'unexpected_opening_brace'));
  }
  assert.ok(parseConfig('http { charset_map a b { C0 D18E } }').errors.some(error => error.code === 'missing_semicolon'));
});

test('单项严格区分名称、配置、Lua 块、范围和词法错误', () => {
  for (const input of ['worker_processes', ' # 前注释\r\n worker_processes # 后注释']) {
    const single = parseSingle(input);
    assert.equal(single.status, 'ok');
    assert.equal(single.directive.kind, 'name');
    assert.equal(single.directive.context, null);
    assert.deepEqual(single.directive.args, []);
    assert.deepEqual(single.errors, []);
  }
  for (const input of ['foo;', 'worker_processes auto;', 'content_by_lua_block { return {} }']) {
    const single = parseSingle(input);
    assert.equal(single.status, 'ok');
    assert.equal(single.directive.complete, true);
    assert.equal(single.directive.context, null);
    assert.deepEqual(Object.keys(single).sort(), ['directive', 'errors', 'status']);
  }
  const cases = [
    ['', 'empty_input', 'empty_input'], ['# 注释', 'empty_input', 'empty_input'],
    [null, 'invalid_input', 'invalid_input'], [12, 'invalid_input', 'invalid_input'],
    ['worker_processes auto', 'parse_error', 'missing_semicolon'],
    ['"worker_processes"', 'parse_error', 'missing_semicolon'],
    ['foo; bar;', 'out_of_scope', 'multiple_directives'],
    ['http {}', 'out_of_scope', 'block_not_supported'],
    ['server { listen 80; }', 'out_of_scope', 'block_not_supported'],
    ['content_by_lua_block {} foo;', 'out_of_scope', 'multiple_directives'],
    ['foo; bar "foo; baz;', 'parse_error', 'unclosed_quote'],
    ['server { listen 80;', 'parse_error', 'unclosed_block'],
  ];
  for (const [input, status, code] of cases) {
    const single = parseSingle(input);
    assert.equal(single.status, status);
    assert.equal(single.directive, null);
    assert.equal(single.errors[0].code, code);
    assert.deepEqual(Object.keys(single).sort(), ['directive', 'errors', 'status']);
  }
  assert.equal(parseConfig('worker_processes').errors[0].code, 'missing_semicolon');
});

test('普通词法保留原 token，按 Nginx 规则处理转义和注释', () => {
  const input = String.raw`set $v "空 格 #;{} \" \\ \t\r\n \$ \;"; # 忽略
set $s '单 引号 #;{} \' ok';
set $x one\ two a\;b a\{b a\}b a\#b a#b pre${'${name}'}post;
if ($v = "x") { return 200; }
set $pattern [}] a}b;`;
  const parsed = parseConfig(input);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.directives[0].args, ['$v', '空 格 #;{} " \\ \t\r\n \\$ \\;']);
  assert.equal(parsed.directives[0].raw_args[1], '"空 格 #;{} \\" \\\\ \\t\\r\\n \\$ \\;"');
  assert.deepEqual(parsed.directives[1].args, ['$s', "单 引号 #;{} ' ok"]);
  assert.deepEqual(parsed.directives[2].args,
    ['$x', 'one\\ two', 'a\\;b', 'a\\{b', 'a\\}b', 'a\\#b', 'a#b', 'pre${name}post']);
  assert.deepEqual(parsed.directives[3].args, ['($v', '=', 'x', ')']);
  assert.deepEqual(parsed.directives[5].args, ['$pattern', '[}]', 'a}b']);
  assert.equal(parsed.directives.length, 6);
});

test('可靠性：美元后的花括号保留为词法文本，不强制变量闭合', () => {
  for (const [input, args] of [
    ['pid /tmp/${demo;', ['/tmp/${demo']],
    ['pid /tmp/${demo};', ['/tmp/${demo}']],
    ['set $out ${name;', ['$out', '${name']],
    ['set $out ${name rest};', ['$out', '${name', 'rest}']],
    ['set $out ${{name;', ['$out', '${{name']],
    ['set $out ${;', ['$out', '${']],
  ]) {
    const parsed = parseSingle(input);
    assert.equal(parsed.status, 'ok', input);
    assert.deepEqual(parsed.directive.args, args, input);
    assert.deepEqual(parsed.directive.raw_args, args, input);
    assert.equal(parsed.directive.end_offset, input.length, input);
  }
  const input = 'pid /tmp/${demo; http { server { listen 80; } }';
  const parsed = parseConfig(input);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.directives.map(item => [item.name, item.context]),
    [['pid', 'main'], ['http', 'main'], ['server', 'http'], ['listen', 'http.server']]);
  assert.equal(parsed.directives[0].end_offset, input.indexOf(';') + 1);
});

test('可靠性：美元文本不吞真实开块、转义或结构错误', () => {
  for (const [input, arg] of [
    ['wrapper ${name{ child yes; }', '${name'],
    ['wrapper $name{ child yes; }', '$name'],
    [String.raw`wrapper \${ child yes; }`, String.raw`\$`],
    [String.raw`wrapper $\{{ child yes; }`, String.raw`$\{`],
    ['wrapper "${name" { child yes; }', '${name'],
  ]) {
    const parsed = parseConfig(input);
    assert.deepEqual(parsed.errors, [], input);
    assert.equal(parsed.directives[0].kind, 'block');
    assert.deepEqual(parsed.directives[0].args, [arg]);
    assert.equal(parsed.directives[1].name, 'child');
    assert.equal(parsed.directives[1].parent_index, 0);
  }
  for (const [input, error] of [
    ['pid /tmp/${demo', 'missing_semicolon'],
    ['pid "/tmp/${demo;', 'unclosed_quote'],
    ['http { pid /tmp/${demo;', 'unclosed_block'],
    ['pid /tmp/${demo; }', 'unexpected_closing_brace'],
  ]) assert.ok(parseConfig(input).errors.some(item => item.code === error), input);
  assert.deepEqual(parseSingle('include conf/${dir;').directive.external_references,
    [{ kind: 'include', value: 'conf/${dir', status: 'not_analyzed' }]);
});

test('CRLF 与中文位置采用原始 UTF-16 坐标', () => {
  const input = '# 中文\r\n  set $v "中😀";\r\n  return 200;';
  const parsed = parseConfig(input);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual([parsed.directives[0].line, parsed.directives[0].column,
    parsed.directives[0].offset], [2, 3, input.indexOf('set')]);
  assert.deepEqual([parsed.directives[1].line, parsed.directives[1].column,
    parsed.directives[1].offset], [3, 3, input.indexOf('return')]);
  assert.equal(parsed.directives[0].end_offset, input.indexOf(';') + 1);
  const errorInput = 'set $v "中😀"x;';
  assert.deepEqual(parseConfig(errorInput).errors[0], {
    code: 'invalid_token', message: '引号参数后缺少分隔符。',
    line: 1, column: errorInput.indexOf('x;') + 1, offset: errorInput.indexOf('x;'),
  });
});

test('块头使用父 context，未知祖先及未知块不得猜测', () => {
  const parsed = parseConfig(`worker_processes auto;
http { server { listen 80; location / { location /a { return 200; }
if ($x) { set $x 1; } limit_except GET { deny all; } }
if ($x) { set $x 1; } } upstream backend { server host; }
unknown { listen 81; } }
stream { server { listen 82; } upstream backend { server host; } }
mail { server { listen 83; } } events { worker_connections 1024; }
server { location / { return 204; } }`);
  assert.deepEqual(parsed.errors, []);
  const byName = (name) => parsed.directives.filter((d) => d.name === name);
  assert.equal(parsed.directives[0].context, 'main');
  assert.equal(byName('http')[0].context, 'main');
  assert.deepEqual(byName('listen').map((d) => d.context),
    ['http.server', null, 'stream.server', 'mail.server']);
  assert.deepEqual(byName('return').map((d) => d.context), ['http.location', null]);
  assert.deepEqual(byName('set').map((d) => d.context), ['http.if.location', 'http.if.server']);
  assert.equal(byName('deny')[0].context, 'http.limit_except');
  assert.equal(byName('worker_connections')[0].context, 'events');
  assert.deepEqual(byName('server').map((d) => d.context),
    ['http', 'http.upstream', 'stream', 'stream.upstream', 'mail', 'main']);
  const nestedReturn = byName('return')[0];
  assert.deepEqual(nestedReturn.contexts, ['http', 'server', 'location', 'location']);
  assert.equal(parsed.directives[nestedReturn.parent_index].name, 'location');
  assert.equal(parsed.directives[1].end_offset, parsed.directives.find((d) => d.name === 'stream').offset - 1);
  assert.equal(parseConfig('http { unknown { http { listen 80; } } }')
    .directives.at(-1).context, null);
});

test('events 根块确定 main，块内事件槽位及位置保持不变', () => {
  const input = 'events { multi_accept on; worker_connections 65535; }';
  const parsed = parseConfig(input);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.directives, [
    { name: 'events', args: [], raw_args: [], line: 1, column: 1,
      offset: 0, end_offset: input.length, kind: 'block', contexts: [], context: 'main',
      parent_index: null, complete: true, external_references: [] },
    { name: 'multi_accept', args: ['on'], raw_args: ['on'], line: 1, column: 10,
      offset: 9, end_offset: 25, kind: 'simple', contexts: ['events'], context: 'events',
      parent_index: 0, complete: true, external_references: [] },
    { name: 'worker_connections', args: ['65535'], raw_args: ['65535'], line: 1, column: 27,
      offset: 26, end_offset: 51, kind: 'simple', contexts: ['events'], context: 'events',
      parent_index: 0, complete: true, external_references: [] },
  ]);
});

test('任一顶层普通根块均能确定 main，不依赖根块顺序', () => {
  for (const name of ['events', 'http', 'stream', 'mail']) {
    for (const input of [`worker_processes auto; ${name} {}`, `${name} {} worker_processes auto;`]) {
      const parsed = parseConfig(input);
      assert.deepEqual(parsed.errors, []);
      assert.deepEqual(parsed.directives.map((d) => d.context), ['main', 'main']);
    }
  }
});

test('无顶层普通根块时，注释、Lua 正文、同名 simple 及孤立片段不确定 main', () => {
  for (const input of [
    'worker_processes auto;', '# events {} http {}\nworker_processes auto;',
    'events; http; stream; mail;', 'set $value "http {}";',
    'content_by_lua_block { local fake = "http {}"; -- events {}\nlocal x = [[stream {} mail {}]]; }',
    'unknown { worker_processes auto; }',
    'unknown { http { server { listen 80; } } events {} stream {} mail {} }',
    'server { listen 80; location / { return 200; } }', 'location / { return 200; }', 'listen 80;',
  ]) {
    const parsed = parseConfig(input);
    assert.deepEqual(parsed.errors, [], input);
    assert.ok(parsed.directives.every((d) => d.context === null), input);
  }
});

test('根块仅补顶层 main，错误放置的 server 和未知块的孩子不继承', () => {
  const parsed = parseConfig('events {} server { listen 80; } unknown { http { listen 81; } }');
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.directives.map((d) => [d.name, d.context, d.parent_index]), [
    ['events', 'main', null], ['server', 'main', null], ['listen', null, 1],
    ['unknown', 'main', null], ['http', null, 3], ['listen', null, 4],
  ]);
});

test('根上下文补全保留 include 与 Lua 文件的外部引用元数据', () => {
  const parsed = parseConfig('include "conf/${name}.conf"; http { content_by_lua_file ${dir}/main.lua; }');
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.directives.map((d) => d.context), ['main', 'main', 'http']);
  assert.deepEqual(parsed.directives.map((d) => d.external_references), [
    [{ kind: 'include', value: 'conf/${name}.conf', status: 'not_analyzed' }], [],
    [{ kind: 'lua_file', value: '${dir}/main.lua', status: 'not_analyzed' }],
  ]);
});

test('有结构错误时，即使存在完整根块也不补顶层 main', () => {
  for (const input of [
    'events {', 'events {} http {', 'events {} worker_processes auto',
    'events {} }', 'events {} set $x "unclosed', 'events {} content_by_lua_block {',
  ]) {
    const parsed = parseConfig(input);
    assert.ok(parsed.errors.length > 0, input);
    assert.ok(parsed.directives.filter((d) => d.parent_index === null)
      .every((d) => d.context === null), input);
  }
});

test('诊断结构错误，保留可靠前缀，未闭父块的全部后代均未完成', () => {
  for (const [input, code] of [
    ['foo', 'missing_semicolon'], ['foo 1 }', 'missing_semicolon'],
    ['}', 'unexpected_closing_brace'], ['foo "x', 'unclosed_quote'],
    ['http { foo 1;', 'unclosed_block'], [';', 'invalid_token'],
    ['foo abc\\', 'invalid_token'], ['set $x ${name', 'missing_semicolon'],
  ]) {
    const parsed = parseConfig(input);
    assert.equal(parsed.errors[0].code, code);
    assert.ok(parsed.errors.every((error) => error.line >= 1 && error.column >= 1 && error.offset >= 0));
    assert.ok(parsed.directives.every((d) => d.complete === false));
  }
  const parsed = parseConfig('foo; http { good; server { bad "never; fake; } }');
  assert.deepEqual(parsed.directives.map((d) => [d.name, d.complete]),
    [['foo', true], ['http', false], ['good', false], ['server', false], ['bad', false]]);
  assert.equal(parsed.errors[0].code, 'unclosed_quote');
  assert.deepEqual(parseConfig(' # 注释\r\n \t'), { directives: [], errors: [] });
  assert.equal(parseConfig({}).errors[0].code, 'invalid_input');
});

test('Lua 仅识别边界：引号、行注释、长括号、table 均不产生配置指令', () => {
  const input = `http { server { location / { content_by_lua_block {
local x = "} # ; { \\\""; local y = '}';
-- } fake_directive;
local t = { a = { b = "}" } }
local z = [==[ } ; fake; [=[ ]=] ]==]
--[===[ } { bogus; ]==] ]===]
if true then ngx.say(x) end
} return 200; } } }`;
  const parsed = parseConfig(input);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.directives.map((d) => d.name),
    ['http', 'server', 'location', 'content_by_lua_block', 'return']);
  assert.equal(parsed.directives[3].kind, 'lua_block');
  assert.deepEqual(parsed.directives[3].args, []);
  assert.equal(parsed.directives[4].context, 'http.location');
  for (const name of LUA_BLOCK_DIRECTIVES) {
    assert.equal(parseSingle(`${name} ${name === 'set_by_lua_block' ? '$x ' : ''}{ local t = {} }`).status, 'ok');
  }
  for (const count of [0, 1, 2, 8, 80]) {
    const eq = '='.repeat(count);
    assert.equal(parseSingle(`content_by_lua_block { local x = [${eq}[ } { ]${eq}]; --[${eq}[ } ]${eq}] }`).status, 'ok');
  }
  assert.equal(parseConfig('fake_by_lua_block { real_config yes; }').directives[0].kind, 'block');
  assert.equal(parseConfig('fake_by_lua_block { real_config yes; }').directives.length, 2);
});

test('可靠性：Lua 短字符串的反斜杠 z 吞掉 ASCII 空白并保留块边界', () => {
  for (const quote of ['"', "'"]) {
    for (const gap of ['\n', '\r', '\r\n', '\n\r', ' \t\v\f\r\n ', '']) {
      const block = `content_by_lua_block { local s = ${quote}a\\z${gap}b${quote}; ngx.say(s) }`;
      const single = parseSingle(block);
      assert.equal(single.status, 'ok', JSON.stringify(block));
      assert.equal(single.directive.kind, 'lua_block');
      assert.equal(single.directive.end_offset, block.length);
      const input = `http { server { location / { ${block} return 204; } } }`;
      const parsed = parseConfig(input);
      assert.deepEqual(parsed.errors, [], JSON.stringify(input));
      assert.deepEqual(parsed.directives.map(item => item.name),
        ['http', 'server', 'location', 'content_by_lua_block', 'return']);
      assert.equal(parsed.directives[3].end_offset, input.indexOf(' return 204;'));
      assert.equal(parsed.directives[4].offset, input.indexOf('return 204;'));
      assert.equal(parsed.directives[4].context, 'http.location');
    }
  }
});

test('可靠性：Lua z 转义后仍按字符串定位花括号与下一条指令', () => {
  for (const quote of ['"', "'"]) {
    const input = `content_by_lua_block { local s = ${quote}a\\z\r\n } ; fake; { ${quote} }\r\nreturn 204;`;
    const parsed = parseConfig(input);
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(parsed.directives.map(item => item.name), ['content_by_lua_block', 'return']);
    assert.equal(parsed.directives[0].end_offset, input.indexOf('\r\nreturn'));
    assert.deepEqual([parsed.directives[1].line, parsed.directives[1].column], [3, 1]);
    assert.equal(parsed.directives[1].offset, input.indexOf('return'));
  }
});

test('可靠性：Lua z 转义不吞非ASCII空白、不掩盖转义反斜杠和未闭合', () => {
  for (const body of [
    'local s = "a\\\\z\nb"',
    'local s = "a\\z\u00a0\nb"',
    'local s = "a\\z b\nc"',
    'local s = "a\nb"',
    'local s = "a\\z\n b',
    'local s = "a\\z \t\r\n',
  ]) {
    const parsed = parseSingle(`content_by_lua_block { ${body} }`);
    assert.equal(parsed.status, 'parse_error', JSON.stringify(body));
    assert.equal(parsed.errors[0].code, 'unclosed_lua_block');
  }
  assert.equal(parseSingle(String.raw`content_by_lua_block { local s = "a\\z" }`).status, 'ok');
  assert.equal(parseSingle('content_by_lua_block { local s = "a\\z\n b"').errors[0].code, 'unclosed_lua_block');
});

test('Lua 未闭字符串、注释或 table 都停止扫描，不误识别后续配置', () => {
  for (const tail of ['"unclosed } fake;', "'unclosed } fake;", '[==[ } fake; ]=]',
    '--[=[ } fake;', '-- } fake;', '{ a = 1 }', '"bad\n} fake;']) {
    const parsed = parseConfig(`before; http { content_by_lua_block { ${tail}`);
    assert.equal(parsed.errors[0].code, 'unclosed_lua_block');
    assert.deepEqual(parsed.directives.map((d) => [d.name, d.complete]),
      [['before', true], ['http', false], ['content_by_lua_block', false]]);
    assert.equal(parseSingle(`content_by_lua_block { ${tail}`).status, 'parse_error');
  }
  assert.equal(parseSingle('content_by_lua_block { local x = "a\\\r\nb" }').status, 'ok');
});

test('include 与白名单 Lua 文件只记录引用，保留变量，不按后缀识别', () => {
  const parsed = parseConfig('include "conf/${name}.conf"; content_by_lua_file ${dir}/main.lua;'
    + 'set_by_lua_file $target "path with spaces.lua" arg; fake_by_lua_file ignored;');
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.directives.map((d) => d.external_references), [
    [{ kind: 'include', value: 'conf/${name}.conf', status: 'not_analyzed' }],
    [{ kind: 'lua_file', value: '${dir}/main.lua', status: 'not_analyzed' }],
    [{ kind: 'lua_file', value: 'path with spaces.lua', status: 'not_analyzed' }], [],
  ]);
  assert.deepEqual(parseSingle('content_by_lua_file;').directive.external_references, []);
});

test('Lua 白名单与锁定源码注册及 block 回调保持完整一致', () => {
  for (const [subsystem, component, blocks, files] of [
    ['http', 'lua-nginx-module', HTTP_LUA_BLOCK_DIRECTIVES, HTTP_LUA_FILE_DIRECTIVES],
    ['stream', 'stream-lua-nginx-module', STREAM_LUA_BLOCK_DIRECTIVES, STREAM_LUA_FILE_DIRECTIVES],
  ]) {
    const sourceRoot = new URL(`../repos/${component}/src/`, import.meta.url);
    const moduleSource = readFileSync(new URL(`ngx_${subsystem}_lua_module.c`, sourceRoot), 'utf8');
    const registrations = [...moduleSource.matchAll(/\{ ngx_string\("([^"]+)"\),([\s\S]*?)\},/g)];
    const registeredBlocks = registrations.filter((match) => /NGX_CONF_BLOCK/.test(match[2])
      && match[1].includes('by_lua')).map((match) => match[1]);
    const registeredFiles = registrations.filter((match) => match[1].endsWith('_by_lua_file'));
    assert.deepEqual([...blocks].sort(), registeredBlocks.sort());
    assert.deepEqual(Object.keys(files).sort(), registeredFiles.map((match) => match[1]).sort());
    const sources = readdirSync(sourceRoot).filter((name) => name.endsWith('.c'))
      .map((name) => readFileSync(new URL(name, sourceRoot), 'utf8')).join('\n');
    for (const match of registrations.filter((item) => blocks.includes(item[1]))) {
      const callback = match[2].match(/,\s*(ngx_\w+),/)[1];
      const body = sources.match(new RegExp(`\\n${callback}\\([^]*?\\n\\}`));
      assert.ok(body, callback);
      assert.ok(body[0].includes(`ngx_${subsystem}_lua_conf_lua_block_parse`), callback);
    }
    assert.ok(registeredFiles.every((match) => /_file\s*$/.test(match[2].trim())));
    for (const match of registeredFiles) {
      const callback = match[2].match(/,\s*(ngx_\w+),/)[1];
      const body = sources.match(new RegExp(`\\n${callback}\\([^]*?\\n\\}`));
      assert.ok(body, callback);
      assert.ok(body[0].includes(`value[${files[match[1]] + 1}]`), match[1]);
    }
  }
});

test('四类 handler 仅在源码允许的父 context 内分类，块头保持普通块', () => {
  for (const [name, args, body, parents] of [
    ['map', '$host $v', 'example.test backend;', ['http', 'stream']],
    ['geo', '$v', '127.0.0.1 1;', ['http', 'stream']],
    ['split_clients', '$key $v', '25% a; * b;', ['http', 'stream']],
    ['types', '', 'text/html html;', ['http', 'http.server', 'http.location']],
  ]) {
    for (const parent of parents) {
      const block = `${name} ${args} { ${body} }`;
      const input = parent === 'http.server' ? `http { server { ${block} } }`
        : parent === 'http.location' ? `http { server { location / { ${block} } } }`
          : `${parent} { ${block} }`;
      const parsed = parseConfig(input);
      assert.deepEqual(parsed.errors, [], input);
      const head = parsed.directives.find(d => d.name === name);
      assert.equal(head.kind, 'block');
      assert.equal(head.context, parent);
      const entries = parsed.directives.filter(d => d.parent_index === parsed.directives.indexOf(head));
      assert.ok(entries.length > 0);
      assert.ok(entries.every(d => d.kind === 'block_entry' && d.entry_role === 'data'));
    }
    for (const input of [
      `${name} ${args} { ${body} }`, `events { ${name} ${args} { ${body} } }`,
      `mail { ${name} ${args} { ${body} } }`, `http { unknown { ${name} ${args} { ${body} } } }`,
      `stream { server { ${name} ${args} { ${body} } } }`,
      ...(name === 'types' ? ['http { server { if ($v) { types { text/html html; } } } }',
        'http { server { location / { limit_except GET { types { text/html html; } } } } }']
        : [`http { server { ${name} ${args} { ${body} } } }`,
          `http { server { location / { ${name} ${args} { ${body} } } } }`]),
    ]) {
      const parsed = parseConfig(input);
      assert.deepEqual(parsed.errors, [], input);
      assert.ok(parsed.directives.every(d => d.kind !== 'block_entry'), input);
    }
  }
});

test('handler 控制项按子系统及 token 数区分，普通规则不冒充 Lua 外部文件', () => {
  const parsed = parseConfig(`http {
map $host $v { hostnames; volatile; default a; hostnames b; volatile c; content_by_lua_file d; include map.conf; }
geo $v { ranges; proxy_recursive; proxy 127.0.0.1; default 0; delete 127.0.0.2; 127.0.0.1 1; include geo.conf; }
types { text/html html; content_by_lua_file lua; include types.conf; }
split_clients $key $v { 25% a; * b; include ignored.conf; content_by_lua_file c; }
}
stream { geo $v { ranges; proxy_recursive; proxy 127.0.0.1; default 0; delete 127.0.0.2; include stream.conf; } }`);
  assert.deepEqual(parsed.errors, []);
  const entries = parsed.directives.filter(d => d.kind === 'block_entry');
  assert.deepEqual(entries.map(d => d.entry_role), [
    'control', 'control', 'control', 'data', 'data', 'data', 'control',
    'control', 'control', 'control', 'control', 'control', 'data', 'control',
    'data', 'data', 'control', 'data', 'data', 'data', 'data',
    'control', 'data', 'data', 'control', 'control', 'control',
  ]);
  assert.deepEqual(entries.flatMap(d => d.external_references),
    ['map.conf', 'geo.conf', 'types.conf', 'stream.conf'].map(value =>
      ({ kind: 'include', value, status: 'not_analyzed' })));
  for (const input of ['http { map $x $y { hostnames a b; volatile a b; } }',
    'http { geo $v { ranges value; proxy_recursive value; } }']) {
    assert.ok(parseConfig(input).directives.filter(d => d.kind === 'block_entry')
      .every(d => d.entry_role === 'data'));
  }
});

test('handler 数据保留引号、注释、父块及原文 UTF-16 定位，不做参数语义验证', () => {
  const input = 'http {\r\n map $x $y { # 注释\r\n  "example.test #;{}" "中😀";\r\n }\r\n}';
  const parsed = parseConfig(input);
  assert.deepEqual(parsed.errors, []);
  const item = parsed.directives[2];
  assert.equal(item.kind, 'block_entry');
  assert.equal(item.name, 'example.test #;{}');
  assert.deepEqual(item.args, ['中😀']);
  assert.deepEqual(item.raw_args, ['"中😀"']);
  assert.deepEqual([item.line, item.column, item.offset], [3, 3, input.indexOf('"example')]);
  assert.equal(item.end_offset, input.indexOf(';\r\n') + 1);
  assert.deepEqual(item.contexts, ['http', 'map']);
  assert.equal(item.parent_index, 1);
  for (const input of ['http { split_clients $x $y { invalid-percent x; } }',
    'http { geo $v { not-an-address 1; } }']) assert.deepEqual(parseConfig(input).errors, []);
});

test('四类 handler 保留结构诊断，并优先拒绝嵌套开块包括 Lua 名字', () => {
  for (const [name, args, row] of [['map', '$x $y', 'example.test x'],
    ['geo', '$v', '127.0.0.1 1'], ['types', '', 'text/html html'],
    ['split_clients', '$x $y', '25% x']]) {
    for (const [tail, code] of [[`${row} } }`, 'missing_semicolon'],
      ['"never', 'unclosed_quote'], [`${row};`, 'unclosed_block'],
      ['nested {} } }', 'unexpected_opening_brace'],
      ['content_by_lua_block { local x = {} } } }', 'unexpected_opening_brace']]) {
      const input = `http { ${name} ${args} { ${tail}`;
      const parsed = parseConfig(input);
      assert.equal(parsed.errors[0].code, code, input);
      assert.ok(parsed.directives.every(d => !d.complete), input);
      if (code === 'unexpected_opening_brace') {
        assert.equal(parsed.errors[0].offset, input.indexOf('{', input.indexOf('{', input.indexOf('{') + 1) + 1));
        assert.ok(parsed.directives.every(d => d.kind !== 'lua_block'));
        assert.equal(parsed.directives.at(-1).kind, 'block_entry');
      }
    }
  }
  assert.equal(parseSingle('types { text/html html; }').status, 'out_of_scope');
  assert.equal(parseSingle('default value;').directive.kind, 'simple');
});

test('公共入口及其模块无 Node、DOM、网络和文件依赖', () => {
  for (const file of ['core.mjs', 'parser.mjs', 'matcher.mjs', 'contexts.mjs', 'lua-directives.mjs']) {
    const source = readFileSync(new URL(`../src/core/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\b(?:node:|document\.|window\.|fetch\(|process\.|require\()/);
  }
});
