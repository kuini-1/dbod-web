import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getWpsRoot, resolveWpsPath, ensureWpsRootExists } from '../lib';

export async function POST(request: NextRequest) {
  const root = getWpsRoot();
  if (root == null) {
    return NextResponse.json(
      { error: 'WPS path not configured (set WPS_FILES_PATH)' },
      { status: 503 }
    );
  }

  let body: { id?: string | number; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, content } = body;
  if (content === undefined) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const resolved = resolveWpsPath(root, id != null ? String(id) : null);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }

  const exists = await ensureWpsRootExists(root);
  if (!exists) {
    return NextResponse.json(
      { error: 'WPS directory does not exist or is not writable' },
      { status: 503 }
    );
  }

  const contentStr = typeof content === 'string' ? content : String(content);

  try {
    const bakPath = `${resolved.filePath}.bak`;
    try {
      await fs.access(resolved.filePath);
      await fs.copyFile(resolved.filePath, bakPath);
    } catch {
      // no existing file or no backup needed
    }
    await fs.writeFile(resolved.filePath, contentStr, 'utf8');
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to write file' },
      { status: 500 }
    );
  }

  const numId = parseInt(String(id), 10);
  return NextResponse.json({ ok: true, id: numId });
}
