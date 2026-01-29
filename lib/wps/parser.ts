import type { WpsBlock, WpsParams, WpsSection, WpsScript } from './types';

const RE_GAME_STAGE = /^\s*GameStage\s*\(\s*(\d+)\s*\)/;
const RE_GAME_FAILED = /^\s*GameFailed\s*\(\s*\)/;
const RE_ACTION = /^\s*Action\s*\(\s*"([^"]*)"\s*\)/;
const RE_CONDITION = /^\s*Condition\s*\(\s*"([^"]*)"\s*\)/;
const RE_PARAM_KEY = /^\s*Param\s*\(\s*"([^"]*)"\s*,\s*/;
const RE_END = /^\s*End\s*\(\s*\)/;

function parseParamValue(raw: string): string | number {
  const t = raw.trim();
  if (t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).replace(/\\"/g, '"');
  }
  const n = Number(t);
  if (!Number.isNaN(n) && String(n) === t) return n;
  if (t === 'true') return 'true';
  if (t === 'false') return 'false';
  return t;
}

export function parseWpsScript(text: string): WpsScript {
  const sections: WpsSection[] = [];
  type Open = WpsSection | WpsBlock;
  const stack: Open[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed === '--[' || trimmed === '--]') continue;

    const gameStage = RE_GAME_STAGE.exec(line);
    if (gameStage) {
      const stageNumber = parseInt(gameStage[1], 10);
      const section: WpsSection = {
        type: 'gameStage',
        stageNumber,
        body: [],
      };
      sections.push(section);
      stack.push(section);
      continue;
    }

    if (RE_GAME_FAILED.test(line)) {
      const section: WpsSection = { type: 'gameFailed', body: [] };
      sections.push(section);
      stack.push(section);
      continue;
    }

    const action = RE_ACTION.exec(line);
    if (action) {
      const name = action[1].trim();
      const block: WpsBlock = {
        type: 'action',
        name,
        params: {},
        body: [],
      };
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if ('body' in top) top.body.push(block);
      }
      stack.push(block);
      continue;
    }

    const condition = RE_CONDITION.exec(line);
    if (condition) {
      const name = condition[1].trim();
      const block: WpsBlock = {
        type: 'condition',
        name,
        params: {},
        body: [],
      };
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if ('body' in top) top.body.push(block);
      }
      stack.push(block);
      continue;
    }

    const paramKey = RE_PARAM_KEY.exec(line);
    if (paramKey && stack.length > 0) {
      const key = paramKey[1].trim();
      const rest = line.slice(paramKey[0].length).trim();
      let valueStr: string;
      if (rest.startsWith('"')) {
        let end = 1;
        while (end < rest.length) {
          if (rest[end] === '"' && rest[end - 1] !== '\\') break;
          end++;
        }
        valueStr = rest.slice(1, end);
      } else {
        const close = rest.indexOf(')');
        valueStr = (close >= 0 ? rest.slice(0, close) : rest).trim();
      }
      const value = parseParamValue(valueStr);
      const top = stack[stack.length - 1];
      if (top.type !== 'gameStage' && top.type !== 'gameFailed') {
        (top.params as WpsParams)[key] = value;
      }
      continue;
    }

    if (RE_END.test(line)) {
      if (stack.length > 0) stack.pop();
      continue;
    }
  }

  return { sections };
}
