import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getWpsRoot, resolveWpsPath, ensureWpsRootExists } from '../lib';

export async function GET(request: NextRequest) {
  const root = getWpsRoot();
  if (root == null) {
    return NextResponse.json(
      { error: 'WPS path not configured (set WPS_FILES_PATH)' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const resolved = resolveWpsPath(root, id);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }

  const exists = await ensureWpsRootExists(root);
  if (!exists) {
    return NextResponse.json(
      { error: 'WPS directory does not exist or is not readable' },
      { status: 503 }
    );
  }

  try {
    const content = await fs.readFile(resolved.filePath, 'utf8');
    const numId = parseInt(String(id), 10);
    return NextResponse.json({ id: numId, content });
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to read file' },
      { status: 500 }
    );
  }
}
