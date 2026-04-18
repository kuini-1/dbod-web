/** Value for Param() - number or quoted string in WPS */
export type WpsParamValue = number | string;

function createEditorId(prefix: 'block' | 'section'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Single param key-value */
export type WpsParams = Record<string, WpsParamValue>;

/** A block is either an Action or a Condition; both can have params and nested body */
export type WpsBlock =
  | { type: 'action'; name: string; params: WpsParams; body: WpsBlock[]; uiId?: string }
  | { type: 'condition'; name: string; params: WpsParams; body: WpsBlock[]; uiId?: string };

/** Top-level section: Game Stage or Game Failed */
export type WpsSection =
  | { type: 'gameStage'; stageNumber: number; body: WpsBlock[]; uiId?: string }
  | { type: 'gameFailed'; body: WpsBlock[]; uiId?: string };

/** Full WPS script = list of sections */
export type WpsScript = { sections: WpsSection[] };

/** Helper: create empty block */
export function createBlock(
  kind: 'action' | 'condition',
  name: string
): WpsBlock {
  return { type: kind, name, params: {}, body: [], uiId: createEditorId('block') };
}

/** Helper: create empty section */
export function createSection(
  kind: 'gameStage' | 'gameFailed',
  stageNumber?: number
): WpsSection {
  if (kind === 'gameStage') {
    return { type: 'gameStage', stageNumber: stageNumber ?? 0, body: [], uiId: createEditorId('section') };
  }
  return { type: 'gameFailed', body: [], uiId: createEditorId('section') };
}

/** Helper: create empty script with one Game Stage 0 */
export function createEmptyScript(): WpsScript {
  return {
    sections: [createSection('gameStage', 0)],
  };
}

/** Check if a section/block has a body (for nesting) */
export function hasBody(
  node: WpsSection | WpsBlock
): node is WpsSection | WpsBlock {
  return 'body' in node && Array.isArray(node.body);
}

function ensureBlockEditorIds(block: WpsBlock): WpsBlock {
  return {
    ...block,
    uiId: block.uiId ?? createEditorId('block'),
    body: block.body.map(ensureBlockEditorIds),
  };
}

export function ensureScriptEditorIds(script: WpsScript): WpsScript {
  return {
    sections: script.sections.map((section) => ({
      ...section,
      uiId: section.uiId ?? createEditorId('section'),
      body: section.body.map(ensureBlockEditorIds),
    })),
  };
}
