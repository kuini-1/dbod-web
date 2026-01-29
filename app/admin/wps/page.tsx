'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { BlockPalette } from '@/components/admin/wps/BlockPalette';
import { WpsSectionCard } from '@/components/admin/wps/WpsSectionCard';
import { WpsWorkflowView } from '@/components/admin/wps/WpsWorkflowView';
import { parseWpsScript } from '@/lib/wps/parser';
import { serializeWpsScript } from '@/lib/wps/serializer';
import { createEmptyScript, createSection } from '@/lib/wps/types';
import { addSection } from '@/lib/wps/scriptMutate';
import type { WpsScript } from '@/lib/wps/types';

type WpsFile = { id: number; name: string };

export default function AdminWpsPage() {
  const [wpsFiles, setWpsFiles] = useState<WpsFile[]>([]);
  const [wpsListError, setWpsListError] = useState('');
  const [wpsEditingId, setWpsEditingId] = useState<number | null>(null);
  const [wpsContent, setWpsContent] = useState('');
  const [wpsScript, setWpsScript] = useState<WpsScript>(createEmptyScript());
  const [viewMode, setViewMode] = useState<'visual' | 'source' | 'workflow'>('visual');
  const [wpsContentError, setWpsContentError] = useState('');
  const [wpsCreateId, setWpsCreateId] = useState('');
  const [wpsCreateContent, setWpsCreateContent] = useState('');
  const [wpsSaving, setWpsSaving] = useState(false);
  const [actionResult, setActionResult] = useState('');
  const [parseError, setParseError] = useState('');

  async function loadWpsList() {
    setWpsListError('');
    try {
      const res = await API.get('/admin/wps/list', { cache: 'no-store' });
      const data = res.data as { files?: WpsFile[]; error?: string };
      if (res.status !== 200) {
        setWpsListError(data?.error || `Status ${res.status}`);
        setWpsFiles([]);
        return;
      }
      setWpsFiles(data.files || []);
    } catch (err: any) {
      setWpsListError(err?.message || 'Failed to load list');
      setWpsFiles([]);
    }
  }

  async function loadWpsFile(id: number) {
    setWpsContentError('');
    setParseError('');
    try {
      const res = await API.get(`/admin/wps/get?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const data = res.data as { id?: number; content?: string; error?: string };
      if (res.status !== 200) {
        setWpsContentError(data?.error || `Status ${res.status}`);
        return;
      }
      const content = data.content ?? '';
      setWpsContent(content);
      setWpsEditingId(data.id ?? id);
      try {
        const script = parseWpsScript(content);
        if (script.sections.length === 0) {
          setWpsScript(createEmptyScript());
        } else {
          setWpsScript(script);
        }
        setViewMode('visual');
      } catch (_) {
        setWpsScript(createEmptyScript());
        setViewMode('source');
        setParseError('Could not parse as blocks; showing as text. Edit and save to fix, or use visual editor after fixing syntax.');
      }
    } catch (err: any) {
      setWpsContentError(err?.message || 'Failed to load file');
    }
  }

  function switchToSource() {
    setWpsContent(serializeWpsScript(wpsScript));
    setViewMode('source');
  }

  function switchToVisual() {
    setParseError('');
    try {
      const script = parseWpsScript(wpsContent);
      setWpsScript(script.sections.length > 0 ? script : createEmptyScript());
      setViewMode('visual');
    } catch (_) {
      setParseError('Invalid WPS syntax; fix the text before switching to visual.');
    }
  }

  function switchToWorkflow() {
    if (viewMode === 'source') {
      setParseError('');
      try {
        const script = parseWpsScript(wpsContent);
        setWpsScript(script.sections.length > 0 ? script : createEmptyScript());
      } catch (_) {
        setParseError('Invalid WPS syntax; fix the text before switching to workflow.');
        return;
      }
    }
    setViewMode('workflow');
  }

  async function doSave() {
    if (wpsEditingId == null) return;
    setWpsSaving(true);
    setWpsContentError('');
    const contentToSave = viewMode === 'visual' ? serializeWpsScript(wpsScript) : wpsContent;
    try {
      const res = await API.post('/admin/wps/save', { id: wpsEditingId, content: contentToSave });
      if (res.status !== 200) {
        const data = res.data as { error?: string };
        throw new Error(data?.error || res.statusText || 'Save failed');
      }
      setWpsContent(contentToSave);
      setActionResult('WPS file saved.');
    } catch (err: any) {
      setWpsContentError(err?.message || 'Save failed');
    } finally {
      setWpsSaving(false);
    }
  }

  async function createWps() {
    const idStr = String(wpsCreateId).trim();
    const num = parseInt(idStr, 10);
    if (idStr === '' || Number.isNaN(num) || num < 0 || String(num) !== idStr) {
      setActionResult('WPS Create: enter a valid non-negative script id.');
      return;
    }
    setWpsContentError('');
    try {
      const res = await API.post('/admin/wps/create', { id: num, content: wpsCreateContent || undefined });
      if (res.status !== 200) {
        const data = res.data as { error?: string };
        throw new Error(data?.error || res.statusText || 'Create failed');
      }
      setWpsCreateId('');
      setWpsCreateContent('');
      setActionResult(`WPS file ${num}.wps created.`);
      loadWpsList();
      loadWpsFile(num);
    } catch (err: any) {
      setActionResult(`WPS Create error: ${err?.message || 'Unknown error'}`);
    }
  }

  function clearWpsEditor() {
    setWpsEditingId(null);
    setWpsContent('');
    setWpsScript(createEmptyScript());
    setWpsContentError('');
    setParseError('');
  }

  function handleAddStage() {
    const nextStage = wpsScript.sections.filter((s) => s.type === 'gameStage').length;
    setWpsScript(addSection(wpsScript, createSection('gameStage', nextStage)));
  }

  function handleAddGameFailed() {
    const hasFailed = wpsScript.sections.some((s) => s.type === 'gameFailed');
    if (hasFailed) return;
    setWpsScript(addSection(wpsScript, createSection('gameFailed')));
  }

  useEffect(() => {
    loadWpsList();
  }, []);

  return (
    <AdminShell title="WPS Scripts" subtitle="Create and edit World Play Script files with drag-and-drop blocks.">
      {wpsListError && (
        <p className="text-sm text-red-300">{wpsListError}</p>
      )}
      {!wpsListError && wpsEditingId == null && (
        <AdminCard title="WPS file list" description="Refresh and create or edit scripts">
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={loadWpsList}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
          <div className="mb-4">
            <span className="text-sm text-white/80">Create new: </span>
            <input
              type="text"
              placeholder="Script ID (e.g. 9999)"
              value={wpsCreateId}
              onChange={(e) => setWpsCreateId(e.target.value)}
              className="mr-2 rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white"
            />
            <button
              type="button"
              onClick={createWps}
              disabled={!String(wpsCreateId).trim()}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              Create
            </button>
          </div>
          <p className="mb-2 text-sm text-white/70">Total: {wpsFiles.length} file(s)</p>
          <div className="overflow-x-auto">
            <table className="w-full max-w-md border border-white/10 text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/80">
                  <th className="p-2">ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wpsFiles.map((f) => (
                  <tr key={f.id} className="border-b border-white/5">
                    <td className="p-2">{f.id}</td>
                    <td className="p-2">{f.name}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => loadWpsFile(f.id)}
                        className="rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/10"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {wpsFiles.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-white/50">
                      No WPS files found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
      {!wpsListError && wpsEditingId != null && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadWpsFile(wpsEditingId)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={doSave}
              disabled={wpsSaving}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              {wpsSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={clearWpsEditor}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Back to list
            </button>
            <span className="text-white/50">|</span>
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                viewMode === 'visual'
                  ? 'border-white/30 bg-white/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              Blocks
            </button>
            <button
              type="button"
              onClick={switchToWorkflow}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                viewMode === 'workflow'
                  ? 'border-white/30 bg-white/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              Workflow
            </button>
            <button
              type="button"
              onClick={() => setViewMode('source')}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                viewMode === 'source'
                  ? 'border-white/30 bg-white/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              Source
            </button>
          </div>
          {wpsContentError && (
            <p className="mb-2 text-sm text-red-300">{wpsContentError}</p>
          )}
          {parseError && (
            <p className="mb-2 text-sm text-amber-300">{parseError}</p>
          )}

          {viewMode === 'visual' && (
            <div className="flex gap-4">
              <div className="sticky top-4 h-fit w-64 shrink-0 self-start">
                <BlockPalette />
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                  >
                    + Add Stage
                  </button>
                  <button
                    type="button"
                    onClick={handleAddGameFailed}
                    disabled={wpsScript.sections.some((s) => s.type === 'gameFailed')}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm hover:bg-white/20 disabled:opacity-50"
                  >
                    + Game Failed
                  </button>
                </div>
                {wpsScript.sections.map((section, sectionIdx) => (
                  <WpsSectionCard
                    key={section.type === 'gameStage' ? `stage-${sectionIdx}-${section.stageNumber}` : `failed-${sectionIdx}`}
                    script={wpsScript}
                    setScript={setWpsScript}
                    sectionIdx={sectionIdx}
                    section={section}
                  />
                ))}
              </div>
            </div>
          )}
          {viewMode === 'workflow' && (
            <AdminCard title="Workflow View" description="Visual flowchart of the script structure">
              <WpsWorkflowView script={wpsScript} />
            </AdminCard>
          )}
          {viewMode === 'source' && (
            <AdminCard title="Source" description="Edit raw WPS text">
              <textarea
                value={wpsContent}
                onChange={(e) => setWpsContent(e.target.value)}
                spellCheck={false}
                className="block w-full min-h-[400px] rounded border border-white/20 bg-black/40 p-3 font-mono text-sm text-white"
              />
            </AdminCard>
          )}
        </>
      )}
      {actionResult && (
        <p className="mt-4 text-sm text-white/80">
          <strong>Result:</strong> {actionResult}
        </p>
      )}
    </AdminShell>
  );
}
