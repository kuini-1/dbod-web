/**
 * Parameter schema for WPS blocks - extracted from C++ AddParam methods.
 * Maps block name to list of possible parameters with their types and valid values.
 */

export type ParamType = 'number' | 'string';

export type ParamInfo = {
  name: string;
  type: ParamType;
  description?: string;
  validValues?: string[]; // For string params with specific allowed values
};

export type BlockParamSchema = {
  [blockName: string]: ParamInfo[];
};

export const WPS_PARAM_SCHEMA: BlockParamSchema = {
  // Actions
  'add mobgroup': [
    { name: 'group', type: 'number' },
    { name: 'play script', type: 'number' },
    { name: 'play scene', type: 'number' },
    { name: 'faint buff index', type: 'number' },
    { name: 'faint buff range', type: 'number' },
    { name: 'bind mob list', type: 'number' },
    { name: 'drop item', type: 'number' },
    { name: 'nest range', type: 'number' },
    { name: 'no spawn wait', type: 'string', validValues: ['true'] },
    { name: 'spawn func', type: 'string', validValues: ['no spawn wait'] },
    { name: 'respawn', type: 'string', validValues: ['true'] },
    { name: 'faint buff apply type', type: 'string', validValues: ['party'] },
    { name: 'nest type', type: 'string', validValues: ['fix'] },
    { name: 'bind mob', type: 'string' },
  ],
  'remove mobgroup': [
    { name: 'group', type: 'number' },
    { name: 'type', type: 'string', validValues: ['faint', 'clear', 'despawn'] },
  ],
  'add npc': [
    { name: 'index', type: 'number' },
    { name: 'loc x', type: 'number' },
    { name: 'loc y', type: 'number' },
    { name: 'loc z', type: 'number' },
    { name: 'dir x', type: 'number' },
    { name: 'dir z', type: 'number' },
    { name: 'play script', type: 'number' },
    { name: 'play scene', type: 'number' },
    { name: 'party id', type: 'number' },
    { name: 'use loc var', type: 'string', validValues: ['true'] },
    { name: 'loc var', type: 'string' },
    { name: 'dir var', type: 'string' },
    { name: 'respawn', type: 'string', validValues: ['true'] },
    { name: 'no spawn wait', type: 'string', validValues: ['true'] },
    { name: 'stand alone', type: 'string', validValues: ['true'] },
    { name: 'char condition', type: 'string', validValues: ['click disable'] },
    { name: 'party leader', type: 'string', validValues: ['true'] },
  ],
  'remove npc': [
    { name: 'index', type: 'number' },
    { name: 'type', type: 'string', validValues: ['clear', 'faint'] },
  ],
  'wait': [
    { name: 'operation', type: 'string', validValues: ['and', 'or'] },
  ],
  'check time': [
    { name: 'time', type: 'number' },
  ],
  'check mobgroup': [
    { name: 'group', type: 'number' },
    { name: 'count', type: 'number' },
  ],
  'change sps scene': [
    { name: 'index', type: 'number' },
    { name: 'play script', type: 'number' },
    { name: 'play scene', type: 'number' },
  ],
  'send event to sps': [
    { name: 'target index', type: 'number' },
    { name: 'event id', type: 'number' },
    { name: 'target type', type: 'string', validValues: ['npc', 'mob'] },
  ],
  'send event to ts': [
    { name: 'trigger type', type: 'string', validValues: ['quest', 'pc'] },
    { name: 'apply type', type: 'string', validValues: ['register all'] },
    { name: 'event id', type: 'number' },
  ],
  'send event to wps': [
    { name: 'wps index', type: 'number' },
    { name: 'event id', type: 'number' },
  ],
  'system message': [
    { name: 'text index', type: 'number' },
    { name: 'notify', type: 'string', validValues: ['system', 'notice', 'sysnotice', 'action', 'caution'] },
    { name: 'text', type: 'string' },
  ],
  'register buff': [
    { name: 'target index', type: 'number' },
    { name: 'buff index', type: 'number' },
    { name: 'target type', type: 'string', validValues: ['mob'] },
  ],
  'unregister buff': [
    { name: 'target index', type: 'number' },
    { name: 'buff index', type: 'number' },
    { name: 'target type', type: 'string', validValues: ['mob'] },
  ],
  'area enter': [
    { name: 'origin x', type: 'number' },
    { name: 'origin y', type: 'number' },
    { name: 'origin z', type: 'number' },
    { name: 'start x', type: 'number' },
    { name: 'start y', type: 'number' },
    { name: 'start z', type: 'number' },
    { name: 'end x', type: 'number' },
    { name: 'end y', type: 'number' },
    { name: 'end z', type: 'number' },
    { name: 'radius', type: 'number' },
    { name: 'all member', type: 'string', validValues: ['true'] },
  ],
  'check battle': [
    { name: 'group', type: 'number' },
    { name: 'type', type: 'string', validValues: ['mob'] },
    { name: 'is battle', type: 'string', validValues: ['true', 'false'] },
  ],
  'check lp': [
    { name: 'index', type: 'number' },
    { name: 'group', type: 'number' },
    { name: 'lp', type: 'number' },
    { name: 'type', type: 'string', validValues: ['mob', 'npc'] },
  ],
  'npc faint': [
    { name: 'npc index', type: 'number' },
    { name: 'wps fail', type: 'string', validValues: ['true'] },
  ],
  'recv event from sps': [
    { name: 'object index', type: 'number' },
    { name: 'event id', type: 'number' },
    { name: 'object type', type: 'string', validValues: ['npc', 'mob'] },
  ],
  'compare': [
    { name: 'express', type: 'string' },
  ],
  'loop cond': [
    { name: 'reverse', type: 'string', validValues: ['true'] },
    { name: 'operation', type: 'string', validValues: ['true'] },
  ],
  'spawned mob': [
    { name: 'group', type: 'number' },
    { name: 'count', type: 'number' },
  ],
  'spawned npc': [
    { name: 'tblidx', type: 'number' },
  ],
  // Note: Users can still add any parameter name/value even if not listed here.
  // This schema is for suggestions and validation hints only.
};

const NORMALIZED_WPS_PARAM_SCHEMA = Object.fromEntries(
  Object.entries(WPS_PARAM_SCHEMA).map(([blockName, params]) => [blockName.toLowerCase(), params])
) as BlockParamSchema;

const PARAM_LOOKUP_BY_BLOCK = Object.fromEntries(
  Object.entries(NORMALIZED_WPS_PARAM_SCHEMA).map(([blockName, params]) => [
    blockName,
    Object.fromEntries(params.map((param) => [param.name.toLowerCase(), param])),
  ])
) as Record<string, Record<string, ParamInfo>>;

/**
 * Get parameter schema for a block (action or condition)
 */
export function getBlockParams(blockName: string): ParamInfo[] {
  return NORMALIZED_WPS_PARAM_SCHEMA[blockName.toLowerCase()] || [];
}

/**
 * Check if a parameter name is valid for a block
 */
export function isValidParam(blockName: string, paramName: string): boolean {
  const params = getBlockParams(blockName);
  return params.some((p) => p.name.toLowerCase() === paramName.toLowerCase());
}

/**
 * Get valid values for a string parameter (if restricted)
 */
export function getParamValidValues(blockName: string, paramName: string): string[] | undefined {
  return PARAM_LOOKUP_BY_BLOCK[blockName.toLowerCase()]?.[paramName.toLowerCase()]?.validValues;
}
