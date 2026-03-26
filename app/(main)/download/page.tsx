'use client';

import { useLocale } from '@/components/LocaleProvider';

export default function DownloadPage() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    return (
        <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-center text-red-400 mb-8">
                    {tx('DOWNLOADS', '다운로드')}
                </h1>
                <div className="space-y-8">
                    <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">{tx('Client', '클라이언트')}</h2>
                        <p className="text-stone-300 mb-4">{tx('Download the game client to start playing.', '게임 클라이언트를 다운로드하고 플레이를 시작하세요.')}</p>
                        <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            {tx('Download Client', '클라이언트 다운로드')}
                        </button>
                    </div>
                    <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">{tx('Essentials', '필수 항목')}</h2>
                        <p className="text-stone-300 mb-4">{tx('Required software and frameworks.', '필요한 소프트웨어 및 프레임워크')}</p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-stone-200 mb-2">.NET Framework 3.5</h3>
                                <button className="bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded transition-colors">
                                    {tx('Download', '다운로드')}
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-stone-200 mb-2">WinRAR</h3>
                                <button className="bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded transition-colors">
                                    {tx('Download', '다운로드')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
