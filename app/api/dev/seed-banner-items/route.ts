import { NextRequest, NextResponse } from 'next/server';
import items from '../../../../lib/models/items';
import popup_banner_items from '../../../../lib/models/popup_banner_items';

// Dev-only helper to upsert items + replace banner items.
// POST body:
// {
//   "bannerId": 1,
//   "items": [
//     { "tblidx": 1001, "name_en": "Dogiballs", "name_kr": null, "iconFile": "ev_marble_c_ast.png", "amount": 5, "sortOrder": 1 },
//     ...
//   ]
// }
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const bannerId = Number(body.bannerId);
    const rows = Array.isArray(body.items) ? body.items : [];

    if (!bannerId || rows.length === 0) {
      return NextResponse.json(
        { error: 'Missing bannerId or items[]' },
        { status: 400 }
      );
    }

    // Upsert items catalog
    for (const r of rows) {
      const tblidx = Number(r.tblidx);
      if (!tblidx) continue;
      await items.upsert({
        tblidx,
        name_en: String(r.name_en || `Item ${tblidx}`),
        name_kr: r.name_kr ?? null,
        iconFile: r.iconFile ?? null,
      });
    }

    // Replace banner items
    await popup_banner_items.destroy({ where: { bannerId } });

    for (const r of rows) {
      const tblidx = Number(r.tblidx);
      const amount = Number(r.amount);
      if (!tblidx || !amount) continue;
      await popup_banner_items.create({
        bannerId,
        tblidx,
        amount,
        sortOrder: r.sortOrder ?? 0,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Seed banner items] error:', error);
    return NextResponse.json({ error: 'Failed to seed banner items' }, { status: 500 });
  }
}

