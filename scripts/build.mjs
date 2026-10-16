import { readFile, writeFile, mkdir, cp, rename } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { stripComments } from './inventory.mjs';
import { validateIndex, validateDetail, validateReferences, deriveVerification } from '../src/query/knowledge.mjs';
import { validSource } from '../src/core/source.mjs';

const CONTEXT_FLAGS = {
  NGX_MAIN_CONF: 'main', NGX_EVENT_CONF: 'events', NGX_HTTP_MAIN_CONF: 'http',
  NGX_HTTP_SRV_CONF: 'http.server', NGX_HTTP_LOC_CONF: 'http.location',
  NGX_HTTP_UPS_CONF: 'http.upstream', NGX_HTTP_LIF_CONF: 'http.if.location',
  NGX_HTTP_SIF_CONF: 'http.if.server', NGX_HTTP_LMT_CONF: 'http.limit_except',
  NGX_STREAM_MAIN_CONF: 'stream', NGX_STREAM_SRV_CONF: 'stream.server',
  NGX_STREAM_UPS_CONF: 'stream.upstream', NGX_MAIL_MAIN_CONF: 'mail', NGX_MAIL_SRV_CONF: 'mail.server'
};
const CONTROL_FLAGS = new Set(['NGX_DIRECT_CONF']);
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && !['.', '..'].includes(value);
const json = value => JSON.stringify(value, null, 2) + '\n';

export function validateCatalogScope(matrix, catalog) {
  const fields = ['component', 'module', 'array', 'file', 'line', 'end_line', 'name', 'flags', 'context_flags', 'callback', 'post', 'compile_guards'];
  const signature = record => JSON.stringify(fields.map(field => record[field]));
  const allComponents = [...matrix.components, ...(matrix.department_extensions?.components ?? [])];
  const components = new Set(allComponents.map(item => item.component));
  if (components.size !== allComponents.length || catalog.directives.some(item => !components.has(item.component))) throw new Error('目录与范围证据的组件身份不一致');
  for (const component of allComponents) {
    const records = catalog.directives.filter(item => item.component === component.component);
    if (records.length !== (component.registrations ?? 0)) throw new Error(`${component.component}: 目录与范围证据注册数量不一致`);
    if (records.some(record => JSON.stringify(record.source) !== JSON.stringify(component.source))) throw new Error(`${component.component}: 目录来源与范围证据不一致`);
    if (!component.registration_build) continue;
    const expected = component.registration_build.registrations.map(signature).sort();
    const actual = records.filter(item => !item.distribution_patch).map(signature).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error(`${component.component}: 目录与正式构建注册身份或字段不一致`);
    const added = component.patch_scope?.added ?? [];
    const patched = records.filter(item => item.distribution_patch);
    if (patched.length !== added.length || patched.some(item => !added.some(proof => proof.module === item.module
      && proof.name === item.name && proof.patch === item.file && proof.target_file === item.distribution_patch.target_file
      && proof.patched_sha256 === item.distribution_patch.patched_sha256))) throw new Error(`${component.component}: 目录与发行新增注册证据不一致`);
  }
}

export function prepareKnowledgeFacts(curated, sources, component, componentPatchStatus, sourceKind = 'bundled') {
  const evidenceIds = sources.filter(source => !['registration', 'configuration-definition', 'distribution-version'].includes(source.id)).map(source => source.id);
  const componentKnown = component !== 'nginx' && componentPatchStatus === 'verified_unaffected'
    && sources.some(source => source.id === 'distribution-version');
  const patch = curated?.patch_status === undefined ? {
    status: sourceKind === 'department_extension' ? 'not_applicable' : componentKnown ? 'verified_unaffected' : 'unverified',
    note: sourceKind === 'department_extension' ? '本项仅研究独立上游 commit 快照，不属于本站发行补丁处理范围；现场补丁、安装及兼容性未知。' : componentKnown ? '发行版脚本获取此模块对应 tag，未对其源码执行补丁；模块启用条件仍需按环境核实。'
      : '需要对 OpenResty 的有效补丁及当前指令链路逐项核对，当前仅引用上游代码。',
    source_ids: sourceKind === 'department_extension' ? ['module-build', 'registration'] : componentKnown ? ['distribution-version'] : [],
  } : structuredClone(curated.patch_status);
  if (!patch || !['verified_affected', 'verified_unaffected', 'unverified', 'not_applicable'].includes(patch.status)
    || typeof patch.note !== 'string' || !patch.note.trim() || !Array.isArray(patch.source_ids)
    || patch.source_ids.some(id => typeof id !== 'string' || !sources.some(source => source.id === id))) throw new Error('patch_status 的状态、说明或证据无效');
  if ((patch.status === 'not_applicable') !== (sourceKind === 'department_extension')) throw new Error('扩展与发行补丁处理范围不一致');
  const patchKnown = patch.status !== 'unverified';
  if (patchKnown && !patch.source_ids.length) throw new Error('已核实 patch_status 必须提供证据');
  if (patch.status === 'verified_affected' && !patch.source_ids.some(id => sources.some(source => source.id === id && source.kind === 'openresty_patch'))) throw new Error('已核对补丁影响必须引用固定版本补丁片段');
  const fact = value => {
    const result = structuredClone(value);
    if (result?.status === 'verified' && (!patchKnown || !result.source_ids?.length)) result.status = 'unverified';
    return result;
  };
  return {
    patchKnown, patch_status: patch,
    defaults: fact(curated?.defaults === undefined ? {
      status: curated?.default != null ? 'verified' : 'unverified', text: curated?.default ?? null,
      source_ids: curated?.default != null ? evidenceIds : [],
    } : curated.defaults),
    inheritance: fact(curated?.inheritance === undefined ? { status: 'unverified', text: null, source_ids: [] } : curated.inheritance),
    limitations: (curated?.limitations ?? []).map(item => fact(typeof item === 'string'
      ? { text: item, status: 'verified', source_ids: evidenceIds } : item)),
  };
}

export function validatePublication(index, details, references) {
  validateIndex(index);
  if (!Array.isArray(details) || details.length !== index.directives.length) throw new Error('发布详情数量与索引不一致');
  const byId = new Map();
  for (const detail of details) {
    if (!detail || byId.has(detail.id)) throw new Error('发布详情标识缺失或重复');
    byId.set(detail.id, detail);
  }
  for (const entry of index.directives) {
    try {
      const detail = validateDetail(byId.get(entry.id), entry, index);
      const patchKnown = detail.patch_status.status !== 'unverified';
      if (patchKnown && !detail.patch_status.source_ids.length) throw new Error('已核实补丁状态没有证据');
      if (detail.patch_status.status === 'verified_affected' && !detail.patch_status.source_ids.some(id => detail.sources.some(source => source.id === id && source.kind === 'openresty_patch'))) throw new Error('补丁影响缺少补丁片段');
      for (const fact of [detail.defaults, detail.inheritance, ...detail.limitations]) {
        if (fact.status === 'verified' && (!patchKnown || !fact.source_ids.length)) throw new Error('已核实事实缺少已核对补丁状态或事实证据');
      }
      if (detail.verification !== 'registration_only' && (!detail.summary?.trim() || !detail.syntax?.trim()
        || !detail.contexts_verified || !patchKnown || !detail.sources.some(source => source.id === 'registration')
        || !detail.sources.some(source => source.id === 'configuration-definition')
        || !detail.configuration_entry.symbol || !detail.configuration_entry.source_ids.includes('configuration-definition'))) throw new Error('基础核对状态缺少必需内容或配置入口证据');
    } catch (error) { throw new Error(`${entry.id}: ${error.message}`, { cause: error }); }
  }
  if (index.references_path !== undefined) validateReferences(references, index);
  return index;
}

export async function build(configPath) {
  const root = dirname(resolve(configPath));
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const matrix = JSON.parse(await readFile(resolve(root, config.analysis_dir, 'components.json'), 'utf8'));
  const catalog = JSON.parse(await readFile(resolve(root, config.analysis_dir, 'directives/catalog.json'), 'utf8'));
  const extensionSources = config.department_extensions ?? [];
  const extensionMatrix = matrix.department_extensions ?? { scope_complete: true, components: [] };
  if (!Array.isArray(extensionSources) || !Array.isArray(extensionMatrix.components)
    || new Set([...config.sources, ...extensionSources].map(item => item.component)).size !== config.sources.length + extensionSources.length
    || JSON.stringify(extensionSources.map(item => item.component).sort()) !== JSON.stringify(extensionMatrix.components.map(item => item.component).sort())) throw new Error('部门扩展配置与盘点范围不一致');
  const knowledge = JSON.parse(await readFile(resolve(root, config.knowledge_file), 'utf8'));
  if (extensionSources.length && config.extension_knowledge_file) {
    const extensionKnowledge = JSON.parse(await readFile(resolve(root, config.extension_knowledge_file), 'utf8'));
    if (!Array.isArray(extensionKnowledge)) throw new Error('部门扩展知识输入必须为数组');
    knowledge.push(...extensionKnowledge.filter(item => extensionSources.some(source => source.component === item.component)));
  }
  const referenceKnowledge = config.references_file ? JSON.parse(await readFile(resolve(root, config.references_file), 'utf8')) : null;
  if (referenceKnowledge !== null && !Array.isArray(referenceKnowledge)) throw new Error('参考知识输入必须为数组');
  if (matrix.openresty_version !== config.openresty_version || catalog.openresty_version !== config.openresty_version) throw new Error('盘点版本与项目配置不一致');
  const scopeComplete = matrix.scope_complete === true && matrix.components.every(item =>
    ['fixed_registration_build_review', 'fixed_build_and_entry_review', 'fixed_tree_and_install_review'].includes(item.inspection));
  validateCatalogScope(matrix, catalog);
  const components = new Map([...config.sources, ...extensionSources].map(item => [item.component, { ...item, ...[...matrix.components, ...extensionMatrix.components].find(c => c.component === item.component) }]));
  for (const source of extensionSources) {
    const frozen = components.get(source.component);
    const identity = { kind: 'department_extension', repository: source.repository, revision: source.revision,
      version: source.version, version_kind: source.version_kind, deployment_status: source.deployment_status };
    const directory = resolve(root, source.path);
    const revision = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const origin = execFileSync('git', ['-C', directory, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim().replace(/\.git$/, '');
    if (!validSource(identity) || JSON.stringify(identity) !== JSON.stringify(frozen.source) || source.path !== frozen.local_path
      || revision !== source.revision || origin !== source.repository || frozen.registration_build?.complete !== true) throw new Error(`${source.component}: 扩展来源与固定盘点证据不一致`);
  }
  for (const source of components.values()) {
    if (!source.repository) source.repository = execFileSync('git', ['-C', resolve(root, source.local_path), 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim().replace(/\.git$/, '');
    if (!source.repository.startsWith('https://github.com/')) throw new Error('源码仓库地址不能生成固定版本引用');
  }
  const mainRevision = execFileSync('git', ['-C', resolve(root, config.main_repo), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  components.set('openresty', { component: 'openresty', version: config.openresty_version, local_path: config.main_repo, revision: mainRevision, repository: 'https://github.com/openresty/openresty' });
  for (const source of config.documentation_sources ?? []) {
    if (!source || !safeId(source.component) || components.has(source.component) || !/^[a-f0-9]{40}$/.test(source.revision ?? '')
      || typeof source.version !== 'string' || !source.version.trim() || typeof source.path !== 'string'
      || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(source.repository ?? '')) throw new Error('锁定文档来源无效或身份冲突');
    const directory = resolve(root, source.path);
    const origin = execFileSync('git', ['-C', directory, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim().replace(/\.git$/, '');
    const revision = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (origin !== source.repository || revision !== source.revision) throw new Error(`${source.component}: 文档固定版本或来源不一致`);
    components.set(source.component, { ...source, local_path: source.path });
  }
  const files = new Map();
  async function content(component, file) {
    const key = `${component}/${file}`;
    if (!files.has(key)) {
      const source = components.get(component);
      if (!source || file.startsWith('/') || file.split('/').includes('..')) throw new Error('源码位置无效');
      // 从固定 revision 读取，不能将工作树改动冒充已锁定源码。
      files.set(key, execFileSync('git', ['-C', resolve(root, source.local_path), 'show', `${source.revision}:${file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).replaceAll('\r\n', '\n'));
    }
    return files.get(key);
  }
  async function snippet(component, file, startLine, endLine, id) {
    const source = components.get(component);
    const lines = (await content(component, file)).split('\n');
    if (!Number.isInteger(startLine) || !Number.isInteger(endLine) || startLine < 1 || endLine < startLine || endLine > lines.length) throw new Error(`${file}: 源码范围无效`);
    return { id, component, version: source.version, revision: source.revision, file,
      start_line: startLine, end_line: endLine, code: lines.slice(startLine - 1, endLine).join('\n'),
      url: `${source.repository}/blob/${source.revision}/${file}#L${startLine}-L${endLine}`,
      kind: file.endsWith('.patch') ? 'openresty_patch' : 'upstream' };
  }
  const cCache = new Map();
  async function definition(component, symbol) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol)) return null;
    for (const owner of [...new Set([component, 'nginx'])]) {
      if (!cCache.has(owner)) {
        const source = components.get(owner);
        const paths = execFileSync('git', ['-C', resolve(root, source.local_path), 'ls-tree', '-r', '--name-only', source.revision], { encoding: 'utf8' }).trim().split('\n')
          .filter(file => /\.(?:c|h|cc|cpp|inc)$/.test(file) && !file.split('/').some(part => ['t', 'test', 'tests', 'doc'].includes(part)));
        const entries = [];
        for (const path of paths) {
          const file = path;
          const text = await content(owner, file);
          entries.push({ file, text, clean: stripComments(text) });
        }
        cCache.set(owner, entries);
      }
      for (const entry of cCache.get(owner)) {
        const match = new RegExp(`\\n${symbol}\\s*\\([^;{}]*\\)\\s*\\{`).exec(entry.clean);
        if (!match) continue;
        const line = entry.clean.slice(0, match.index + 1).split('\n').length;
        return snippet(owner, entry.file, line, Math.min(line + 39, entry.text.split('\n').length), 'configuration-definition');
      }
    }
    return null;
  }
  const prepared = [];
  const usedKnowledge = new Set();
  for (const record of catalog.directives) {
    const id = [record.component, record.module, record.name].join('--');
    if (!safeId(id) || prepared.some(item => item.id === id)) throw new Error(`重复或无效知识标识: ${id}`);
    const contexts = record.context_flags.includes('NGX_ANY_CONF') ? Object.values(CONTEXT_FLAGS) : record.context_flags.map(flag => CONTEXT_FLAGS[flag]).filter(Boolean);
    const contextsVerified = record.module_verified && record.context_flags.every(flag => CONTEXT_FLAGS[flag] || CONTROL_FLAGS.has(flag) || flag === 'NGX_ANY_CONF');
    const curated = knowledge.find(item => item.name === record.name && item.module === record.module && item.component === record.component);
    const sources = [await snippet(record.registration_component ?? record.component, record.file, record.line, record.end_line, 'registration')];
    for (const evidence of record.registration_evidence ?? []) {
      sources.push(await snippet(evidence.component ?? record.component, evidence.file, evidence.start_line, evidence.end_line, evidence.id));
    }
    let callbackSource = null;
    if (curated) {
      usedKnowledge.add(curated);
      if (curated.callback_definition !== undefined) {
        const explicit = curated.callback_definition;
        callbackSource = await snippet(explicit.component ?? record.component, explicit.file, explicit.start_line, explicit.end_line, 'configuration-definition');
        const code = stripComments(callbackSource.code.replace(/^\+/gm, ''));
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(record.callback)
          || !new RegExp(`(?:^|\\n)${record.callback}\\s*\\([^;{}]*\\)\\s*\\{`).test(code)) throw new Error(`${id}: 显式来源不是注册回调的函数定义`);
      } else callbackSource = await definition(record.component, record.callback);
      if (!callbackSource) throw new Error(`${id}: 代表条目的配置回调未定位`);
      sources.push(callbackSource);
      for (const [i, evidence] of curated.evidence.entries()) {
        const evidenceId = evidence.id ?? `evidence-${i}`;
        if (!safeId(evidenceId)) throw new Error(`${id}: evidence.id 无效`);
        sources.push(await snippet(evidence.component ?? record.component, evidence.file, evidence.start_line, evidence.end_line, evidenceId));
      }
    }
    const sourceIdentity = record.source ?? { kind: 'bundled' };
    if (sourceIdentity.kind === 'bundled') {
      const versionLine = matrix.components.find(item => item.component === record.component)?.source_line;
      const distributionEvidence = await snippet('openresty', 'util/mirror-tarballs', versionLine - 1, versionLine + 3, 'distribution-version');
      if (curated || (record.component !== 'nginx' && components.get(record.component).patch_status === 'verified_unaffected')) sources.push(distributionEvidence);
    } else sources.push(await snippet(record.component, components.get(record.component).registration_build.entry ?? 'config', 1,
      (await content(record.component, 'config')).trimEnd().split('\n').length, 'module-build'));
    let facts;
    const factsInput = record.distribution_patch && !curated ? { patch_status: {
      status: 'verified_affected', note: '本项由固定发行版的有效补丁新增，注册及归属已通过实际回放核对；功能与限制尚未核实。', source_ids: ['registration'],
    } } : curated;
    try { facts = prepareKnowledgeFacts(factsInput, sources, record.component, components.get(record.component).patch_status, sourceIdentity.kind); }
    catch (error) { throw new Error(`${id}: ${error.message}`, { cause: error }); }
    const { patchKnown } = facts;
    const registrationNotes = (record.registration_defines ?? []).map(define =>
      `注册容器在 ${define.file}:${define.line} 临时定义 ${define.name}=${define.value}；这不是需要用户额外设置的独立编译开关。`);
    if (record.distribution_patch) registrationNotes.push(`注册原文来自发行补丁；回放目标 ${record.distribution_patch.target_file} 的 SHA256 为 ${record.distribution_patch.patched_sha256}，不将其行号冒充上游原始版本。`);
    prepared.push({
      id, name: record.name, module: record.module, component: record.component, contexts: [...new Set(contexts)], contexts_verified: Boolean(contextsVerified),
      source: sourceIdentity,
      syntax: curated?.syntax ?? null, summary: curated?.summary ?? null,
      defaults: facts.defaults, inheritance: facts.inheritance, limitations: facts.limitations,
      availability: curated?.availability === undefined ? { compile_guards: record.compile_guards, dependencies: [], deprecated: curated?.deprecated ?? null, status: 'unverified' }
        : { ...curated.availability, compile_guards: record.compile_guards },
      verification: 'registration_only', verification_notes: [curated ? '配置注册、回调定义及所列证据已核对；未编译或运行 OpenResty。' : '仅核实注册信息；配置回调定义、功能与限制尚未完成研究。', '源码存在不代表实际环境启用相应模块。', ...registrationNotes, ...(record.component === 'nginx' ? [patchKnown ? '仅核对本条指令所列事实与引用链路的补丁影响，不代表 Nginx 全部行为已核实。' : '上游 Nginx 1.27.1 注册表；OpenResty 补丁影响尚未逐项核定。'] : [])],
      configuration_entry: { symbol: record.callback, source_ids: callbackSource ? ['registration', 'configuration-definition'] : ['registration'] },
      sources, documentation: curated?.documentation ?? sources.filter(source => /README/.test(source.file)).map(source => ({ title: `${source.component} 锁定版本文档`, url: source.url, status: 'verified' })),
      patch_status: facts.patch_status,
      phases: curated?.phase ? [curated.phase] : [], mechanism: curated?.mechanism ?? null, related: curated?.related ?? [],
      ...(curated?.runtime === undefined ? {} : { runtime: structuredClone(curated.runtime) })
    });
    prepared.at(-1).verification = deriveVerification(prepared.at(-1));
  }
  if (usedKnowledge.size !== knowledge.length) throw new Error('存在没有匹配到已核实模块注册表的知识输入');
  const preparedReferences = referenceKnowledge === null ? null : await Promise.all(referenceKnowledge.map(async reference => {
    if (!reference || !Array.isArray(reference.evidence) || !components.has(reference.component)) throw new Error('参考知识来源无效');
    const sources = await Promise.all(reference.evidence.map((evidence, i) => snippet(evidence.component ?? reference.component, evidence.file, evidence.start_line, evidence.end_line, `evidence-${i}`)));
    return { id: reference.id, kind: reference.kind, name: reference.name, component: reference.component,
      summary: reference.summary, limitations: reference.limitations, sources, verification: 'reference_verified' };
  }));
  const gaps = matrix.components.filter(item => !['fixed_registration_build_review', 'fixed_build_and_entry_review',
    'fixed_tree_and_install_review'].includes(item.inspection)).map(item => `${item.component}: 未核实指令范围`);
  if (prepared.some(detail => detail.component === 'nginx' && detail.patch_status.status === 'unverified')) gaps.push('部分 Nginx 指令的功能补丁影响尚未逐项核定');
  const remaining = prepared.filter(detail => detail.verification === 'registration_only').length;
  if (remaining) gaps.push(`${remaining} 个注册项尚未完成功能说明`);
  const sample = config.department_sample_status;
  if (sample !== undefined && (!sample || typeof sample.received !== 'boolean' || !Array.isArray(sample.pending)
    || sample.pending.some(note => typeof note !== 'string' || !note.trim()))) throw new Error('部门样例状态配置无效');
  gaps.push(...(sample?.received ? sample.pending : ['部门真实脱敏样例待提供']), 'Codex 宿主实际接入与内网站点可达性待验收');
  if (extensionSources.length) gaps.push('部门扩展按固定上游 commit 快照核对；现场版本、安装情况及运行兼容性未知');
  const groups = Object.fromEntries(['bundled', 'department_extension'].map(kind => {
    const entries = prepared.filter(detail => detail.source.kind === kind);
    return [kind, { inventory_complete: kind === 'bundled' ? scopeComplete : extensionMatrix.scope_complete === true,
      registration_count: entries.length, basic_verified_count: entries.filter(detail => detail.verification !== 'registration_only').length,
      deep_verified_count: entries.filter(detail => detail.verification === 'deep_verified').length }];
  }));
  const coverage = { inventory_complete: groups.bundled.inventory_complete && groups.department_extension.inventory_complete, registration_count: prepared.length,
    basic_verified_count: prepared.filter(detail => detail.verification !== 'registration_only').length,
    deep_verified_count: prepared.filter(detail => detail.verification === 'deep_verified').length, groups, gaps };
  const hash = createHash('sha256').update(json({ directives: prepared, references: preparedReferences, coverage })).digest('hex').slice(0, 16);
  const releaseId = process.env.KNOWLEDGE_RELEASE_ID ?? config.release_id ?? `${config.openresty_version}-${hash}`;
  if (!safeId(releaseId)) throw new Error('知识发布标识无效');
  const output = resolve(root, config.output_dir);
  const knowledgeRoot = join(output, 'knowledge');
  const releaseRoot = join(knowledgeRoot, 'releases', releaseId);
  async function immutable(path, value) {
    const serialized = json(value);
    try { if (await readFile(path, 'utf8') !== serialized) throw new Error('同一发布标识下已有不同知识，不能覆盖'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; await writeFile(path, serialized, { flag: 'wx' }); }
  }
  const details = prepared.map(detail => ({ schema_version: 2, release_id: releaseId, openresty_version: config.openresty_version, ...detail }));
  const index = { schema_version: 2, release_id: releaseId, openresty_version: config.openresty_version,
    ...(preparedReferences === null ? {} : { references_path: `releases/${releaseId}/references.json` }),
    coverage,
    directives: details.map(detail => ({ id: detail.id, name: detail.name, module: detail.module, component: detail.component, source: detail.source, contexts: detail.contexts, contexts_verified: detail.contexts_verified,
      detail_path: `releases/${releaseId}/directives/${detail.id}.json`, verification: detail.verification, phases: detail.phases })) };
  const references = preparedReferences === null ? null : { schema_version: 2, release_id: releaseId, openresty_version: config.openresty_version, references: preparedReferences };
  validatePublication(index, details, references);
  await mkdir(join(releaseRoot, 'directives'), { recursive: true });
  for (const detail of details) await immutable(join(releaseRoot, 'directives', `${detail.id}.json`), detail);
  if (references) await immutable(join(releaseRoot, 'references.json'), references);
  await immutable(join(releaseRoot, 'index.json'), index);
  await cp(join(root, 'site'), output, { recursive: true });
  await cp(join(root, 'src'), join(output, 'src'), { recursive: true });
  await writeFile(join(output, 'site-config.json'), json({ title: config.title, knowledge_base: './knowledge/', request_timeout_ms: config.request_timeout_ms }));
  await writeFile(join(knowledgeRoot, 'index.next.json'), json(index));
  await rename(join(knowledgeRoot, 'index.next.json'), join(knowledgeRoot, 'index.json'));
  await writeFile(resolve(root, config.analysis_dir, 'coverage.json'), json({ ...index.coverage, release_id: releaseId }));
  console.log(json({ release_id: releaseId, ...index.coverage }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const position = process.argv.indexOf('--config');
  if (position < 0 || !process.argv[position + 1]) throw new Error('需要 --config 配置文件');
  await build(resolve(process.argv[position + 1]));
}
