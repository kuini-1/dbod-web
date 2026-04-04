'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Download, ExternalLink, Package } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

const DOTNET_35_URL =
    'https://www.microsoft.com/en-us/download/details.aspx?id=25150';
const WINRAR_URL = 'https://www.win-rar.com/download.html?&L=0';

function trimUrl(v: string | undefined): string {
    return (v || '').trim();
}

export default function DownloadPage() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

    const clientUrlEn = trimUrl(
        process.env.NEXT_PUBLIC_CLIENT_DOWNLOAD_URL_EN ||
            process.env.NEXT_PUBLIC_CLIENT_DOWNLOAD_URL
    );
    const clientUrlKr = trimUrl(process.env.NEXT_PUBLIC_CLIENT_DOWNLOAD_URL_KR);

    const hasAnyClient = Boolean(clientUrlEn || clientUrlKr);
    const primaryCtaClass =
        'group/cta relative inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200/60 bg-gradient-to-r from-red-500 to-red-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_0_24px_rgba(239,68,68,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-red-100 hover:shadow-[0_0_40px_rgba(239,68,68,0.65)] sm:w-auto sm:px-8 sm:py-4 sm:text-lg';

    const steps = [
        tx('Create account', '계정 만들기'),
        tx('Grab the client', '클라이언트 받기'),
        tx('Install prerequisites', '필수 구성 요소 설치'),
        tx('Launch & patch', '실행 및 패치'),
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 px-4 py-8 text-white duration-500 md:px-6 md:py-12 lg:px-8">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse-slow rounded-full bg-red-500/10 blur-3xl" />
                <div
                    className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse-slow rounded-full bg-red-600/10 blur-3xl"
                    style={{ animationDelay: '1s' }}
                />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
                <div className="mb-10 text-center md:mb-12">
                    <div className="mb-5 flex justify-center">
                        <span className="rounded-full border border-red-300/30 bg-black/45 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-red-100/85 uppercase sm:text-sm">
                            {tx('Install & play', '설치 및 플레이')}
                        </span>
                    </div>

                    <h1 className="mb-6 text-5xl font-bold text-transparent drop-shadow-2xl md:text-7xl lg:text-8xl bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text">
                        {tx('DOWNLOADS', '다운로드')}
                    </h1>

                    <div className="relative mx-auto mb-6">
                        <div className="mx-auto h-1.5 w-48 rounded-full bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-lg" />
                        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                            <FontAwesomeIcon
                                icon={faDownload}
                                className="bg-stone-900 px-2 text-2xl text-red-500"
                            />
                        </div>
                    </div>

                    <p className="mx-auto max-w-2xl text-lg font-light text-white/90 md:text-xl">
                        {tx(
                            'Get the game client and everything you need to run DBO Daebak on Windows.',
                            'Windows에서 DBO 대박을 실행하는 데 필요한 게임 클라이언트와 구성 요소를 받으세요.'
                        )}
                    </p>

                    <div className="mx-auto mt-8 mb-2 h-px w-52 bg-gradient-to-r from-transparent via-red-300/65 to-transparent" />

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {steps.map((label, i) => (
                            <div
                                key={`dl-step-${i}`}
                                className="flex items-center gap-2 rounded-full border border-red-400/25 bg-black/35 px-4 py-2 text-sm backdrop-blur-sm"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/30 text-sm font-bold text-red-100">
                                    {i + 1}
                                </span>
                                <span className="text-red-100/90">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                    <section className="group relative overflow-hidden rounded-2xl border-2 border-red-400/35 bg-gradient-to-br from-stone-800/90 to-stone-900/95 p-6 shadow-[0_0_40px_rgba(239,68,68,0.12)] backdrop-blur-sm transition-all duration-300 hover:border-red-300/45 md:p-8 lg:col-span-7">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(239,68,68,0.12)_0%,transparent_50%)]" />
                        <div className="relative">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15">
                                    <Package className="h-6 w-6 text-red-300" strokeWidth={2} />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-2xl font-bold text-red-100 md:text-3xl">
                                        {tx('Game client', '게임 클라이언트')}
                                    </h2>
                                    <p className="text-sm text-stone-400">
                                        {tx(
                                            'Windows · English or Korean client',
                                            'Windows · 영어 또는 한국어 클라이언트'
                                        )}
                                    </p>
                                </div>
                            </div>
                            <p className="mb-6 text-base leading-relaxed text-stone-300 md:text-lg">
                                {tx(
                                    'Download and extract the client, then run the launcher. Patch to the latest version before logging in.',
                                    '클라이언트를 다운로드하여 압축을 풀고 런처를 실행하세요. 로그인 전 최신 버전으로 패치하세요.'
                                )}
                            </p>
                            {hasAnyClient ? (
                                <div className="flex flex-col gap-4">
                                    <p className="text-sm text-stone-400">
                                        {tx(
                                            'Pick the client that matches your game language.',
                                            '게임 언어에 맞는 클라이언트를 선택하세요.'
                                        )}
                                    </p>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                        {clientUrlEn ? (
                                            <a
                                                href={clientUrlEn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={primaryCtaClass}
                                            >
                                                <Download
                                                    className="h-5 w-5 shrink-0"
                                                    strokeWidth={2.5}
                                                />
                                                {tx('English client', '영어 클라이언트')}
                                                <span className="ml-1 rounded-md border border-white/25 bg-black/20 px-2 py-0.5 text-xs font-semibold tracking-wide">
                                                    EN
                                                </span>
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400/20 to-transparent opacity-0 transition-opacity group-hover/cta:opacity-100" />
                                            </a>
                                        ) : null}
                                        {clientUrlKr ? (
                                            <a
                                                href={clientUrlKr}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={primaryCtaClass}
                                            >
                                                <Download
                                                    className="h-5 w-5 shrink-0"
                                                    strokeWidth={2.5}
                                                />
                                                {tx('Korean client', '한국어 클라이언트')}
                                                <span className="ml-1 rounded-md border border-white/25 bg-black/20 px-2 py-0.5 text-xs font-semibold tracking-wide">
                                                    KR
                                                </span>
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400/20 to-transparent opacity-0 transition-opacity group-hover/cta:opacity-100" />
                                            </a>
                                        ) : null}
                                    </div>
                                    {!clientUrlEn || !clientUrlKr ? (
                                        <p className="text-xs text-amber-200/80">
                                            {tx(
                                                'One language build is not linked yet. If yours is missing, check news or ask staff.',
                                                '일부 언어 빌드 링크가 아직 없을 수 있습니다. 없으면 뉴스를 확인하거나 운영진에게 문의하세요.'
                                            )}
                                        </p>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/90">
                                    {tx(
                                        'Client downloads are not linked here yet. Check the latest news or homepage for the files.',
                                        '클라이언트 다운로드 링크가 아직 준비되지 않았습니다. 최신 뉴스나 홈페이지에서 파일 안내를 확인해 주세요.'
                                    )}
                                </div>
                            )}
                            <p className="mt-6 text-sm text-stone-500">
                                {tx('No account yet?', '아직 계정이 없으신가요?')}{' '}
                                <Link
                                    href="/register"
                                    className="font-semibold text-red-300 underline-offset-4 hover:text-red-200 hover:underline"
                                >
                                    {tx('Register here', '여기서 가입')}
                                </Link>
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col gap-4 lg:col-span-5">
                        <h2 className="text-center text-xl font-bold text-red-200/95 lg:text-left">
                            {tx('Prerequisites', '필수 항목')}
                        </h2>
                        <p className="text-center text-sm text-stone-400 lg:text-left">
                            {tx(
                                'Install these on Windows if you do not already have them.',
                                'Windows에 아직 없다면 다음을 설치하세요.'
                            )}
                        </p>

                        <div className="space-y-4">
                            <article className="rounded-2xl border-2 border-red-400/20 bg-stone-900/60 p-5 backdrop-blur-sm transition-colors hover:border-red-400/35">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-100">
                                            .NET Framework 3.5
                                        </h3>
                                        <p className="mt-1 text-sm text-stone-400">
                                            {tx(
                                                'Required by the game client on many Windows setups.',
                                                '많은 Windows 환경에서 게임 클라이언트에 필요합니다.'
                                            )}
                                        </p>
                                    </div>
                                    <a
                                        href={DOTNET_35_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-red-400/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all hover:border-red-300 hover:bg-red-500/20 hover:shadow-[0_0_22px_rgba(239,68,68,0.3)]"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        {tx('Microsoft', 'Microsoft')}
                                    </a>
                                </div>
                            </article>

                            <article className="rounded-2xl border-2 border-red-400/20 bg-stone-900/60 p-5 backdrop-blur-sm transition-colors hover:border-red-400/35">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-100">WinRAR</h3>
                                        <p className="mt-1 text-sm text-stone-400">
                                            {tx(
                                                'Extract the client archive (.rar). Any compatible archiver works.',
                                                '클라이언트 압축 파일(.rar)을 풀 때 사용합니다. 호환 압축 프로그램이면 됩니다.'
                                            )}
                                        </p>
                                    </div>
                                    <a
                                        href={WINRAR_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-red-400/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all hover:border-red-300 hover:bg-red-500/20 hover:shadow-[0_0_22px_rgba(239,68,68,0.3)]"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        {tx('Official site', '공식 사이트')}
                                    </a>
                                </div>
                            </article>
                        </div>

                        <div className="mt-2 rounded-2xl border border-red-400/15 bg-black/30 p-5 backdrop-blur-sm">
                            <p className="text-center text-sm text-stone-400 lg:text-left">
                                {tx('Having trouble?', '문제가 있나요?')}{' '}
                                <Link
                                    href="/"
                                    className="font-medium text-red-300 hover:text-red-200 hover:underline"
                                >
                                    {tx('Back to home', '홈으로')}
                                </Link>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
