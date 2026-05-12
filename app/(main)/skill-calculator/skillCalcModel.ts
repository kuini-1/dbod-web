/** Base path for static assets under `public/skill-calculator/`. */
export const SKILL_CALC_ASSET_BASE = '/skill-calculator';

export const SKILL_POINT_CAP = 54;

export const VALID_LANGS = ['eng', 'kor', 'tw', 'hk', 'fra', 'pol', 'por', 'spn'] as const;
export type SkillCalcLang = (typeof VALID_LANGS)[number];

export const LANG_TITLES: Record<SkillCalcLang, string> = {
    eng: 'English',
    kor: '한국어',
    tw: '中文',
    hk: '中文',
    fra: 'Français',
    pol: 'Polski',
    por: 'Português',
    spn: 'Español',
};

type MasterDef = {
    slug: string;
    displayName: string;
    classId: number;
    basicSlug: string;
    pairSlug: string;
};

const MASTERS: MasterDef[] = [
    { slug: 'Fighter', displayName: 'Fighter', classId: 11, basicSlug: 'Martial-Artist', pairSlug: 'Swordsman' },
    { slug: 'Swordsman', displayName: 'Swordsman', classId: 17, basicSlug: 'Martial-Artist', pairSlug: 'Fighter' },
    { slug: 'Crane-Hermit', displayName: 'Crane Hermit', classId: 12, basicSlug: 'Spiritualist', pairSlug: 'Turtle-Hermit' },
    { slug: 'Turtle-Hermit', displayName: 'Turtle Hermit', classId: 18, basicSlug: 'Spiritualist', pairSlug: 'Crane-Hermit' },
    { slug: 'Dark-Warrior', displayName: 'Dark Warrior', classId: 13, basicSlug: 'Warrior', pairSlug: 'Shadow-Knight' },
    { slug: 'Shadow-Knight', displayName: 'Shadow Knight', classId: 19, basicSlug: 'Warrior', pairSlug: 'Dark-Warrior' },
    { slug: 'Dende-Priest', displayName: 'Dende Priest', classId: 14, basicSlug: 'Dragon-Clan', pairSlug: 'Poko-Priest' },
    { slug: 'Poko-Priest', displayName: 'Poko Priest', classId: 20, basicSlug: 'Dragon-Clan', pairSlug: 'Dende-Priest' },
    { slug: 'Ultimate-Majin', displayName: 'Ultimate Majin', classId: 15, basicSlug: 'Mighty-Majin', pairSlug: 'Grand-Chef-Majin' },
    { slug: 'Grand-Chef-Majin', displayName: 'Grand Chef Majin', classId: 21, basicSlug: 'Mighty-Majin', pairSlug: 'Ultimate-Majin' },
    { slug: 'Plasma-Majin', displayName: 'Plasma Majin', classId: 16, basicSlug: 'Wonder-Majin', pairSlug: 'Karma-Majin' },
    { slug: 'Karma-Majin', displayName: 'Karma Majin', classId: 22, basicSlug: 'Wonder-Majin', pairSlug: 'Plasma-Majin' },
];

const BASICS: Record<string, { displayName: string; classId: number }> = {
    'Martial-Artist': { displayName: 'Martial Artist', classId: 1 },
    Spiritualist: { displayName: 'Spiritualist', classId: 2 },
    Warrior: { displayName: 'Warrior', classId: 3 },
    'Dragon-Clan': { displayName: 'Dragon Clan', classId: 4 },
    'Mighty-Majin': { displayName: 'Mighty Majin', classId: 5 },
    'Wonder-Majin': { displayName: 'Wonder Majin', classId: 6 },
};

const masterBySlug = Object.fromEntries(MASTERS.map((m) => [m.slug, m])) as Record<string, MasterDef>;

/** Class picker rows (same order as legacy PHP). */
export const MASTER_CLASS_ROWS: { slug: string; displayName: string; classId: number }[][] = [
    [
        { slug: 'Fighter', displayName: 'Fighter', classId: 11 },
        { slug: 'Swordsman', displayName: 'Swordsman', classId: 17 },
    ],
    [
        { slug: 'Crane-Hermit', displayName: 'Crane Hermit', classId: 12 },
        { slug: 'Turtle-Hermit', displayName: 'Turtle Hermit', classId: 18 },
    ],
    [
        { slug: 'Dark-Warrior', displayName: 'Dark Warrior', classId: 13 },
        { slug: 'Shadow-Knight', displayName: 'Shadow Knight', classId: 19 },
    ],
    [
        { slug: 'Dende-Priest', displayName: 'Dende Priest', classId: 14 },
        { slug: 'Poko-Priest', displayName: 'Poko Priest', classId: 20 },
    ],
    [
        { slug: 'Ultimate-Majin', displayName: 'Ultimate Majin', classId: 15 },
        { slug: 'Grand-Chef-Majin', displayName: 'Grand Chef Majin', classId: 21 },
    ],
    [
        { slug: 'Plasma-Majin', displayName: 'Plasma Majin', classId: 16 },
        { slug: 'Karma-Majin', displayName: 'Karma Majin', classId: 22 },
    ],
];

export function normalizeLang(raw: string | null | undefined): SkillCalcLang {
    const v = (raw || 'eng').toLowerCase();
    return (VALID_LANGS as readonly string[]).includes(v) ? (v as SkillCalcLang) : 'eng';
}

export function normalizeBuild(raw: string | null | undefined): string {
    const s = String(raw ?? '0').replace(/\D/g, '');
    return s.length ? s : '0';
}

export function normalizeMasterSlug(raw: string | null | undefined): string {
    const s = String(raw || 'Fighter');
    return masterBySlug[s] ? s : 'Fighter';
}

export function getMasterDef(slug: string): MasterDef {
    return masterBySlug[normalizeMasterSlug(slug)];
}

export function getBasicForMaster(slug: string) {
    const m = getMasterDef(slug);
    return BASICS[m.basicSlug];
}

export function getPairedMaster(slug: string): MasterDef {
    const m = getMasterDef(slug);
    return masterBySlug[m.pairSlug];
}
