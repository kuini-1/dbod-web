'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { DynamicNewsBlockNoteField } from '@/components/news/DynamicNewsBlockNoteField';
import { useLocale } from '@/components/LocaleProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAdminGm } from '@/components/admin/AdminGmContext';

type RewardLine = { tblidx: number; amount: number; sortOrder: number };

type NewsPostRow = {
    id: number;
    category: string;
    title_en: string;
    title_kr: string;
    body_md_en: string;
    body_md_kr: string;
    image_url: string | null;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    items: RewardLine[];
};

type Draft = {
    category: 'info' | 'events';
    title_en: string;
    title_kr: string;
    body_md_en: string;
    body_md_kr: string;
    image_url: string;
    active: boolean;
    rewardLines: { tblidx: string; amount: string; sortOrder: string }[];
};

function emptyDraft(): Draft {
    return {
        category: 'info',
        title_en: '',
        title_kr: '',
        body_md_en: '',
        body_md_kr: '',
        image_url: '',
        active: false,
        rewardLines: [],
    };
}

function postToDraft(p: NewsPostRow): Draft {
    return {
        category: p.category === 'events' ? 'events' : 'info',
        title_en: p.title_en,
        title_kr: p.title_kr,
        body_md_en: p.body_md_en || '',
        body_md_kr: p.body_md_kr || '',
        image_url: p.image_url || '',
        active: Boolean(p.active),
        rewardLines: (p.items || []).map((it, idx) => ({
            tblidx: String(it.tblidx),
            amount: String(it.amount),
            sortOrder: String(it.sortOrder ?? idx),
        })),
    };
}

const adminFieldClass =
    'border-white/20 bg-stone-900/80 text-white placeholder:text-white/35 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950';

function draftToPayload(d: Draft) {
    const items: RewardLine[] = [];
    d.rewardLines.forEach((line, idx) => {
        const tblidx = parseInt(line.tblidx, 10);
        const amount = parseInt(line.amount, 10);
        const sortOrder = parseInt(line.sortOrder, 10);
        if (!Number.isFinite(tblidx) || tblidx < 1) return;
        if (!Number.isFinite(amount) || amount < 1) return;
        items.push({
            tblidx,
            amount,
            sortOrder: Number.isFinite(sortOrder) ? sortOrder : idx,
        });
    });
    return {
        category: d.category,
        title_en: d.title_en.trim(),
        title_kr: d.title_kr.trim(),
        body_md_en: d.body_md_en,
        body_md_kr: d.body_md_kr,
        image_url: d.image_url.trim() || null,
        active: d.active,
        items,
    };
}

export default function AdminNewsPage() {
    const { t, locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const { isNewsViewerOnly } = useAdminGm();
    const [posts, setPosts] = useState<NewsPostRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedId, setSelectedId] = useState<number | 'new' | null>(null);
    const [draft, setDraft] = useState<Draft>(emptyDraft);
    const [uploading, setUploading] = useState(false);
    const [newPostNonce, setNewPostNonce] = useState(0);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await API.get('/admin/news', { cache: 'no-store' });
            if (res.status !== 200 || !res.data?.success) {
                throw new Error(res.data?.message || 'Failed to load');
            }
            setPosts(res.data.posts || []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const selectedPost = useMemo(() => {
        if (typeof selectedId !== 'number') return null;
        return posts.find((p) => p.id === selectedId) || null;
    }, [posts, selectedId]);

    useEffect(() => {
        if (selectedId === 'new') {
            setDraft(emptyDraft());
        } else if (typeof selectedId === 'number' && selectedPost) {
            setDraft(postToDraft(selectedPost));
        }
    }, [selectedId, selectedPost]);

    function selectNew() {
        setNewPostNonce((n) => n + 1);
        setSelectedId('new');
    }

    function selectPost(id: number) {
        setSelectedId(id);
    }

    async function handleUpload(file: File | null) {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.set('file', file);
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch('/api/admin/news/upload', {
                method: 'POST',
                headers,
                body: fd,
                credentials: 'include',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success || !data?.url) {
                throw new Error(data?.message || 'Upload failed');
            }
            setDraft((d) => ({ ...d, image_url: data.url }));
            toast.success('Image uploaded');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function save() {
        const payload = draftToPayload(draft);
        if (!payload.title_en || !payload.title_kr) {
            toast.error('Titles required');
            return;
        }
        setSaving(true);
        try {
            if (selectedId === 'new') {
                const res = await API.post('/admin/news', payload);
                if (res.status !== 201 || !res.data?.success) {
                    throw new Error(res.data?.message || 'Save failed');
                }
                toast.success('Created');
                await loadPosts();
                const newId = res.data.post?.id;
                if (typeof newId === 'number') setSelectedId(newId);
            } else if (typeof selectedId === 'number') {
                const res = await API.patch(`/admin/news/${selectedId}`, payload);
                if (res.status !== 200 || !res.data?.success) {
                    throw new Error(res.data?.message || 'Save failed');
                }
                toast.success('Saved');
                await loadPosts();
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        if (typeof selectedId !== 'number') return;
        if (!window.confirm('Delete this post?')) return;
        setSaving(true);
        try {
            const res = await API.delete(`/admin/news/${selectedId}`);
            if (res.status !== 200 || !res.data?.success) {
                throw new Error(res.data?.message || 'Delete failed');
            }
            toast.success('Deleted');
            setSelectedId(null);
            await loadPosts();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setSaving(false);
        }
    }

    function addRewardLine() {
        setDraft((d) => ({
            ...d,
            rewardLines: [...d.rewardLines, { tblidx: '', amount: '1', sortOrder: String(d.rewardLines.length) }],
        }));
    }

    function updateRewardLine(index: number, field: 'tblidx' | 'amount' | 'sortOrder', value: string) {
        setDraft((d) => {
            const next = [...d.rewardLines];
            if (!next[index]) return d;
            next[index] = { ...next[index], [field]: value };
            return { ...d, rewardLines: next };
        });
    }

    function removeRewardLine(index: number) {
        setDraft((d) => ({
            ...d,
            rewardLines: d.rewardLines.filter((_, i) => i !== index),
        }));
    }

    const blockNoteKeyEn =
        selectedId === 'new'
            ? `en-new-${newPostNonce}`
            : typeof selectedId === 'number'
              ? `en-${selectedId}-${selectedPost?.updatedAt ?? 'pending'}`
              : 'en-idle';
    const blockNoteKeyKr =
        selectedId === 'new'
            ? `kr-new-${newPostNonce}`
            : typeof selectedId === 'number'
              ? `kr-${selectedId}-${selectedPost?.updatedAt ?? 'pending'}`
              : 'kr-idle';

    return (
        <AdminShell
            title={t('adminNews')}
            subtitle={
                isNewsViewerOnly
                    ? tx('View only — you cannot create or edit posts.', '조회 전용 — 게시물을 만들거나 수정할 수 없습니다.')
                    : t('adminNewsSubtitle')
            }
        >
            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(260px,17rem)_minmax(0,1fr)]">
                <AdminCard title={t('adminNewsPostList')} className="min-w-0">
                    {!isNewsViewerOnly ? (
                        <Button
                            type="button"
                            onClick={selectNew}
                            className="mb-4 w-full gap-2 bg-red-600 text-white hover:bg-red-500"
                        >
                            <Plus className="h-4 w-4" />
                            {t('adminNewsNew')}
                        </Button>
                    ) : null}
                    {loading ? (
                        <p className="text-sm text-white/50">…</p>
                    ) : (
                        <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto text-sm">
                            {posts.map((p) => (
                                <li key={p.id}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => selectPost(p.id)}
                                        className={cn(
                                            'h-auto w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left font-normal text-white/80 hover:bg-white/5 hover:text-white',
                                            selectedId === p.id && 'bg-white/15 text-white hover:bg-white/15'
                                        )}
                                    >
                                        <span className="block w-full truncate font-medium">{p.title_en}</span>
                                        <span className="text-xs font-normal text-white/50">
                                            {p.active ? '● active' : '○ draft'}
                                        </span>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </AdminCard>

                <AdminCard
                    title={
                        isNewsViewerOnly
                            ? tx('View post', '게시물 보기')
                            : selectedId === 'new'
                              ? t('adminNewsNew')
                              : t('adminNewsEdit')
                    }
                    className="min-w-0 w-full"
                >
                    {selectedId === null ? (
                        <p className="text-sm text-white/60">{t('adminNewsSelectPrompt')}</p>
                    ) : (
                        <div className="flex min-w-0 w-full flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-white/70">{t('newsCategory')}</Label>
                                <Select
                                    value={draft.category}
                                    disabled={isNewsViewerOnly}
                                    onValueChange={(v) =>
                                        setDraft((d) => ({
                                            ...d,
                                            category: v === 'events' ? 'events' : 'info',
                                        }))
                                    }
                                >
                                    <SelectTrigger className={cn('max-w-xs', adminFieldClass)}>
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">info</SelectItem>
                                        <SelectItem value="events">events</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="news-title-en" className="text-white/70">
                                    title_en
                                </Label>
                                <Input
                                    id="news-title-en"
                                    value={draft.title_en}
                                    readOnly={isNewsViewerOnly}
                                    onChange={(e) => setDraft((d) => ({ ...d, title_en: e.target.value }))}
                                    className={adminFieldClass}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="news-title-kr" className="text-white/70">
                                    title_kr
                                </Label>
                                <Input
                                    id="news-title-kr"
                                    value={draft.title_kr}
                                    readOnly={isNewsViewerOnly}
                                    onChange={(e) => setDraft((d) => ({ ...d, title_kr: e.target.value }))}
                                    className={adminFieldClass}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-white/60">{t('adminNewsBodyEn')}</span>
                                <p className="text-xs text-white/40">{t('adminNewsBlockNoteHint')}</p>
                                <DynamicNewsBlockNoteField
                                    key={blockNoteKeyEn}
                                    initialStored={draft.body_md_en}
                                    onChangeStored={(next) => setDraft((d) => ({ ...d, body_md_en: next }))}
                                    editable={!isNewsViewerOnly}
                                    theme="dark"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-white/60">{t('adminNewsBodyKr')}</span>
                                <DynamicNewsBlockNoteField
                                    key={blockNoteKeyKr}
                                    initialStored={draft.body_md_kr}
                                    onChangeStored={(next) => setDraft((d) => ({ ...d, body_md_kr: next }))}
                                    editable={!isNewsViewerOnly}
                                    theme="dark"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="news-header-image" className="text-white/70">
                                    {t('adminNewsImage')}
                                </Label>
                                {draft.image_url ? (
                                    <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-white/10">
                                        <Image src={draft.image_url} alt="" fill className="object-cover" unoptimized />
                                    </div>
                                ) : null}
                                {!isNewsViewerOnly ? (
                                    <Input
                                        id="news-header-image"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        disabled={uploading}
                                        onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                                        className={cn(
                                            adminFieldClass,
                                            'cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white file:hover:bg-white/15'
                                        )}
                                    />
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="news-active"
                                    type="checkbox"
                                    checked={draft.active}
                                    disabled={isNewsViewerOnly}
                                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                                    className="h-4 w-4 rounded border-white/30 bg-stone-900 text-red-600 accent-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-stone-950"
                                />
                                <Label htmlFor="news-active" className="cursor-pointer text-white/80">
                                    {t('adminNewsActive')}
                                </Label>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-white/80">{t('adminNewsRewards')}</span>
                                    {!isNewsViewerOnly ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={addRewardLine}
                                            className="h-8 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        >
                                            + {t('adminNewsAddLine')}
                                        </Button>
                                    ) : null}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {draft.rewardLines.map((line, idx) => (
                                        <div key={idx} className="flex flex-wrap items-center gap-2">
                                            <Input
                                                placeholder="tblidx"
                                                value={line.tblidx}
                                                readOnly={isNewsViewerOnly}
                                                onChange={(e) => updateRewardLine(idx, 'tblidx', e.target.value)}
                                                className={cn(adminFieldClass, 'h-9 w-28 text-xs')}
                                            />
                                            <Input
                                                placeholder="amount"
                                                value={line.amount}
                                                readOnly={isNewsViewerOnly}
                                                onChange={(e) => updateRewardLine(idx, 'amount', e.target.value)}
                                                className={cn(adminFieldClass, 'h-9 w-24 text-xs')}
                                            />
                                            <Input
                                                placeholder="sort"
                                                value={line.sortOrder}
                                                readOnly={isNewsViewerOnly}
                                                onChange={(e) => updateRewardLine(idx, 'sortOrder', e.target.value)}
                                                className={cn(adminFieldClass, 'h-9 w-20 text-xs')}
                                            />
                                            {!isNewsViewerOnly ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRewardLine(idx)}
                                                    className="shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                    aria-label="Remove"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {!isNewsViewerOnly ? (
                                    <Button
                                        type="button"
                                        disabled={saving}
                                        onClick={save}
                                        className="bg-red-600 text-white hover:bg-red-500"
                                    >
                                        {t('adminNewsSave')}
                                    </Button>
                                ) : null}
                                {typeof selectedId === 'number' ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={saving}
                                        className="border-white/25 bg-transparent text-white hover:bg-white/10"
                                        onClick={() =>
                                            window.open(
                                                `/admin/news/preview/${selectedId}`,
                                                '_blank',
                                                'noopener,noreferrer'
                                            )
                                        }
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t('adminNewsPreviewNewTab')}
                                    </Button>
                                ) : !isNewsViewerOnly ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled
                                        title={t('adminNewsSaveFirstToPreview')}
                                        className="border-white/15 bg-transparent text-white/40"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        {t('adminNewsPreviewNewTab')}
                                    </Button>
                                ) : null}
                                {!isNewsViewerOnly && typeof selectedId === 'number' ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={saving}
                                        onClick={remove}
                                        className="border-red-500/50 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
                                    >
                                        {t('adminNewsDelete')}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    )}
                </AdminCard>
            </div>
        </AdminShell>
    );
}
