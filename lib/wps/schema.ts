/**
 * Action and condition names from WPSNodeFactory (GameServer).
 * Used for the block palette so users pick by label without typing.
 */

export const WPS_ACTIONS = [
  'add mob',
  'add mobgroup',
  'add npc',
  'broad message',
  'calculate',
  'case',
  'change char attribute',
  'change npc attribute',
  'change object state',
  'change sps scene',
  'change stage',
  'clear event',
  'default',
  'direction indicate',
  'direct play',
  'else',
  'event handler',
  'event status clear',
  'event status register',
  'event status select',
  'exec at once',
  'exec wps',
  'flash play',
  'function',
  'get faint location',
  'get location',
  'if',
  'mob list',
  'play bgm',
  'play jingle',
  'register buff',
  'remove mobgroup',
  'remove npc',
  'send ais event',
  'send event to ais',
  'send event to sps',
  'send event to tqs',
  'send event to ts',
  'send event to wps',
  'send sps event',
  'switch',
  'system message',
  'telecast message',
  'then',
  'time countdown',
  'unregister buff',
  'wait',
  'while',
  'wps fail',
  'loop',
  'CCBD',
  'CCBD register direct play',
  'CCBD wait user',
  'CCBD stage',
  'CCBD exec pattern',
  'CCBD stage clear',
  'CCBD reward',
  'CCBD leave',
] as const;

export const WPS_CONDITIONS = [
  'all player faint',
  'area enter',
  'check battle',
  'check countdown',
  'check lp',
  'check mobgroup',
  'check time',
  'child',
  'compare',
  'loop cond',
  'npc faint',
  'recv event from ais',
  'recv event from item',
  'recv event from sps',
  'recv event from tqs',
  'recv event from ts',
  'recv event from wps',
  'recv sps event',
  'recv ts event',
  'spawned mob',
  'spawned npc',
  'wait condition',
  'CCBD check run state',
  'CCBD check limit time',
  'CCBD pattern',
] as const;

export type WpsActionName = (typeof WPS_ACTIONS)[number];
export type WpsConditionName = (typeof WPS_CONDITIONS)[number];

/** Human-friendly label for palette (capitalize words) */
export function blockLabel(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
