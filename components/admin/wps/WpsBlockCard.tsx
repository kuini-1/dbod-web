'use client';

import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WpsBlock, WpsParamValue } from '@/lib/wps/types';
import { blockLabel } from '@/lib/wps/schema';
import { WpsBlockList } from './WpsBlockList';
import type { WpsScript } from '@/lib/wps/types';
import {
  removeBlock,
  updateBlockParams,
} from '@/lib/wps/scriptMutate';
import { getBlockParams, getParamValidValues } from '@/lib/wps/paramSchema';
import { useLocale } from '@/components/LocaleProvider';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import {
  indicesToPathKey,
  isDescendantDropTarget,
  isSameOrAncestorPath,
  isWpsBlockDragPayload,
  isWpsDragPayload,
  pathKeyToIndices,
  type WpsBlockDragPayload,
  type WpsDropTarget,
} from './editorUi';

type WpsBlockCardProps = {
  setScript: Dispatch<SetStateAction<WpsScript>>;
  sectionIdx: number;
  parentPathKey: string;
  index: number;
  block: WpsBlock;
  collapsedIds: Set<string>;
  onToggleCollapsed: (id: string) => void;
  isDragActive: boolean;
  selectedPathKey: string | null;
  onSelectBlock: (pathKey: string) => void;
  showAllDetails: boolean;
};

function WpsBlockCardComponent({
  setScript,
  sectionIdx,
  parentPathKey,
  index,
  block,
  collapsedIds,
  onToggleCollapsed,
  isDragActive,
  selectedPathKey,
  onSelectBlock,
  showAllDetails,
}: WpsBlockCardProps) {
  const { locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
  const [paramKey, setParamKey] = useState('');
  const [paramValue, setParamValue] = useState('');
  const [showParamDropdown, setShowParamDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  const isAction = block.type === 'action';
  const parentPath = useMemo(() => pathKeyToIndices(parentPathKey), [parentPathKey]);
  const path = useMemo(() => [...parentPath, index], [index, parentPath]);
  const pathKey = useMemo(() => indicesToPathKey(path), [path]);
  const blockUiId = block.uiId ?? `${sectionIdx}-${path.join('-')}`;
  const isCollapsed = collapsedIds.has(blockUiId);
  const isSelected = selectedPathKey === pathKey;
  const hasSelectedDescendant = isSameOrAncestorPath(pathKey, selectedPathKey) && !isSelected;
  const showExpandedContent = !isCollapsed && (showAllDetails || isSelected || hasSelectedDescendant);
  const schema = useMemo(() => getBlockParams(block.name), [block.name]);
  const paramInfoMap = useMemo(() => new Map(schema.map((param) => [param.name.toLowerCase(), param])), [schema]);
  const dragPayload = useMemo<WpsBlockDragPayload>(() => ({
    type: 'block',
    sectionIdx,
    blockIndices: parentPath,
    index,
    blockId: blockUiId,
    label: blockLabel(block.name),
  }), [block.name, blockUiId, index, parentPath, sectionIdx]);

  const availableParams = useMemo(() => {
    const existingKeys = Object.keys(block.params);
    return schema.filter((p) => !existingKeys.includes(p.name));
  }, [block.params, schema]);
  const paramEntries = useMemo(() => Object.entries(block.params), [block.params]);
  const compactParamPreview = (() => {
    if (paramEntries.length === 0) return tx('No params', '파라미터 없음');
    return paramEntries
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value).slice(0, 24)}`)
      .join(' | ');
  })();

  useEffect(() => {
    const element = dragHandleRef.current;
    if (!element) return;

    return draggable({
      element,
      getInitialData: () => dragPayload,
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [dragPayload]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const clearEdgeClasses = () => {
      element.classList.remove('border-t-sky-400', 'border-t-4', 'border-b-sky-400', 'border-b-4');
    };

    const getFallbackClientY = () => {
      const rect = element.getBoundingClientRect();
      return rect.top + rect.height / 2;
    };

    const getTargetData = (clientY?: number): WpsDropTarget => {
      const rect = element.getBoundingClientRect();
      const resolvedClientY = clientY ?? getFallbackClientY();
      const isTopEdge = resolvedClientY < rect.top + rect.height / 2;
      return {
        type: 'dropzone',
        dropZoneId: `${sectionIdx}:${parentPathKey}:${index}:${isTopEdge ? 'top' : 'bottom'}`,
        sectionIdx,
        blockIndices: parentPath,
        insertIndex: isTopEdge ? index : index + 1,
      };
    };

    const setEdgeClasses = (clientY?: number) => {
      clearEdgeClasses();
      const rect = element.getBoundingClientRect();
      const resolvedClientY = clientY ?? getFallbackClientY();
      const isTopEdge = resolvedClientY < rect.top + rect.height / 2;
      element.classList.add(isTopEdge ? 'border-t-sky-400' : 'border-b-sky-400');
      element.classList.add(isTopEdge ? 'border-t-4' : 'border-b-4');
    };

    return dropTargetForElements({
      element,
      getData: ({ input }) => getTargetData(input?.clientY),
      getIsSticky: () => false,
      canDrop: ({ source, input }) => {
        if (!isWpsDragPayload(source.data)) return false;
        const targetData = getTargetData(input?.clientY);
        if (isWpsBlockDragPayload(source.data) && isDescendantDropTarget(source.data, targetData)) {
          return false;
        }
        return true;
      },
      onDragEnter: ({ location }) => setEdgeClasses(location.current.input.clientY),
      onDrag: ({ location }) => setEdgeClasses(location.current.input.clientY),
      onDragLeave: () => clearEdgeClasses(),
      onDrop: () => clearEdgeClasses(),
    });
  }, [index, parentPath, parentPathKey, sectionIdx]);

  function handleRemove() {
    setScript((current) => removeBlock(current, sectionIdx, parentPath, index));
  }

  function handleAddParam() {
    const k = paramKey.trim();
    if (!k) return;
    const v = paramValue.trim();
    const num = Number(v);
    const value: WpsParamValue = v === '' ? '' : (!Number.isNaN(num) && String(num) === v ? num : v);
    setScript(
      (current) => updateBlockParams(current, sectionIdx, parentPath, index, {
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
    setScript((current) => updateBlockParams(current, sectionIdx, parentPath, index, next));
  }

  function handleChangeParam(key: string, value: WpsParamValue) {
    setScript(
      (current) => updateBlockParams(current, sectionIdx, parentPath, index, {
        ...block.params,
        [key]: value,
      })
    );
  }

  return (
    <div
      ref={cardRef}
      onClick={() => onSelectBlock(pathKey)}
      className={`rounded-xl border p-3 transition ${
        isDragging ? 'opacity-35' : ''
      } ${
        isSelected
          ? 'border-sky-400/60 bg-sky-400/10'
          : isAction ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            ref={dragHandleRef}
            type="button"
            className="rounded border border-white/10 bg-white/5 p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={tx('Drag block', '블록 드래그')}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleCollapsed(blockUiId)}
            className="rounded border border-white/10 bg-white/5 p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={isCollapsed ? tx('Expand block', '블록 펼치기') : tx('Collapse block', '블록 접기')}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <span className="truncate font-medium text-white/90">
            {isAction ? tx('Action', '액션') : tx('Condition', '조건')}: {blockLabel(block.name)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/45">
            {Object.keys(block.params).length} param(s), {block.body.length} child(ren)
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
          >
            {tx('Remove', '삭제')}
          </button>
        </div>
      </div>

      {!showAllDetails && !isSelected && (
        <p className="mb-2 truncate text-xs text-white/50">{compactParamPreview}</p>
      )}

      {showExpandedContent && (
        <>
      {(showAllDetails || isSelected) && (
      <div className="mb-2 space-y-2">
        {paramEntries.map(([k, v]) => {
          const paramInfo = paramInfoMap.get(k.toLowerCase());
          const validValues = paramInfo?.validValues ?? getParamValidValues(block.name, k);
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
                x
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
      )}

      <div className="ml-4 mt-2 border-l-2 border-white/10 pl-3">
        <p className="mb-2 text-xs text-white/50">
          {showAllDetails || isSelected ? tx('Nested blocks (drop here)', '중첩 블록 (여기에 놓기)') : tx('Selected branch', '선택된 브랜치')}
        </p>
        <WpsBlockList
          body={block.body}
          setScript={setScript}
          sectionIdx={sectionIdx}
          pathKey={pathKey}
          collapsedIds={collapsedIds}
          onToggleCollapsed={onToggleCollapsed}
          isDragActive={isDragActive}
          selectedPathKey={selectedPathKey}
          onSelectBlock={onSelectBlock}
          showAllDetails={showAllDetails}
        />
      </div>
        </>
      )}
    </div>
  );
}

export const WpsBlockCard = memo(
  WpsBlockCardComponent,
  (prev, next) =>
    prev.block === next.block &&
    prev.parentPathKey === next.parentPathKey &&
    prev.collapsedIds === next.collapsedIds &&
    prev.isDragActive === next.isDragActive &&
    prev.selectedPathKey === next.selectedPathKey &&
    prev.showAllDetails === next.showAllDetails &&
    prev.setScript === next.setScript &&
    prev.onSelectBlock === next.onSelectBlock &&
    prev.onToggleCollapsed === next.onToggleCollapsed &&
    prev.sectionIdx === next.sectionIdx &&
    prev.index === next.index
);
