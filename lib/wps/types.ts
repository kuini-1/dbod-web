/** Value for Param() - number or quoted string in WPS */
export type WpsParamValue = number | string;

/** Single param key-value */
export type WpsParams = Record<string, WpsParamValue>;

/** A block is either an Action or a Condition; both can have params and nested body */
export type WpsBlock =
  | { type: 'action'; name: string; params: WpsParams; body: WpsBlock[] }
  | { type: 'condition'; name: string; params: WpsParams; body: WpsBlock[] };

/** Top-level section: Game Stage or Game Failed */
export type WpsSection =
  | { type: 'gameStage'; stageNumber: number; body: WpsBlock[] }
  | { type: 'gameFailed'; body: WpsBlock[] };

/** Full WPS script = list of sections */
export type WpsScript = { sections: WpsSection[] };

/** Helper: create empty block */
export function createBlock(
  kind: 'action' | 'condition',
  name: string
): WpsBlock {
  return { type: kind, name, params: {}, body: [] };
}

/** Helper: create empty section */
export function createSection(
  kind: 'gameStage' | 'gameFailed',
  stageNumber?: number
): WpsSection {
  if (kind === 'gameStage') {
    return { type: 'gameStage', stageNumber: stageNumber ?? 0, body: [] };
  }
  return { type: 'gameFailed', body: [] };
}

/** Helper: create empty script with one Game Stage 0 */
export function createEmptyScript(): WpsScript {
  return {
    sections: [{ type: 'gameStage', stageNumber: 0, body: [] }],
  };
}

/** Check if a section/block has a body (for nesting) */
export function hasBody(
  node: WpsSection | WpsBlock
): node is WpsSection | WpsBlock {
  return 'body' in node && Array.isArray(node.body);
}
