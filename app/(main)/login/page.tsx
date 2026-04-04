'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { API } from '@/lib/api/client';
import { useLocale } from '@/components/LocaleProvider';

export default function LoginPage() {
    const router = useRouter();
    const { t, locale } = useLocale();
    const localizedTx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const logs = localStorage.getItem('authLogs');
        if (logs) {
            try {
                const logArray = JSON.parse(logs);
                console.log('=== Authentication Debug Logs ===');
                logArray.forEach((log: { time: string; message: string }) => {
                    console.log(`[${log.time}] ${log.message}`);
                });
                console.log('=== End Debug Logs ===');
            } catch (e) {
                console.error('Error parsing logs:', e);
            }
        }
    }, []);

    const onSubmit = async (data: { username?: string; password?: string }) => {
        try {
            setLoading(true);
            console.log('Attempting login with:', data);
            const res = await API.post('/auth/login', data);
            console.log('Login response:', res);

            if (res.status !== 201) {
                alert(`Error: ${res.data.message}`);
                setLoading(false);
                return;
            }

            const token = res.data.token;
            console.log('[Login] Token received, length:', token?.length);

            localStorage.setItem('authToken', token);

            const cookieString = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
            // eslint-disable-next-line react-hooks/immutability
            document.cookie = cookieString;

            const cookieCheck = document.cookie.split(';').some((c) => c.trim().startsWith('token='));
            console.log('[Login] Cookie set:', cookieCheck);
            console.log('[Login] Cookie value exists:', document.cookie.includes('token='));

            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
            console.log('[Login] Cookie token value length:', cookies.token?.length || 0);

            setTimeout(async () => {
                try {
                    const cookiesInner = document.cookie.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        acc[key] = value;
                        return acc;
                    }, {} as Record<string, string>);
                    console.log('[Login] Cookie verification:', !!cookiesInner.token);

                    const accountRes = await API.get('/private');
                    console.log('[Login] Private endpoint response status:', accountRes.status);

                    if (accountRes.status === 201 || accountRes.status === 200) {
                        window.dispatchEvent(new Event('user-logged-in'));

                        const urlParams = new URLSearchParams(window.location.search);
                        const redirect = urlParams.get('redirect');

                        console.log('[Login] Redirect target:', redirect || '/donate');

                        if (redirect) {
                            window.location.href = redirect;
                        } else {
                            router.push('/donate');
                        }
                    } else {
                        console.error('[Login] Private endpoint failed:', accountRes);
                        alert(
                            localizedTx(
                                'Login successful but could not get account data. Please try again.',
                                '로그인은 되었지만 계정 정보를 가져오지 못했습니다. 다시 시도해 주세요.'
                            )
                        );
                        setLoading(false);
                    }
                } catch (privateError) {
                    console.error('[Login] Error accessing private endpoint:', privateError);
                    alert(
                        localizedTx(
                            'Login successful but could not verify account. Please try again.',
                            '로그인은 되었지만 계정 확인에 실패했습니다. 다시 시도해 주세요.'
                        )
                    );
                    setLoading(false);
                }
            }, 300);
        } catch (error) {
            console.error('Login error:', error);
            alert(
                localizedTx(
                    'An error occurred during login. Please try again.',
                    '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.'
                )
            );
            setLoading(false);
        }
    };

    const inputClass =
        'w-full rounded-xl border-2 border-red-400/15 bg-stone-900/70 px-4 py-3 text-lg text-white placeholder:text-stone-500 transition-colors focus:border-red-400/45 focus:outline-none focus:ring-2 focus:ring-red-500/30';

    return (
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 text-white duration-500">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse-slow rounded-full bg-red-500/10 blur-3xl" />
                <div
                    className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse-slow rounded-full bg-red-600/10 blur-3xl"
                    style={{ animationDelay: '1s' }}
                />
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 md:px-6">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <div className="mb-4 flex justify-center">
                            <span className="rounded-full border border-red-300/30 bg-black/45 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-red-100/85 uppercase sm:text-sm">
                                {localizedTx('Welcome back', '다시 오신 것을 환영합니다')}
                            </span>
                        </div>
                        <h1 className="mb-4 text-4xl font-bold text-transparent drop-shadow-2xl sm:text-5xl md:text-6xl bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text">
                            {t('login')}
                        </h1>
                        <div className="relative mx-auto mb-4">
                            <div className="mx-auto h-1 w-40 rounded-full bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-lg" />
                            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                                <FontAwesomeIcon
                                    icon={faRightToBracket}
                                    className="bg-stone-900 px-2 text-xl text-red-500"
                                />
                            </div>
                        </div>
                        <p className="text-sm text-stone-400 md:text-base">
                            {localizedTx(
                                'Sign in to manage your account, donate, and play.',
                                '계정 관리, 후원, 플레이를 위해 로그인하세요.'
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border-2 border-red-400/25 bg-stone-900/60 p-6 shadow-[0_0_40px_rgba(239,68,68,0.08)] backdrop-blur-sm md:p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="username" className="sr-only">
                                    {t('username')}
                                </label>
                                <input
                                    className={inputClass}
                                    type="text"
                                    id="username"
                                    placeholder={t('username')}
                                    autoFocus
                                    autoComplete="username"
                                    {...register('username', { required: true, minLength: 2, maxLength: 16 })}
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-400">{t('usernameError')}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="sr-only">
                                    {t('password')}
                                </label>
                                <input
                                    className={inputClass}
                                    type="password"
                                    id="password"
                                    placeholder={t('password')}
                                    autoComplete="current-password"
                                    {...register('password', { required: true, minLength: 2, maxLength: 16 })}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-400">{t('passwordError')}</p>
                                )}
                            </div>
                            <button
                                className="relative w-full overflow-hidden rounded-xl border-2 border-red-200/60 bg-gradient-to-r from-red-500 to-red-600 py-3.5 text-lg font-bold text-white shadow-[0_0_24px_rgba(239,68,68,0.35)] transition-all duration-300 hover:border-red-100 hover:shadow-[0_0_36px_rgba(239,68,68,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? localizedTx('Logging in…', '로그인 중…')
                                    : t('login')}
                            </button>
                        </form>

                        <div className="mx-auto mt-6 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-red-400/25 to-transparent" />

                        <p className="mt-6 text-center text-sm text-stone-400">
                            {localizedTx('No account yet?', '아직 계정이 없으신가요?')}{' '}
                            <Link
                                href="/register"
                                className="font-semibold text-red-300 underline-offset-4 hover:text-red-200 hover:underline"
                            >
                                {t('register')}
                            </Link>
                        </p>
                    </div>

                    <p className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-stone-500 transition-colors hover:text-red-300/90"
                        >
                            {localizedTx('Back to home', '홈으로')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
