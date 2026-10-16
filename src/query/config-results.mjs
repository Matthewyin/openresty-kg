export function needsOuterContext(parsed) {
  return parsed.directives.some(item => item.kind !== 'block_entry' && item.context === null
    && (item.name === 'server' || item.contexts.includes('server')));
}

export function needsAttention(item, match) {
  return !['matched', 'block_entry'].includes(match.status) || item.external_references.length > 0;
}

export function summarizeConfig(parsed, matches) {
  const summary = { directives: 0, matched: 0, attention: 0, block_entries: 0, external_references: 0 };
  parsed.directives.forEach((item, i) => {
    if (item.kind === 'block_entry') summary.block_entries++;
    else summary.directives++;
    if (matches[i].status === 'matched') summary.matched++;
    else if (matches[i].status !== 'block_entry') summary.attention++;
    summary.external_references += item.external_references.length;
  });
  return summary;
}
