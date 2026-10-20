import { caseMismatchFindings, isDataBlockEntry } from './input-resolution.mjs';

// “配置校验”结果：完全由宿主根据解析器与匹配器的输出确定性地计算，不经过模型，
// 也不写入模型输出或用户消息以外的内容。issues 里只有三类文字：
//   1. 解析器自己的固定中文 message（语法错误）；
//   2. 指令名（用户配置里的写法，限长 100 字符）与索引里的规范名；
//   3. 本文件里的固定文案模板。
// 数据形状见 buildValidation 的注释；前端按这个形状展示，字段名不能改。

// 每个检查最多保留的问题条数，超出部分丢弃（不计数、不提示）。
export const VALIDATION_ISSUE_LIMIT = 20;
// 单条 message 的最大长度（字符），超出截断并加省略号。
export const VALIDATION_MESSAGE_MAX = 200;
// 指令名在 message 中的展示上限：用户写法可能是任意长的标识符，只截断展示。
const NAME_MAX = 100;
// 建议名称（大小写不同的索引原名）最多列出的个数。
const SUGGESTION_LIMIT = 5;
// 固定常量：本次校验没有覆盖的内容。顺序与文字是契约的一部分，前端原样展示。
export const NOT_CHECKED = Object.freeze(['参数个数与取值', '重复或冲突', '指令所需模块是否可用', 'include 文件、证书路径与变量是否存在']);

// 截断后总长度（含省略号）不超过 max。
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const name = value => clip(String(value), NAME_MAX);
const message = text => clip(text, VALIDATION_MESSAGE_MAX);
// 行号、列号只接受正整数；解析器给出的值本来就是，这里防御性地兜底，避免把意外类型带到前端。
const int = (value, fallback = 1) => (Number.isInteger(value) && value >= 1 ? value : fallback);

// 把某个检查的问题数组整理成 { status, issues }：按上限截断。
const finish = (status, issues) => ({ status, issues: issues.slice(0, VALIDATION_ISSUE_LIMIT) });

// 计算校验结果。
// analysis：knowledgeTools 的 bundle.analysis（parsed.directives / parsed.errors，以及与指令按下标一一对应的 matches）；
// indexDirectives：知识索引里的指令条目（用于大小写建议）。
// 返回 null 表示“无配置可校验”：没有任何指令也没有语法错误，或所有指令都只是名称查询（kind === 'name'，没有配置内容）。
// 否则返回：
// {
//   verdict: 'pass' | 'fail' | 'needs_input',   任一检查 fail → fail；否则任一 needs_input → needs_input；否则 pass
//   checks: [
//     { id: 'syntax', title: '语法', status: 'pass'|'fail', issues: [{ line, column, message }] },
//     { id: 'directive_names', title: '指令名（区分大小写）', status: 'pass'|'fail'|'skipped', issues: [{ line, name, message, suggestions? }] },
//     { id: 'context', title: '上下文', status: 'pass'|'fail'|'needs_input'|'skipped', issues: [{ line, name, message }] },
//   ],
//   notChecked: NOT_CHECKED 的副本,
// }
// 行号与前端“第 N 行”口径一致：都取 parsed.directives[i].line / parsed.errors[j].line，即相对于本次解析的配置原文。
//
// 与宿主“待补充”闸门（session.mjs 的 pendingInput）的一致性：verdict === 'pass' 当且仅当
// 没有语法错误、至少有一条指令，且每条指令的匹配状态都是 matched / block_entry。
// 因此每一种非 matched/block_entry 的状态都必须落到某个非 pass 的检查里（见下面的映射）：
//   incomplete_directive（invalid_input）→ 语法 fail（指令缺少分号或闭括号；通常与解析器错误同时出现，只在解析器没报错时单独补一条）
//   unknown                          → 指令名 fail（数据块内的条目除外，见下）
//   context_mismatch / context_conflict / module_mismatch / 其他 invalid_input / invalid_index → 上下文 fail
//   context_required / ambiguous     → 上下文 needs_input
//   数据块（map/geo 等）内因缺少外层而被判 unknown 的条目：它们是数据而不是指令，不属于指令名检查；
//     但宿主仍因其状态不是 matched 而待补充，所以归入上下文 needs_input（需要补充外层才能分析），保证与闸门一致。
export function buildValidation(analysis, indexDirectives) {
  const parsed = analysis?.parsed;
  const directives = parsed?.directives ?? [];
  const errors = parsed?.errors ?? [];
  if (!directives.length && !errors.length) return null;
  // 全部是“名称查询”（单个指令名，不是配置）：没有配置内容可校验。
  if (directives.length && directives.every(item => item?.kind === 'name')) return null;
  const matches = analysis.matches ?? [];

  // ---- 语法 ----
  const syntaxIssues = errors.map(error => ({ line: int(error?.line), column: int(error?.column), message: message(String(error?.message ?? '配置语法错误。')) }));
  if (!errors.length) {
    directives.forEach((item, i) => {
      if (matches[i]?.status === 'invalid_input' && matches[i]?.reason === 'incomplete_directive') {
        syntaxIssues.push({ line: int(item?.line), column: int(item?.column), message: message(`${name(item?.name)} 指令不完整（缺少分号或闭括号）。`) });
      }
    });
  }
  const syntaxFailed = syntaxIssues.length > 0;
  const syntax = { id: 'syntax', title: '语法', ...finish(syntaxFailed ? 'fail' : 'pass', syntaxIssues) };

  // 语法失败：解析结果不可靠，后两项都不检查。
  if (syntaxFailed) {
    return {
      verdict: 'fail',
      checks: [syntax, { id: 'directive_names', title: '指令名（区分大小写）', status: 'skipped', issues: [] }, { id: 'context', title: '上下文', status: 'skipped', issues: [] }],
      notChecked: [...NOT_CHECKED],
    };
  }

  // ---- 指令名 ----
  const findings = new Map(caseMismatchFindings(analysis, indexDirectives).map(item => [item.index, item]));
  const nameIssues = [];
  const contextIssues = [];
  let contextStatus = 'pass';
  // 上下文检查里 fail 优先于 needs_input。
  const raise = status => { if (status === 'fail' || contextStatus === 'pass') contextStatus = status; };
  directives.forEach((item, i) => {
    const match = matches[i] ?? {};
    const status = match.status;
    if (status === 'matched' || status === 'block_entry') return;
    const line = int(item?.line);
    const shown = name(item?.name);
    if (status === 'unknown') {
      if (isDataBlockEntry(item, directives)) {
        // 数据块内的条目不是指令：不算指令名问题，但缺少外层、无法分析，仍需补充（与闸门一致）。
        contextIssues.push({ line, name: shown, message: message(`${shown} 位于数据块内，需要补充外层配置才能分析。`) });
        raise('needs_input');
        return;
      }
      const found = findings.get(i);
      if (found) {
        const suggestions = found.forms.slice(0, SUGGESTION_LIMIT).map(form => name(form));
        nameIssues.push({ line, name: shown, message: message(`Nginx 指令名区分大小写，${shown} 不是有效的指令名；索引中有 ${suggestions.join('、')}`), suggestions });
      } else {
        nameIssues.push({ line, name: shown, message: message(`索引中没有 ${shown}`) });
      }
      return;
    }
    // ---- 上下文：只看名称已收录的指令 ----
    if (status === 'context_mismatch') {
      // effective_context 是匹配器实际采用的层级（解析器给出的所在层级，或请求指定的上下文）。
      const level = typeof match.effective_context === 'string' && match.effective_context ? name(match.effective_context) : '未知';
      contextIssues.push({ line, name: shown, message: message(`${shown} 不能出现在当前上下文（所在层级 ${level}）`) });
      raise('fail');
    } else if (status === 'context_required' || status === 'ambiguous') {
      contextIssues.push({ line, name: shown, message: message(`${shown} 需要补充上下文或模块`) });
      raise('needs_input');
    } else if (status === 'context_conflict') {
      contextIssues.push({ line, name: shown, message: message(`${shown} 与指定的上下文冲突`) });
      raise('fail');
    } else if (status === 'module_mismatch') {
      contextIssues.push({ line, name: shown, message: message(`${shown} 不属于指定的模块`) });
      raise('fail');
    } else {
      // invalid_input（非“指令不完整”）、invalid_index 等：宿主无法给出可靠的匹配结果，按失败处理。
      contextIssues.push({ line, name: shown, message: message(`${shown} 无法完成匹配（输入选项或知识索引无效）`) });
      raise('fail');
    }
  });
  const names = { id: 'directive_names', title: '指令名（区分大小写）', ...finish(nameIssues.length ? 'fail' : 'pass', nameIssues) };
  const context = { id: 'context', title: '上下文', ...finish(contextStatus, contextIssues) };
  const checks = [syntax, names, context];
  const verdict = checks.some(check => check.status === 'fail') ? 'fail' : checks.some(check => check.status === 'needs_input') ? 'needs_input' : 'pass';
  return { verdict, checks, notChecked: [...NOT_CHECKED] };
}
