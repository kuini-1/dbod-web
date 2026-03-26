'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function NewsPage() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    return (
        <div className="text-white bg-stone-900 min-h-screen px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-red-400 mb-8">{tx('News', '뉴스')}</h1>
                <p className="text-stone-300">{tx('News page - to be implemented', '뉴스 페이지 - 준비 중')}</p>
            </div>
        </div>
    );
}
