import type { WpsBlock, WpsParamValue, WpsSection, WpsScript } from './types';

function formatParamValue(v: WpsParamValue): string {
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (v === 'true' || v === 'false' || /^\d+$/.test(v)) return `"${v}"`;
    return `"${v.replace(/"/g, '\\"')}"`;
  }
  return '""';
}

function serializeBlock(block: WpsBlock, indent: number): string[] {
  const pad = '\t'.repeat(indent);
  const padInner = '\t'.repeat(indent + 1);
  const lines: string[] = [];
  const kind = block.type === 'action' ? 'Action' : 'Condition';
  lines.push(`${pad}${kind}("${block.name}")`);
  lines.push(`${pad}--[`);
  for (const [key, value] of Object.entries(block.params)) {
    lines.push(`${padInner}Param("${key}", ${formatParamValue(value)})`);
  }
  for (const child of block.body) {
    lines.push(...serializeBlock(child, indent + 1));
  }
  lines.push(`${pad}--]`);
  lines.push(`${pad}End()`);
  return lines;
}

function serializeSection(section: WpsSection): string[] {
  const lines: string[] = [];
  if (section.type === 'gameStage') {
    lines.push(`GameStage(${section.stageNumber})`);
  } else {
    lines.push('GameFailed()');
  }
  lines.push('--[');
  for (const block of section.body) {
    lines.push(...serializeBlock(block, 1));
  }
  lines.push('--]');
  lines.push('End()');
  lines.push('');
  return lines;
}

export function serializeWpsScript(script: WpsScript): string {
  const lines: string[] = [];
  for (const section of script.sections) {
    lines.push(...serializeSection(section));
  }
  return lines.join('\n').trimEnd();
}
