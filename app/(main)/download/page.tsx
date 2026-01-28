'use client';

export default function DownloadPage() {
    return (
        <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-center text-red-400 mb-8">
                    DOWNLOADS
                </h1>
                <div className="space-y-8">
                    <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Client</h2>
                        <p className="text-stone-300 mb-4">Download the game client to start playing.</p>
                        <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Download Client
                        </button>
                    </div>
                    <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Essentials</h2>
                        <p className="text-stone-300 mb-4">Required software and frameworks.</p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-stone-200 mb-2">.NET Framework 3.5</h3>
                                <button className="bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded transition-colors">
                                    Download
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-stone-200 mb-2">WinRAR</h3>
                                <button className="bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded transition-colors">
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
