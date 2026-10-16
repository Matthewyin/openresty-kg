export const SOURCE_LABELS = { bundled: '固定发行版', department_extension: '部门扩展' };

export function validSource(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return false;
  if (source.kind === 'bundled') return Object.keys(source).length === 1;
  return Object.keys(source).length === 6 && source.kind === 'department_extension' && source.version_kind === 'commit_snapshot'
    && source.deployment_status === 'unknown' && typeof source.version === 'string' && source.version.trim().length > 0
    && /^[a-f0-9]{40}$/.test(source.revision ?? '')
    && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(source.repository ?? '');
}

export function validSourceCoverage(index) {
  if (index.schema_version === 1) return index.directives.every(entry => entry.source === undefined || validSource(entry.source) && entry.source.kind === 'bundled');
  if (index.schema_version !== 2 || !index.directives.every(entry => validSource(entry.source))) return false;
  const identities = new Map();
  for (const entry of index.directives) {
    const identity = JSON.stringify(entry.source);
    if (identities.has(entry.component) && identities.get(entry.component) !== identity) return false;
    identities.set(entry.component, identity);
  }
  const groups = index.coverage.groups;
  if (!groups || typeof groups !== 'object' || Object.keys(groups).length !== 2) return false;
  for (const kind of Object.keys(SOURCE_LABELS)) {
    const group = groups[kind];
    const entries = index.directives.filter(entry => entry.source.kind === kind);
    if (!group || typeof group.inventory_complete !== 'boolean'
      || group.registration_count !== entries.length
      || group.basic_verified_count !== entries.filter(entry => entry.verification !== 'registration_only').length
      || group.deep_verified_count !== entries.filter(entry => entry.verification === 'deep_verified').length) return false;
  }
  return index.coverage.inventory_complete === (groups.bundled.inventory_complete && groups.department_extension.inventory_complete);
}

export function sourceDescription(entry) {
  const source = entry.source ?? { kind: 'bundled' };
  return source.kind === 'department_extension'
    ? `${SOURCE_LABELS[source.kind]} · commit 快照 ${source.revision} · 现场版本与安装情况未知`
    : SOURCE_LABELS.bundled;
}
