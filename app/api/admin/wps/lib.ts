import path from 'path';

const WPS_EXT = '.wps';

export function getWpsRoot(): string | null {
  const root = process.env.WPS_FILES_PATH;
  if (!root || typeof root !== 'string' || root.trim() === '') {
    return null;
  }
  return path.resolve(root.trim());
}

export type ResolveResult =
  | { ok: true; filePath: string }
  | { ok: false; status: number; message: string };

export function resolveWpsPath(root: string | null, id: string | null): ResolveResult {
  if (root == null) {
    return { ok: false, status: 503, message: 'WPS path not configured (set WPS_FILES_PATH)' };
  }
  const idStr = id == null ? '' : String(id).trim();
  const num = parseInt(idStr, 10);
  if (Number.isNaN(num) || num < 0 || String(num) !== idStr) {
    return { ok: false, status: 400, message: 'Invalid script id (must be non-negative integer)' };
  }
  const fileName = `${num}${WPS_EXT}`;
  const resolved = path.resolve(root, fileName);
  const normalizedRoot = path.resolve(root);
  if (!resolved.startsWith(normalizedRoot) || path.relative(normalizedRoot, resolved).startsWith('..')) {
    return { ok: false, status: 400, message: 'Path would escape WPS directory' };
  }
  return { ok: true, filePath: resolved };
}

export async function ensureWpsRootExists(root: string): Promise<boolean> {
  const fs = await import('fs/promises');
  try {
    await fs.access(root);
    return true;
  } catch {
    return false;
  }
}
