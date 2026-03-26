'use client';

import { useState, useMemo } from 'react';
import type { WpsBlock, WpsParamValue } from '@/lib/wps/types';
import { blockLabel } from '@/lib/wps/schema';
import { DRAG_TYPE_BLOCK } from './WpsDropZone';
import { WpsBlockList } from './WpsBlockList';
import type { WpsScript } from '@/lib/wps/types';
import {
  removeBlock,
  updateBlockParams,
  addBlock,
} from '@/lib/wps/scriptMutate';
import { getBlockParams, getParamValidValues } from '@/lib/wps/paramSchema';
import { useLocale } from '@/components/LocaleProvider';

type WpsBlockCardProps = {
  script: WpsScript;
  setScript: (s: WpsScript) => void;
  sectionIdx: number;
  blockIndices: number[];
  index: number;
  block: WpsBlock;
};

export function WpsBlockCard({
  script,
  setScript,
  sectionIdx,
  blockIndices,
  index,
  block,
}: WpsBlockCardProps) {
  const { locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');
  const [showParamDropdown, setShowParamDropdown] = useState(false);
  const isAction = block.type === 'action';
  const path = [...blockIndices, index];

  const availableParams = useMemo(() => {
    const schema = getBlockParams(block.name);
    const existingKeys = Object.keys(block.params);
    return schema.filter((p) => !existingKeys.includes(p.name));
  }, [block.name, block.params]);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(
      DRAG_TYPE_BLOCK,
      JSON.stringify({ sectionIdx, blockIndices, index })
    );
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleRemove() {
    setScript(removeBlock(script, sectionIdx, blockIndices, index));
  }

  function handleAddParam() {
    const k = paramKey.trim();
    if (!k) return;
    const v = paramValue.trim();
    const num = Number(v);
    const value: WpsParamValue = v === '' ? '' : (!Number.isNaN(num) && String(num) === v ? num : v);
    setScript(
      updateBlockParams(script, sectionIdx, blockIndices, index, {
        ...block.params,
        [k]: value,
      })
    );
    setParamKey('');
    setParamValue('');
  }

  function handleRemoveParam(key: string) {
    const next = { ...block.params };
    delete next[key];
    setScript(updateBlockParams(script, sectionIdx, blockIndices, index, next));
  }

  function handleChangeParam(key: string, value: WpsParamValue) {
    setScript(
      updateBlockParams(script, sectionIdx, blockIndices, index, {
        ...block.params,
        [key]: value,
      })
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`cursor-grab rounded-xl border p-3 transition active:cursor-grabbing ${
        isAction ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium text-white/90">
          {isAction ? tx('Action', '액션') : tx('Condition', '조건')}: {blockLabel(block.name)}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
        >
          {tx('Remove', '삭제')}
        </button>
      </div>

      <div className="mb-2 space-y-2">
        {Object.entries(block.params).map(([k, v]) => {
          const paramInfo = getBlockParams(block.name).find((p) => p.name === k);
          const validValues = getParamValidValues(block.name, k);
          const isNumber = typeof v === 'number' || (paramInfo && paramInfo.type === 'number');
          return (
            <div key={k} className="flex items-center gap-2 text-sm">
              <div className="relative w-40">
                <input
                  type="text"
                  value={k}
                  readOnly
                  className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 font-mono text-xs text-white/80"
                />
                {paramInfo && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/40">
                    {paramInfo.type === 'number' ? '#' : 'S'}
                  </span>
                )}
              </div>
              {validValues && validValues.length > 0 ? (
                <select
                  value={String(v)}
                  onChange={(e) => handleChangeParam(k, e.target.value)}
                  className="min-w-[120px] flex-1 rounded border border-white/20 bg-black/40 px-2 py-1 text-white"
                >
                  {validValues.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={isNumber ? 'number' : 'text'}
                  value={typeof v === 'number' ? String(v) : v}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (isNumber) {
                      const num = Number(raw);
                      handleChangeParam(k, raw === '' ? 0 : !Number.isNaN(num) ? num : v);
                    } else {
                      handleChangeParam(k, raw);
                    }
                  }}
                  className="min-w-[80px] flex-1 rounded border border-white/20 bg-black/40 px-2 py-1 text-white"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemoveParam(k)}
                className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
              >
                ×
              </button>
            </div>
          );
        })}
        <div className="relative flex gap-2">
          <div className="relative w-40">
            <input
              type="text"
              placeholder={tx('Param name', '파라미터 이름')}
              value={paramKey}
              onChange={(e) => {
                setParamKey(e.target.value);
                setShowParamDropdown(true);
              }}
              onFocus={() => setShowParamDropdown(true)}
              onBlur={() => setTimeout(() => setShowParamDropdown(false), 200)}
              className="w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder:text-white/40"
            />
            {showParamDropdown && availableParams.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-white/20 bg-black/80 shadow-lg">
                {availableParams
                  .filter((p) => !paramKey || p.name.toLowerCase().includes(paramKey.toLowerCase()))
                  .map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setParamKey(p.name);
                        setShowParamDropdown(false);
                        if (p.type === 'string' && p.validValues && p.validValues.length === 1) {
                          setParamValue(p.validValues[0]);
                        }
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      <span className="font-medium">{p.name}</span>
                      {p.description && <span className="ml-2 text-xs text-white/60">({p.description})</span>}
                      {p.type === 'number' && <span className="ml-2 text-xs text-blue-300">{tx('number', '숫자')}</span>}
                      {p.type === 'string' && <span className="ml-2 text-xs text-green-300">{tx('string', '문자열')}</span>}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {paramKey && (
            <>
              {(() => {
                const validValues = getParamValidValues(block.name, paramKey);
                if (validValues && validValues.length > 0) {
                  return (
                    <select
                      value={paramValue}
                      onChange={(e) => setParamValue(e.target.value)}
                      className="min-w-[120px] rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white"
                    >
                      <option value="">{tx('Select value...', '값 선택...')}</option>
                      {validValues.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  );
                }
                return (
                  <input
                    type="text"
                    placeholder={(() => {
                      const param = getBlockParams(block.name).find((p) => p.name === paramKey);
                      return param?.type === 'number' ? tx('Number value', '숫자 값') : tx('String value', '문자열 값');
                    })()}
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddParam()}
                    className="min-w-[80px] flex-1 rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder:text-white/40"
                  />
                );
              })()}
            </>
          )}
          {!paramKey && (
            <input
              type="text"
              placeholder={tx('Value', '값')}
              value={paramValue}
              onChange={(e) => setParamValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddParam()}
              className="min-w-[80px] flex-1 rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder:text-white/40"
            />
          )}
          <button
            type="button"
            onClick={handleAddParam}
            disabled={!paramKey.trim()}
            className="rounded border border-white/20 bg-white/10 px-2 py-1 text-sm hover:bg-white/20 disabled:opacity-50"
          >
            {tx('Add param', '파라미터 추가')}
          </button>
        </div>
      </div>

      <div className="ml-4 mt-2 border-l-2 border-white/10 pl-3">
        <p className="mb-2 text-xs text-white/50">{tx('Nested blocks (drop here)', '중첩 블록 (여기에 놓기)')}</p>
        <WpsBlockList
          script={script}
          setScript={setScript}
          sectionIdx={sectionIdx}
          blockIndices={path}
        />
      </div>
    </div>
  );
}
