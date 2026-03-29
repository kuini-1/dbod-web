'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';
import { API } from '@/lib/api/client';
import NewsMarkdownBody from '@/components/news/NewsMarkdownBody';
import { DynamicNewsBlockNoteField } from '@/components/news/DynamicNewsBlockNoteField';
import { isBlockNoteDocumentString } from '@/lib/utils/news-body-blocknote';

type RewardLine = {
    tblidx: number;
    amount: number;
    sortOrder: number;
    item: {
        tblidx: number;
        name_en: string;
        name_kr: string | null;
        iconUrl: string | null;
    };
};

type PostPayload = {
    id: number;
    category: string;
    title_en: string;
    title_kr: string;
    body_md_en: string;
    body_md_kr: string;
    image_url: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

function formatNewsDate(iso: string, loc: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(loc === 'kr' ? 'ko-KR' : 'en-US', {
        dateStyle: 'long',
    }).format(d);
}

export default function AdminNewsPreviewPage() {
    const params = useParams();
    const idParam = params?.id;
    const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : '';

    const { locale, t } = useLocale();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [post, setPost] = useState<PostPayload | null>(null);
    const [rewardItems, setRewardItems] = useState<RewardLine[]>([]);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await API.get(`/admin/news/${id}`, { cache: 'no-store' });
            if (res.status === 404 || !res.data?.success) {
                setPost(null);
                setError(res.data?.message || 'Not found');
                return;
            }
            setPost(res.data.post);
            setRewardItems(res.data.rewardItems || []);
        } catch {
            setError(t('newsLoadError'));
            setPost(null);
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        load();
    }, [load]);

    const title =
        post && (locale === 'kr' ? post.title_kr || post.title_en : post.title_en || post.title_kr);
    const bodyRaw =
        post &&
        (locale === 'kr' ? post.body_md_kr || post.body_md_en : post.body_md_en || post.body_md_kr);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-900 px-4 py-16 text-white">
                <div className="mx-auto max-w-3xl text-stone-400">…</div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-stone-900 px-4 py-16 text-white">
                <div className="mx-auto max-w-3xl">
                    <p className="text-red-300">{error || 'Not found'}</p>
                    <Link href="/admin/news" className="mt-4 inline-block text-red-400 underline">
                        {t('adminNewsPreviewBack')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-900 px-4 py-8 text-white">
            <div className="mx-auto mb-6 max-w-3xl space-y-3">
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
                    <p className="font-semibold">{t('adminNewsPreviewBanner')}</p>
                    <p className="mt-1 text-xs text-amber-200/80">
                        {post.active ? t('adminNewsPreviewActive') : t('adminNewsPreviewDraft')}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                    <Link href="/admin/news" className="text-red-400 underline hover:text-red-300">
                        ← {t('adminNewsPreviewBack')}
                    </Link>
                    <span className="text-white/30">|</span>
                    {post.active ? (
                        <a
                            href={`/news/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/70 underline hover:text-white"
                        >
                            {t('adminNewsPreviewPublicLink')}
                        </a>
                    ) : (
                        <span className="text-white/45">{t('adminNewsPreviewPublicDisabled')}</span>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-3xl">
                <p className="text-xs uppercase tracking-widest text-stone-500">
                    {post.category === 'events' ? t('newsCategoryEvents') : t('newsCategoryInfo')} ·{' '}
                    {formatNewsDate(post.updatedAt, locale)}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-red-400">{title}</h1>

                {post.image_url ? (
                    <div className="relative mt-6 aspect-[2/1] w-full overflow-hidden rounded-2xl border border-white/10 bg-stone-950">
                        <Image
                            src={post.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 48rem"
                            unoptimized
                        />
                    </div>
                ) : null}

                <div className="mt-8">
                    {isBlockNoteDocumentString(bodyRaw || '') ? (
                        <DynamicNewsBlockNoteField
                            key={`preview-${post.id}-${locale}-${post.updatedAt}`}
                            initialStored={bodyRaw || ''}
                            editable={false}
                            theme="dark"
                        />
                    ) : (
                        <NewsMarkdownBody markdown={bodyRaw || ''} />
                    )}
                </div>

                {rewardItems.length > 0 ? (
                    <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
                        <h2 className="text-lg font-semibold text-amber-200">{t('newsRewardTitle')}</h2>
                        <p className="mt-1 text-xs text-amber-200/70">{t('adminNewsPreviewRewardsNote')}</p>
                        <ul className="mt-4 flex flex-wrap gap-4">
                            {rewardItems.map((line) => {
                                const name =
                                    locale === 'kr' && line.item.name_kr
                                        ? line.item.name_kr
                                        : line.item.name_en;
                                return (
                                    <li
                                        key={`${line.tblidx}-${line.sortOrder}`}
                                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                                    >
                                        {line.item.iconUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={line.item.iconUrl}
                                                alt=""
                                                width={40}
                                                height={40}
                                                className="h-10 w-10 object-contain"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded bg-stone-800" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-white">{name}</p>
                                            <p className="text-xs text-stone-400">× {line.amount}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
