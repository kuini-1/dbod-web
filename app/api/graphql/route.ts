import { NextRequest, NextResponse } from 'next/server';
import popup_banners from '../../../lib/models/popup_banners';
import items from '../../../lib/models/items';
import popup_banner_items from '../../../lib/models/popup_banner_items';

type GraphQLRequestBody = {
  query?: string;
  variables?: Record<string, any>;
  operationName?: string;
};

function getArgFromQuery(query: string, argName: string): string | undefined {
  // Very small arg parser for: popupBanners(lang: "en")
  const re = new RegExp(`popupBanners\\s*\\(\\s*${argName}\\s*:\\s*\"([^\"]+)\"\\s*\\)`, 'i');
  const m = query.match(re);
  return m?.[1];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GraphQLRequestBody;
    const query = body?.query || '';
    const variables = body?.variables || {};

    // We only support the query we need right now.
    const wantsPopupBanners = /popupBanners\s*\(/i.test(query) || /popupBanners\s*{/i.test(query);
    if (!wantsPopupBanners) {
      return NextResponse.json(
        {
          errors: [{ message: 'Unsupported query. Only popupBanners is currently implemented.' }],
        },
        { status: 400 }
      );
    }

    const langFromQuery = getArgFromQuery(query, 'lang');
    const lang = (variables.lang as string) || langFromQuery || 'en';
    const safeLang = (lang === 'kr' || lang === 'en') ? lang : 'en';

    // 1) Load active banners
    const banners = await popup_banners.findAll({
      where: { active: true },
      order: [['id', 'DESC']],
      raw: true,
    });

    const bannerIds = banners.map((b: any) => b.id).filter(Boolean);

    // 2) Load banner item rows (batched)
    const bannerItemRows = bannerIds.length
      ? await popup_banner_items.findAll({
          where: { bannerId: bannerIds },
          order: [['sortOrder', 'ASC'], ['id', 'ASC']],
          raw: true,
        })
      : [];

    // 3) Load item catalog rows (batched)
    const tblidxs = Array.from(
      new Set(bannerItemRows.map((r: any) => r.tblidx).filter((x: any) => x !== undefined && x !== null))
    );

    const itemRows = tblidxs.length
      ? await items.findAll({
          where: { tblidx: tblidxs },
          raw: true,
        })
      : [];

    const itemByTblidx = new Map<number, any>();
    for (const it of itemRows as any[]) itemByTblidx.set(Number(it.tblidx), it);

    const itemsByBannerId = new Map<number, any[]>();
    for (const row of bannerItemRows as any[]) {
      const bannerId = Number(row.bannerId);
      if (!itemsByBannerId.has(bannerId)) itemsByBannerId.set(bannerId, []);
      const it = itemByTblidx.get(Number(row.tblidx));
      itemsByBannerId.get(bannerId)!.push({
        tblidx: Number(row.tblidx),
        amount: Number(row.amount),
        sortOrder: row.sortOrder ?? 0,
        item: it
          ? {
              tblidx: Number(it.tblidx),
              name: safeLang === 'kr' ? (it.name_kr || it.name_en) : it.name_en,
              iconUrl: it.iconFile ? `/event icons/${it.iconFile}` : null,
            }
          : {
              tblidx: Number(row.tblidx),
              name: `Item ${row.tblidx}`,
              iconUrl: null,
            },
      });
    }

    // 4) Shape GraphQL-like response (no selection-set projection yet)
    const result = (banners as any[]).map((b) => ({
      id: b.id,
      title: b[`title_${safeLang}`] || b.title_en || '',
      active: !!b.active,
      price: b.price ? parseFloat(b.price) : null,
      packageId: b.packageId ?? null,
      cashPoints: b.cashPoints ? Number(b.cashPoints) : null,
      items: itemsByBannerId.get(Number(b.id)) || [],
    }));

    return NextResponse.json({ data: { popupBanners: result } }, { status: 200 });
  } catch (error: any) {
    console.error('[GraphQL] Error:', error);
    return NextResponse.json(
      { errors: [{ message: 'Internal server error' }] },
      { status: 500 }
    );
  }
}

