import { CONTEXTS } from './contexts.mjs';
import { validSourceCoverage } from './source.mjs';

const contexts = new Set(CONTEXTS);
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const safePart = (value) => typeof value === 'string'
  && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && value !== '.' && value !== '..';
const validContext = (value) => value === null || contexts.has(value);
const integer = (value, minimum) => Number.isInteger(value) && value >= minimum;

function validParsed(parsed) {
  return record(parsed) && typeof parsed.name === 'string' && parsed.name.length > 0
    && strings(parsed.args) && strings(parsed.raw_args) && parsed.args.length === parsed.raw_args.length
    && integer(parsed.line, 1) && integer(parsed.column, 1) && integer(parsed.offset, 0)
    && integer(parsed.end_offset, parsed.offset)
    && ['simple', 'block', 'lua_block', 'name', 'block_entry'].includes(parsed.kind)
    && (parsed.kind !== 'block_entry' || ['data', 'control'].includes(parsed.entry_role))
    && strings(parsed.contexts) && validContext(parsed.context)
    && (parsed.parent_index === null || integer(parsed.parent_index, 0))
    && typeof parsed.complete === 'boolean' && Array.isArray(parsed.external_references)
    && parsed.external_references.every((item) => record(item)
      && ['include', 'lua_file'].includes(item.kind) && typeof item.value === 'string'
      && item.status === 'not_analyzed');
}

function validIndex(index) {
  if (!record(index) || ![1, 2].includes(index.schema_version) || !safePart(index.release_id)
      || index.openresty_version !== '1.27.1.1' || !Array.isArray(index.directives)
      || !record(index.coverage)) return false;
  const coverage = index.coverage;
  if (typeof coverage.inventory_complete !== 'boolean' || !strings(coverage.gaps)
      || !integer(coverage.registration_count, 0) || !integer(coverage.basic_verified_count, 0)
      || !integer(coverage.deep_verified_count, 0)) return false;
  const ids = new Set();
  let basic = 0;
  let deep = 0;
  for (const entry of index.directives) {
    if (!record(entry) || !safePart(entry.id) || ids.has(entry.id)
        || !safePart(entry.component) || !safePart(entry.module) || !safePart(entry.name)
        || !strings(entry.contexts) || typeof entry.contexts_verified !== 'boolean'
        || !['registration_only', 'basic_verified', 'deep_verified'].includes(entry.verification)
        || !strings(entry.phases)
        || entry.detail_path !== `releases/${index.release_id}/directives/${entry.id}.json`) return false;
    const base = `${entry.component}--${entry.module}--${entry.name}`;
    if (entry.id !== base && !entry.id.startsWith(`${base}--`)) return false;
    if (entry.contexts_verified && (!entry.contexts.length
        || entry.contexts.some((context) => !contexts.has(context)))) return false;
    ids.add(entry.id);
    if (entry.verification !== 'registration_only') basic++;
    if (entry.verification === 'deep_verified') deep++;
  }
  return coverage.registration_count === ids.size && coverage.basic_verified_count === basic
    && coverage.deep_verified_count === deep && validSourceCoverage(index);
}

export function matchDirective(parsed, index, options = {}) {
  const result = (status, reason, candidates = [], effective_context = null) => ({
    status, candidates, selected_id: status === 'matched' ? candidates[0].id : null,
    effective_context, reason,
  });
  if (!validParsed(parsed)) return result('invalid_input', 'invalid_parsed');
  if (!parsed.complete) return result('invalid_input', 'incomplete_directive');
  if (!record(options)) return result('invalid_input', 'invalid_options');
  const { context = null, module = null } = options;
  if (!validContext(context) || (module !== null
      && (typeof module !== 'string' || !module.trim()))) return result('invalid_input', 'invalid_options');
  if (parsed.kind === 'block_entry') return result('block_entry', 'custom_handler_entry');
  if (!validIndex(index)) return result('invalid_index', 'invalid_schema');
  const named = index.directives.filter((entry) => entry.name === parsed.name)
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (context !== null && parsed.context !== null && context !== parsed.context) {
    return result('context_conflict', 'conflicting_context', named);
  }
  const effective = context ?? parsed.context;
  if (!named.length) return result('unknown', 'name_not_in_index', [], effective);
  const modules = module === null ? named : named.filter((entry) => entry.module === module);
  if (!modules.length) return result('module_mismatch', 'module_not_in_candidates', named, effective);
  const applicable = effective === null ? modules
    : modules.filter((entry) => !entry.contexts_verified || entry.contexts.includes(effective));
  if (applicable.some((entry) => !entry.contexts_verified)) {
    return result('context_required', 'unverified_context_mapping', applicable, effective);
  }
  if (!applicable.length) return result('context_mismatch', 'context_not_in_candidates', modules, effective);
  if (applicable.length > 1) return result('ambiguous', 'multiple_candidates', applicable, effective);
  if (effective === null) return result('context_required', 'missing_context', applicable);
  return result('matched', 'unique_candidate', applicable, effective);
}
