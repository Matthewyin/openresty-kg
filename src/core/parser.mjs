import { childContext, blockHandler } from './contexts.mjs';
import { LUA_BLOCK_DIRECTIVES, LUA_FILE_DIRECTIVES } from './lua-directives.mjs';

const luaBlocks = new Set(LUA_BLOCK_DIRECTIVES);
const whitespace = (ch) => ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';

function positions(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\r') {
      if (text[i + 1] === '\n') i++;
      starts.push(i + 1);
    } else if (text[i] === '\n') starts.push(i + 1);
  }
  return (offset) => {
    let lo = 0;
    let hi = starts.length;
    while (lo + 1 < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (starts[mid] <= offset) lo = mid;
      else hi = mid;
    }
    return { line: lo + 1, column: offset - starts[lo] + 1, offset };
  };
}

function diagnostic(at, code, message, offset) {
  return { code, message, ...at(offset) };
}

function decode(value) {
  // ngx_conf_read_token 只转换这些转义；例如 \; 和 \$ 保留反斜杠。
  return value.replace(/\\(["'\\trn])/g, (_, ch) => ({ t: '\t', r: '\r', n: '\n' }[ch] ?? ch));
}

function skipTrivia(text, start) {
  let i = start;
  while (i < text.length) {
    if (whitespace(text[i])) i++;
    else if (text[i] === '#') {
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++;
    } else break;
  }
  return i;
}

function token(text, start, at) {
  const quote = text[start] === '"' || text[start] === "'" ? text[start] : null;
  let i = start + (quote ? 1 : 0);
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      if (i + 1 === text.length) {
        return { end: text.length, error: diagnostic(at, quote ? 'unclosed_quote' : 'invalid_token',
          quote ? '引号未闭合。' : '转义字符后缺少内容。', quote ? start : i) };
      }
      i += 2;
      continue;
    }
    if (quote) {
      if (ch === quote) {
        const end = i + 1;
        const next = text[end];
        if (end < text.length && !whitespace(next) && ![';', '{', ')'].includes(next)) {
          return { end, error: diagnostic(at, 'invalid_token', '引号参数后缺少分隔符。', end) };
        }
        return { raw: text.slice(start, end), value: decode(text.slice(start + 1, i)), start, end };
      }
    } else {
      // Nginx 保留美元后连续的开花括号，不在词法层检查变量闭合。
      if (ch === '$') while (text[i + 1] === '{') i++;
      if (whitespace(ch) || ch === ';' || ch === '{') break;
    }
    i++;
  }
  if (quote) {
    return { end: i, error: diagnostic(at, 'unclosed_quote', '引号未闭合。', start) };
  }
  return { raw: text.slice(start, i), value: decode(text.slice(start, i)), start, end: i };
}

function longBracket(text, start) {
  if (text[start] !== '[') return null;
  let i = start + 1;
  while (text[i] === '=') i++;
  if (text[i] !== '[') return null;
  return { end: i + 1, close: ']' + text.slice(start + 1, i) + ']' };
}

function luaEnd(text, open, at) {
  let i = open + 1;
  let depth = 1;
  const failure = (offset, message) => ({ end: text.length,
    error: diagnostic(at, 'unclosed_lua_block', message, offset) });
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      const start = i++;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') {
          i++;
          if (text[i] === 'z') {
            i++;
            while (i < text.length && /[ \t\v\f\r\n]/.test(text[i])) i++;
            continue;
          }
          if (text[i] === '\r' && text[i + 1] === '\n') i++;
          i++;
        } else if (text[i] === '\r' || text[i] === '\n') {
          return failure(start, 'Lua 短字符串未闭合。');
        } else i++;
      }
      if (i >= text.length) return failure(start, 'Lua 短字符串未闭合。');
      i++;
      continue;
    }
    const comment = text.startsWith('--', i);
    const bracket = longBracket(text, i + (comment ? 2 : 0));
    if (bracket) {
      const close = text.indexOf(bracket.close, bracket.end);
      if (close === -1) return failure(i, comment ? 'Lua 长注释未闭合。' : 'Lua 长字符串未闭合。');
      i = close + bracket.close.length;
      continue;
    }
    if (comment) {
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return { end: i + 1 };
    i++;
  }
  return failure(open, 'Lua 块缺少闭括号。');
}

function externalReferences(name, args) {
  const fileArg = Object.hasOwn(LUA_FILE_DIRECTIVES, name) ? LUA_FILE_DIRECTIVES[name] : null;
  const value = name === 'include' ? args[0] : fileArg === null ? undefined : args[fileArg];
  return value === undefined ? [] : [{ kind: name === 'include' ? 'include' : 'lua_file',
    value, status: 'not_analyzed' }];
}

function parse(text, allowName) {
  if (typeof text !== 'string') {
    return { directives: [], errors: [{ code: 'invalid_input', message: '输入必须是字符串。',
      line: 1, column: 1, offset: 0 }] };
  }
  const at = positions(text);
  const directives = [];
  const errors = [];
  const stack = [];
  let pending = [];
  let i = 0;

  const add = (kind, end, complete) => {
    const parent = stack.at(-1);
    const handler = parent?.handler;
    const name = pending[0].value;
    const args = pending.slice(1).map((item) => item.value);
    const include = handler?.include && name === 'include' && args.length === 1;
    const directive = {
      name, args, raw_args: pending.slice(1).map((item) => item.raw),
      ...at(pending[0].start), end_offset: end, kind: handler ? 'block_entry' : kind,
      contexts: stack.map((item) => directives[item.index].name),
      context: parent?.context ?? null, parent_index: parent?.index ?? null, complete,
      external_references: handler ? (include ? externalReferences('include', args) : [])
        : externalReferences(name, args),
    };
    if (handler) directive.entry_role = include || (Object.hasOwn(handler.controls, name)
      && handler.controls[name] === args.length) ? 'control' : 'data';
    directives.push(directive);
    pending = [];
    return directive;
  };

  while (i < text.length) {
    i = skipTrivia(text, i);
    if (i >= text.length) break;
    const ch = text[i];
    // ngx_conf_file.c 的自定义 handler 在调用前拒绝开块，Lua 名字也不能绕过。
    if (ch === '{' && stack.at(-1)?.handler) {
      if (pending.length) add('simple', i + 1, false);
      errors.push(diagnostic(at, 'unexpected_opening_brace', '块内数据或控制项不允许嵌套配置块。', i));
      break;
    }
    if (ch === '}') {
      if (pending.length) {
        add('simple', i, false);
        errors.push(diagnostic(at, 'missing_semicolon', '闭括号前缺少分号。', i));
        break;
      }
      if (!stack.length) {
        errors.push(diagnostic(at, 'unexpected_closing_brace', '没有对应开块的闭括号。', i));
        break;
      }
      directives[stack.pop().index].end_offset = ++i;
      continue;
    }
    if (ch === ';' || ch === '{') {
      if (!pending.length) {
        errors.push(diagnostic(at, 'invalid_token', '分隔符前缺少指令名称。', i));
        break;
      }
      if (ch === ';') {
        add('simple', ++i, true);
      } else if (luaBlocks.has(pending[0].value)) {
        const end = luaEnd(text, i, at);
        add('lua_block', end.end, !end.error);
        i = end.end;
        if (end.error) {
          errors.push(end.error);
          break;
        }
      } else {
        const open = i++;
        const directive = add('block', i, true);
        stack.push({ index: directives.length - 1, open,
          context: childContext(directive.name, directive.context, stack.length === 0),
          handler: blockHandler(directive.name, directive.context) });
      }
      continue;
    }
    const item = token(text, i, at);
    i = item.end;
    if (item.error) {
      if (pending.length) add('simple', i, false);
      errors.push(item.error);
      break;
    }
    pending.push(item);
  }

  if (pending.length) {
    const only = pending[0];
    if (allowName && !directives.length && pending.length === 1
        && /^[A-Za-z_][A-Za-z0-9_-]*$/.test(only.raw)) {
      add('name', only.end, true);
    } else {
      add('simple', i, false);
      errors.push(diagnostic(at, 'missing_semicolon', '指令缺少分号。', i));
    }
  }
  if (stack.length) {
    for (const block of stack) {
      errors.push(diagnostic(at, 'unclosed_block', '配置块缺少闭括号。', block.open));
      directives[block.index].end_offset = i;
    }
    for (let j = stack[0].index; j < directives.length; j++) directives[j].complete = false;
  }
  return { directives, errors };
}

export function parseConfig(text, { mode = 'fragment' } = {}) {
  if (!['fragment', 'main'].includes(mode)) return { directives: [], errors: [
    { code: 'invalid_input', message: '配置模式必须为片段或完整主配置。', line: 1, column: 1, offset: 0 },
  ] };
  const result = parse(text, false);
  if (!result.errors.length && (mode === 'main' || result.directives.some((d) => d.parent_index === null
      && d.kind === 'block' && d.complete && childContext(d.name, null, true) !== null))) {
    for (const directive of result.directives) {
      if (directive.parent_index === null) directive.context = 'main';
    }
  }
  return result;
}

export function parseSingle(text) {
  const { directives, errors } = parse(text, true);
  if (errors.length) {
    return { status: typeof text === 'string' ? 'parse_error' : 'invalid_input', directive: null, errors };
  }
  if (!directives.length) {
    return { status: 'empty_input', directive: null,
      errors: [diagnostic(positions(text), 'empty_input', '输入中没有指令。', 0)] };
  }
  const block = directives.find((item) => item.kind === 'block');
  if (block) {
    return { status: 'out_of_scope', directive: null,
      errors: [{ code: 'block_not_supported', message: '单项查询不支持普通配置块。',
        line: block.line, column: block.column, offset: block.offset }] };
  }
  if (directives.length > 1) {
    const second = directives[1];
    return { status: 'out_of_scope', directive: null,
      errors: [{ code: 'multiple_directives', message: '单项查询只接受一条指令。',
        line: second.line, column: second.column, offset: second.offset }] };
  }
  return { status: 'ok', directive: directives[0], errors: [] };
}
