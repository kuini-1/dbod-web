'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
    getBasicForMaster,
    getMasterDef,
    getPairedMaster,
    MASTER_CLASS_ROWS,
    normalizeBuild,
    normalizeLang,
    normalizeMasterSlug,
    SKILL_CALC_ASSET_BASE,
    SKILL_POINT_CAP,
    LANG_TITLES,
    type SkillCalcLang,
} from './skillCalcModel';

import './skill-calculator-tabs.css';

const PAGE_PATH = '/skill-calculator';

declare global {
    interface Window {
        init?: () => void;
        reset?: (mode: number, arg2?: number) => void;
        master_class?: number | string;
        url?: string;
    }
}

function appendStylesheet(href: string) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-skill-calc', '1');
    document.head.appendChild(link);
    return link;
}

function appendScript(src: string) {
    const s = document.createElement('script');
    s.setAttribute('data-skill-calc', '1');
    s.src = src;
    s.async = false;
    document.body.appendChild(s);
    return s;
}

function waitScriptLoad(el: HTMLScriptElement) {
    return new Promise<void>((resolve, reject) => {
        el.addEventListener('load', () => resolve());
        el.addEventListener('error', () => reject(new Error(`Failed to load script: ${el.src}`)));
    });
}

function cleanupSkillCalcDom() {
    document.onmousemove = null;
    document.head.querySelectorAll('[data-skill-calc]').forEach((n) => n.remove());
    document.body.querySelectorAll('[data-skill-calc]').forEach((n) => n.remove());
    document.getElementById('infobox')?.remove();
    for (const id of ['base-tree', 'mc-tree', 'mc-tree2']) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    }
}

export function SkillCalculatorView() {
    const searchParams = useSearchParams();

    const lang = useMemo(
        () => normalizeLang(searchParams.get('lang')),
        [searchParams]
    );
    const classSlug = useMemo(
        () => normalizeMasterSlug(searchParams.get('class')),
        [searchParams]
    );
    const build = useMemo(() => normalizeBuild(searchParams.get('build')), [searchParams]);

    const master = useMemo(() => getMasterDef(classSlug), [classSlug]);
    const basic = useMemo(() => getBasicForMaster(classSlug), [classSlug]);
    const paired = useMemo(() => getPairedMaster(classSlug), [classSlug]);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- build/query updates use replaceState; including searchParams would re-run and double-init scripts.
    useEffect(() => {
        let cancelled = false;
        const buildFromUrl = normalizeBuild(searchParams.get('build'));

        (async () => {
            cleanupSkillCalcDom();

            appendStylesheet('https://fonts.googleapis.com/css2?family=Oswald:wght@300&display=swap');
            appendStylesheet(`${SKILL_CALC_ASSET_BASE}/css/style.css`);

            window.master_class = master.classId;
            window.url = buildFromUrl;

            const strings = appendScript(`${SKILL_CALC_ASSET_BASE}/js/strings/skill_calc_${lang}.js`);
            await waitScriptLoad(strings);

            const data = appendScript(`${SKILL_CALC_ASSET_BASE}/js/skill_data.js`);
            await waitScriptLoad(data);

            const calc = appendScript(`${SKILL_CALC_ASSET_BASE}/js/skill_calc.js`);
            await waitScriptLoad(calc);

            if (cancelled) return;

            if (typeof window.init === 'function') {
                window.init();
            }
        })().catch((err) => {
            console.error(err);
        });

        return () => {
            cancelled = true;
            cleanupSkillCalcDom();
        };
        // Only lang / class / master id: skill_calc calls replaceState when the build changes; depending on `build`
        // or `searchParams` would remount scripts and re-init (duplicate SP, moveinfo after infobox teardown).
    }, [lang, classSlug, master.classId]);

    const img = (name: string) => `${SKILL_CALC_ASSET_BASE}/img/${name}`;

    const classHref = (slug: string) => {
        const q = new URLSearchParams();
        q.set('lang', lang);
        q.set('class', slug);
        return `${PAGE_PATH}?${q.toString()}`;
    };

    const langHref = (next: SkillCalcLang) => {
        const q = new URLSearchParams();
        q.set('lang', next);
        q.set('class', classSlug);
        if (build && build !== '0') q.set('build', build);
        return `${PAGE_PATH}?${q.toString()}`;
    };

    const tabTriggerClass =
        'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm px-2 py-2 text-xs font-medium text-stone-400 sm:flex-row sm:gap-2 sm:text-sm ' +
        'data-[state=active]:bg-red-950/50 data-[state=active]:text-red-100 data-[state=active]:shadow-inner ' +
        'ring-offset-stone-950 focus-visible:ring-red-500/60';

    return (
        <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center bg-[#1a1512] pb-16 pt-4">
            <div id="MAIN" className="skill-calc-tabs-host w-full max-w-[1100px] px-3 text-stone-100">
                <span id="SP_REMAINING" className="sr-only" aria-hidden>
                    0
                </span>

                <section className="mb-8 overflow-hidden rounded-2xl border border-stone-800/90 bg-gradient-to-b from-stone-900/95 via-stone-950 to-[#0c0a09] p-4 shadow-xl ring-1 ring-stone-800/60 sm:p-5">
                    <div className="mb-4 flex flex-col gap-2 border-b border-stone-800/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400/90">
                                Master class
                            </p>
                            <h1 className="mt-1 text-lg font-semibold tracking-tight text-stone-50 sm:text-xl">
                                Choose your class
                            </h1>
                            <p className="mt-1 max-w-xl text-sm text-stone-500">
                                Changing class reloads the calculator with a fresh build.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {MASTER_CLASS_ROWS.flat().map((c) => {
                            const active = classSlug === c.slug;
                            return (
                                <Link
                                    key={c.slug}
                                    href={classHref(c.slug)}
                                    scroll
                                    className={cn(
                                        'group flex min-h-[5rem] flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition-all duration-150',
                                        active
                                            ? 'border-red-500/80 bg-red-950/35 shadow-[0_0_24px_-6px_rgba(239,68,68,0.45)] ring-1 ring-red-500/30'
                                            : 'border-stone-700/90 bg-stone-900/50 hover:border-red-500/35 hover:bg-stone-800/60 hover:shadow-md',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-11 w-11 items-center justify-center rounded-lg border bg-stone-950/80 p-0.5 transition-colors',
                                            active
                                                ? 'border-red-400/50 bg-stone-950'
                                                : 'border-stone-600 group-hover:border-red-500/40',
                                        )}
                                    >
                                        <img
                                            src={img(`${c.classId}_small.png`)}
                                            alt=""
                                            className="h-9 w-9 object-contain"
                                        />
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[11px] font-medium leading-snug sm:text-xs',
                                            active ? 'text-red-100' : 'text-stone-300 group-hover:text-stone-100',
                                        )}
                                    >
                                        {c.displayName}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <div className="mb-8 max-w-2xl rounded-xl border border-stone-800/80 bg-stone-900/30 px-4 py-4 text-sm leading-relaxed text-stone-300 sm:px-5">
                    <p>
                        Use the trees below to plan SP. <strong className="font-medium text-stone-200">Left-click</strong>{' '}
                        to add a point, <strong className="font-medium text-stone-200">right-click</strong> to remove.
                        Skills you cannot remove are required or free.
                    </p>
                    <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-stone-800/80 pt-4 text-stone-200">
                        <span className="text-stone-500">Total SP spent</span>
                        <span className="tabular-nums text-lg font-semibold text-red-300">
                            <span id="remainingpoints">0</span>
                            <span className="text-stone-500"> / {SKILL_POINT_CAP}</span>
                        </span>
                        <button
                            type="button"
                            className="ml-auto text-sm font-medium text-red-400 underline decoration-red-500/50 underline-offset-2 hover:text-red-300"
                            onClick={() => window.reset?.(0, 0)}
                        >
                            Reset all
                        </button>
                    </div>
                </div>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid h-auto w-full grid-cols-3 gap-1 border border-stone-700 bg-stone-900/90 p-1.5">
                        <TabsTrigger value="basic" className={tabTriggerClass}>
                            <img
                                src={img(`${basic.classId}_small.png`)}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-sm border border-stone-600 bg-stone-800/80"
                            />
                            <span className="text-center leading-tight">{basic.displayName}</span>
                        </TabsTrigger>
                        <TabsTrigger value="master" className={tabTriggerClass}>
                            <img
                                src={img(`${master.classId}_small.png`)}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-sm border border-stone-600 bg-stone-800/80"
                            />
                            <span className="text-center leading-tight">{master.displayName}</span>
                        </TabsTrigger>
                        <TabsTrigger value="paired" className={tabTriggerClass}>
                            <img
                                src={img(`${paired.classId}_small.png`)}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-sm border border-stone-600 bg-stone-800/80"
                            />
                            <span className="text-center leading-tight">{paired.displayName}</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" forceMount className="mt-4 outline-none data-[state=inactive]:hidden">
                        <div className="skill-calc-tab-panel rounded-lg border border-stone-800/80 bg-[#120f0d]/90 px-2 py-4 sm:px-4">
                            <div className="class-tree">
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table
                                                    className="titlebar"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    <tbody>
                                                        <tr>
                                                            <td className="titlebar-topleft" />
                                                            <td className="titlebar-top" />
                                                            <td className="titlebar-topright" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-left" />
                                                            <td>
                                                                <div className="class-name">
                                                                    <img src={img(`${basic.classId}_small.png`)} alt="" />
                                                                    {basic.displayName} Skills
                                                                </div>
                                                                <div className="class-sp">
                                                                    <span id="classpoints">0</span> SP (
                                                                    <button
                                                                        type="button"
                                                                        className="cursor-pointer text-[#F58F7C] underline"
                                                                        onClick={() => window.reset?.(1, 1)}
                                                                    >
                                                                        Reset
                                                                    </button>
                                                                    )
                                                                </div>
                                                            </td>
                                                            <td className="titlebar-right" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-bottomleft" />
                                                            <td className="titlebar-bottom" />
                                                            <td className="titlebar-bottomright" />
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ height: 8 }} />
                                        </tr>
                                        <tr>
                                            <td>
                                                <table
                                                    className="titlebar"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    <tbody>
                                                        <tr>
                                                            <td className="titlebar-topleft" />
                                                            <td className="titlebar-top" />
                                                            <td className="titlebar-topright" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-left" />
                                                            <td>
                                                                <table className="skill-tree">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td id="base-tree" />
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                            <td className="titlebar-right" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-bottomleft" />
                                                            <td className="titlebar-bottom" />
                                                            <td className="titlebar-bottomright" />
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="master" forceMount className="mt-4 outline-none data-[state=inactive]:hidden">
                        <div className="skill-calc-tab-panel rounded-lg border border-stone-800/80 bg-[#120f0d]/90 px-2 py-4 sm:px-4">
                            <div className="master-class-tree">
                                <table style={{ width: 460 }}>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table
                                                    className="titlebar"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    <tbody>
                                                        <tr>
                                                            <td className="titlebar-topleft" />
                                                            <td className="titlebar-top" />
                                                            <td className="titlebar-topright" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-left" />
                                                            <td>
                                                                <div className="class-name">
                                                                    <img src={img(`${master.classId}_small.png`)} alt="" />{' '}
                                                                    {master.displayName} Skills
                                                                </div>
                                                                <div className="class-sp">
                                                                    <span id="masterclasspoints">0</span> SP (
                                                                    <button
                                                                        type="button"
                                                                        className="cursor-pointer text-[#F58F7C] underline"
                                                                        onClick={() => window.reset?.(2, 1)}
                                                                    >
                                                                        Reset
                                                                    </button>
                                                                    )
                                                                </div>
                                                            </td>
                                                            <td className="titlebar-right" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-bottomleft" />
                                                            <td className="titlebar-bottom" />
                                                            <td className="titlebar-bottomright" />
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ height: 8 }} />
                                        </tr>
                                        <tr>
                                            <td>
                                                <table
                                                    className="titlebar"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    <tbody>
                                                        <tr>
                                                            <td className="titlebar-topleft" />
                                                            <td className="titlebar-top" />
                                                            <td className="titlebar-topright" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-left" />
                                                            <td>
                                                                <table className="skill-tree">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td id="mc-tree" />
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                            <td className="titlebar-right" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-bottomleft" />
                                                            <td className="titlebar-bottom" />
                                                            <td className="titlebar-bottomright" />
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="paired" forceMount className="mt-4 outline-none data-[state=inactive]:hidden">
                        <div className="skill-calc-tab-panel rounded-lg border border-stone-800/80 bg-[#120f0d]/90 px-2 py-4 sm:px-4">
                            <div className="master-class-tree2">
                                <table style={{ width: 460 }}>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table
                                                    className="titlebar"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    <tbody>
                                                        <tr>
                                                            <td className="titlebar-topleft" />
                                                            <td className="titlebar-top" />
                                                            <td className="titlebar-topright" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-left" />
                                                            <td>
                                                                <div className="class-name">
                                                                    <img src={img(`${paired.classId}_small.png`)} alt="" />{' '}
                                                                    {paired.displayName} Skills
                                                                </div>
                                                                <div className="class-sp">
                                                                    <span id="masterclasspoints2">0</span> SP (
                                                                    <button
                                                                        type="button"
                                                                        className="cursor-pointer text-[#F58F7C] underline"
                                                                        onClick={() => window.reset?.(3, 1)}
                                                                    >
                                                                        Reset
                                                                    </button>
                                                                    )
                                                                </div>
                                                            </td>
                                                            <td className="titlebar-right" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-bottomleft" />
                                                            <td className="titlebar-bottom" />
                                                            <td className="titlebar-bottomright" />
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ height: 8 }} />
                                        </tr>
                                        <tr>
                                            <td>
                                                <table
                                                    className="titlebar"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    <tbody>
                                                        <tr>
                                                            <td className="titlebar-topleft" />
                                                            <td className="titlebar-top" />
                                                            <td className="titlebar-topright" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-left" />
                                                            <td>
                                                                <table className="skill-tree">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td id="mc-tree2" />
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                            <td className="titlebar-right" />
                                                        </tr>
                                                        <tr>
                                                            <td className="titlebar-bottomleft" />
                                                            <td className="titlebar-bottom" />
                                                            <td className="titlebar-bottomright" />
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="mt-8 rounded-lg border border-stone-800 bg-stone-900/40 px-3 py-4 sm:px-5">
                    <a href="" id="calcurl" className="block text-center no-underline" style={{ textDecoration: 'none' }}>
                        <table className="mx-auto w-full max-w-lg">
                            <tbody>
                                <tr>
                                    <td className="lightblue-button-top-left" />
                                    <td className="lightblue-button-top">
                                        <a href="" id="calcurl2" className="text-white no-underline" style={{ textDecoration: 'none', color: '#fff' }}>
                                            Link to this Build
                                        </a>
                                    </td>
                                    <td className="lightblue-button-top-right" />
                                </tr>
                                <tr>
                                    <td className="lightblue-button-bottom-left" />
                                    <td className="lightblue-button-bottom" />
                                    <td className="lightblue-button-bottom-right" />
                                </tr>
                            </tbody>
                        </table>
                    </a>
                    <p className="mt-3 text-center text-[11px] leading-snug text-stone-500">
                        After you have finished working on your build, use the link above to share it with others or to
                        save it for later. To copy the link, right-click the button above and choose Copy link.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-stone-800 pt-4">
                        <span className="w-full text-center text-xs text-stone-500 sm:w-auto sm:pr-2">Tooltip language:</span>
                        {(Object.keys(LANG_TITLES) as SkillCalcLang[]).map((k) => (
                            <a
                                key={k}
                                href={langHref(k)}
                                id={`${k}url`}
                                className="inline-flex rounded border border-transparent p-0.5 hover:border-stone-600 hover:bg-stone-800/80"
                                title={LANG_TITLES[k]}
                            >
                                <img src={img(`${k}.png`)} alt={LANG_TITLES[k]} className="h-5 w-auto" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
