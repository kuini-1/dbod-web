'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import { API } from '@/lib/api/client';

type NewsListItem = {
    id: number;
    category: string;
    title_en: string;
    title_kr: string;
    image_url: string | null;
    updatedAt: string;
    hasReward: boolean;
    claimableReward: boolean;
};

function formatNewsDate(iso: string, locale: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(locale === 'kr' ? 'ko-KR' : 'en-US', {
        dateStyle: 'medium',
    }).format(d);
}

function categoryLabel(category: string, t: (k: string) => string) {
    if (category === 'events') return t('newsCategoryEvents');
    return t('newsCategoryInfo');
}

export default function NewsPage() {
    const { locale, t } = useLocale();
    const [category, setCategory] = useState<'all' | 'info' | 'events'>('all');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [items, setItems] = useState<NewsListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const q = new URLSearchParams({
                    page: String(page),
                    pageSize: String(pageSize),
                });
                if (category !== 'all') q.set('category', category);
                const res = await API.get(`/news?${q.toString()}`, { cache: 'no-store' });
                if (cancelled) return;
                if (res.status !== 200 || !res.data?.success) {
                    throw new Error(res.data?.message || t('newsLoadError'));
                }
                setItems(res.data.items || []);
                setTotal(Number(res.data.total) || 0);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : t('newsLoadError'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page, pageSize, category, t]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="min-h-screen bg-stone-900 px-4 py-16 text-white">
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-8 text-4xl font-bold text-red-400">{t('navItemNews')}</h1>

                <div className="mb-6 flex flex-wrap gap-2">
                    {(['all', 'info', 'events'] as const).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setPage(1);
                                setCategory(key);
                            }}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                category === key
                                    ? 'bg-red-500 text-white'
                                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                            }`}
                        >
                            {key === 'all' ? t('newsCategoryAll') : categoryLabel(key, t)}
                        </button>
                    ))}
                </div>

                {error ? (
                    <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200">{error}</p>
                ) : null}

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
                        <span>{t('newsCategory')}</span>
                        <span>{t('newsTitleCol')}</span>
                        <span className="text-right">{t('newsDateCol')}</span>
                        <span className="w-8 text-center" aria-hidden />
                    </div>
                    {loading ? (
                        <div className="px-4 py-10 text-center text-stone-400">…</div>
                    ) : items.length === 0 ? (
                        <div className="px-4 py-10 text-center text-stone-400">{t('newsEmpty')}</div>
                    ) : (
                        items.map((row) => {
                            const title = locale === 'kr' ? row.title_kr || row.title_en : row.title_en || row.title_kr;
                            return (
                                <Link
                                    key={row.id}
                                    href={`/news/${row.id}`}
                                    className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 border-b border-white/5 px-4 py-3 text-sm transition hover:bg-white/5"
                                >
                                    <span className="text-stone-300">{categoryLabel(row.category, t)}</span>
                                    <span className="font-medium text-white">{title}</span>
                                    <span className="text-right text-stone-400">
                                        {formatNewsDate(row.updatedAt, locale)}
                                    </span>
                                    <span className="flex w-8 items-center justify-center text-amber-400" title={t('newsRewardBadge')}>
                                        {row.claimableReward ? (
                                            <Gift className="h-4 w-4" aria-label={t('newsRewardBadge')} />
                                        ) : null}
                                    </span>
                                </Link>
                            );
                        })
                    )}
                </div>

                {totalPages > 1 ? (
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
                        >
                            ‹
                        </button>
                        <span className="text-sm text-stone-400">
                            {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-40"
                        >
                            ›
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
