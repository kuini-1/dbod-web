import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';
import { getWpsRoot, ensureWpsRootExists } from '../lib';

export async function GET() {
  const root = getWpsRoot();
  if (root == null) {
    return NextResponse.json(
      { error: 'WPS path not configured (set WPS_FILES_PATH)' },
      { status: 503 }
    );
  }

  const exists = await ensureWpsRootExists(root);
  if (!exists) {
    return NextResponse.json(
      { error: 'WPS directory does not exist or is not readable' },
      { status: 503 }
    );
  }

  let entries: Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to read WPS directory' },
      { status: 500 }
    );
  }

  const normalizedRoot = path.resolve(root);
  const files: { id: number; name: string }[] = [];
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.wps')) continue;
    const base = e.name.slice(0, -4);
    const num = parseInt(base, 10);
    if (Number.isNaN(num) || num < 0 || String(num) !== base) continue;
    const resolved = path.resolve(root, e.name);
    if (!resolved.startsWith(normalizedRoot)) continue;
    files.push({ id: num, name: e.name });
  }

  files.sort((a, b) => a.id - b.id);

  return NextResponse.json({ files });
}
