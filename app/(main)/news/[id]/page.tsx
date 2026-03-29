'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

export default function NewsDetailPage() {
    const params = useParams();
    const idParam = params?.id;
    const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : '';

    const { locale, t } = useLocale();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [post, setPost] = useState<PostPayload | null>(null);
    const [rewardItems, setRewardItems] = useState<RewardLine[]>([]);
    const [claimed, setClaimed] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await API.get('/private', { cache: 'no-store' });
            setLoggedIn(res.status === 200 || res.status === 201);
        })();
    }, []);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await API.get(`/news/${id}`, { cache: 'no-store' });
            if (res.status === 404 || !res.data?.success) {
                setPost(null);
                setError(res.data?.message || 'Not found');
                return;
            }
            setPost(res.data.post);
            setRewardItems(res.data.rewardItems || []);
            setClaimed(Boolean(res.data.claimed));
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

    async function handleClaim() {
        if (!id || claiming) return;
        setClaiming(true);
        try {
            const res = await API.post(`/news/${id}/claim`, {});
            if (res.status === 200 && res.data?.success) {
                toast.success(t('newsClaimSuccess'));
                setClaimed(true);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('news-reward-claimed'));
                }
            } else if (res.status === 401) {
                toast.error(t('newsLoginToClaim'));
            } else {
                toast.error(String(res.data?.message || 'Error'));
            }
        } catch {
            toast.error(t('unexpectedError'));
        } finally {
            setClaiming(false);
        }
    }

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
                    <Link href="/news" className="mt-4 inline-block text-red-400 underline">
                        {t('newsBackToList')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-900 px-4 py-16 text-white">
            <div className="mx-auto max-w-3xl">
                <Link href="/news" className="mb-6 inline-block text-sm text-red-400 hover:text-red-300">
                    ← {t('newsBackToList')}
                </Link>

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
                            key={`${post.id}-${locale}-${post.updatedAt}`}
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
                        <div className="mt-6">
                            {claimed ? (
                                <p className="text-sm text-stone-400">{t('newsClaimed')}</p>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleClaim}
                                        disabled={claiming}
                                        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                                    >
                                        {claiming ? t('newsClaiming') : t('newsClaim')}
                                    </button>
                                    {!loggedIn ? (
                                        <p className="mt-2 text-xs text-stone-500">
                                            {t('newsLoginToClaim')}{' '}
                                            <Link
                                                href={`/login?redirect=${encodeURIComponent(`/news/${id}`)}`}
                                                className="text-red-400 underline hover:text-red-300"
                                            >
                                                {t('login')}
                                            </Link>
                                        </p>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="mt-10 text-sm text-stone-500">{t('newsNoReward')}</p>
                )}
            </div>
        </div>
    );
}
