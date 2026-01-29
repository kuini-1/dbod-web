import type { WpsBlock, WpsParams, WpsScript, WpsSection } from './types';
import { createBlock } from './types';

/** Path: section index + block indices into nested body[] */
export type BlockPath = number[];

export function getBody(script: WpsScript, sectionIdx: number, blockIndices: number[]): WpsBlock[] {
  const section = script.sections[sectionIdx];
  if (!section) return [];
  let current: WpsBlock[] = section.body;
  for (const i of blockIndices) {
    const block = current[i];
    if (!block) return [];
    current = block.body;
  }
  return current;
}

function setBody(
  script: WpsScript,
  sectionIdx: number,
  blockIndices: number[],
  body: WpsBlock[]
): WpsScript {
  const section = script.sections[sectionIdx];
  if (!section) return script;
  if (blockIndices.length === 0) {
    const newSections = [...script.sections];
    newSections[sectionIdx] = { ...section, body };
    return { sections: newSections };
  }
  const [first, ...rest] = blockIndices;
  const parentBody = getBody(script, sectionIdx, rest);
  const parent = parentBody[first];
  if (!parent) return script;
  const newParent = { ...parent, body };
  const newParentBody = [...parentBody];
  newParentBody[first] = newParent;
  return setBody(script, sectionIdx, rest, newParentBody);
}

export function addBlock(
  script: WpsScript,
  sectionIdx: number,
  blockIndices: number[],
  atIndex: number,
  kind: 'action' | 'condition',
  name: string
): WpsScript {
  return insertBlock(script, sectionIdx, blockIndices, atIndex, createBlock(kind, name));
}

/** Insert an existing block (e.g. when moving). */
export function insertBlock(
  script: WpsScript,
  sectionIdx: number,
  blockIndices: number[],
  atIndex: number,
  block: WpsBlock
): WpsScript {
  const body = getBody(script, sectionIdx, blockIndices);
  const newBody = [...body];
  newBody.splice(atIndex, 0, { ...block, params: { ...block.params }, body: block.body.map((b) => ({ ...b, params: { ...b.params }, body: [...b.body] })) });
  return setBody(script, sectionIdx, blockIndices, newBody);
}

export function removeBlock(
  script: WpsScript,
  sectionIdx: number,
  blockIndices: number[],
  atIndex: number
): WpsScript {
  const body = getBody(script, sectionIdx, blockIndices);
  const newBody = body.filter((_, i) => i !== atIndex);
  return setBody(script, sectionIdx, blockIndices, newBody);
}

export function updateBlockParams(
  script: WpsScript,
  sectionIdx: number,
  blockIndices: number[],
  atIndex: number,
  params: WpsParams
): WpsScript {
  const body = getBody(script, sectionIdx, blockIndices);
  const block = body[atIndex];
  if (!block) return script;
  const newBody = [...body];
  newBody[atIndex] = { ...block, params: { ...params } };
  return setBody(script, sectionIdx, blockIndices, newBody);
}

export function moveBlock(
  script: WpsScript,
  fromSectionIdx: number,
  fromBlockIndices: number[],
  fromIndex: number,
  toSectionIdx: number,
  toBlockIndices: number[],
  toIndex: number
): WpsScript {
  const fromBody = getBody(script, fromSectionIdx, fromBlockIndices);
  const block = fromBody[fromIndex];
  if (!block) return script;
  let next = removeBlock(script, fromSectionIdx, fromBlockIndices, fromIndex);
  const insertIndex =
    toSectionIdx === fromSectionIdx &&
    fromBlockIndices.length === toBlockIndices.length &&
    fromBlockIndices.every((v, i) => toBlockIndices[i] === v) &&
    fromIndex < toIndex
      ? toIndex - 1
      : toIndex;
  return insertBlock(next, toSectionIdx, toBlockIndices, insertIndex, block);
}

export function getBlockAt(
  script: WpsScript,
  sectionIdx: number,
  blockIndices: number[]
): WpsBlock | null {
  if (blockIndices.length === 0) return null;
  const body = getBody(script, sectionIdx, blockIndices.slice(0, -1));
  const lastIdx = blockIndices[blockIndices.length - 1];
  return body[lastIdx] ?? null;
}

export function addSection(script: WpsScript, section: WpsSection): WpsScript {
  return { sections: [...script.sections, section] };
}
