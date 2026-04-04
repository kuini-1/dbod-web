'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { API } from '@/lib/api/client';
import { useLocale } from '@/components/LocaleProvider';

export default function RegisterPage() {
    const router = useRouter();
    const { t, locale } = useLocale();
    const localizedTx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

    const { register, handleSubmit, formState: { errors } } = useForm();
    const [match, setMatch] = useState(true);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: {
        email?: string;
        username?: string;
        password?: string;
        confirm_password?: string;
    }) => {
        try {
            if (data.password !== data.confirm_password) {
                setMatch(false);
                return;
            }

            setMatch(true);
            setLoading(true);
            console.log('Attempting registration with:', data);

            const registerRes = await API.post('/auth/register', data);
            console.log('Registration response:', registerRes);

            if (registerRes.status !== 201) {
                alert(`Error: ${registerRes.data.message}`);
                setLoading(false);
                return;
            }

            console.log('Registration successful, logging in automatically...');
            const loginRes = await API.post('/auth/login', {
                username: data.username,
                password: data.password,
            });
            console.log('Auto-login response:', loginRes);

            if (loginRes.status !== 201) {
                alert(
                    localizedTx(
                        'Registration successful but auto-login failed. Please login manually.',
                        '가입은 완료되었지만 자동 로그인에 실패했습니다. 직접 로그인해 주세요.'
                    )
                );
                router.push('/login');
                setLoading(false);
                return;
            }

            const token = loginRes.data.token;
            localStorage.setItem('authToken', token);

            setTimeout(async () => {
                try {
                    const accountRes = await API.get('/private');
                    console.log('User data response:', accountRes);

                    if (accountRes.status === 200 || accountRes.status === 201) {
                        router.push('/donate');
                    } else {
                        console.error('Failed to get user data:', accountRes);
                        alert(
                            localizedTx(
                                'Registration and login succeeded but user data could not be loaded. Please refresh.',
                                '가입 및 로그인은 되었지만 사용자 정보를 불러오지 못했습니다. 새로고침해 주세요.'
                            )
                        );
                    }
                } catch (privateError) {
                    console.error('Error getting user data:', privateError);
                    alert(
                        localizedTx(
                            'Registration and login succeeded but account could not be verified. Please refresh.',
                            '가입 및 로그인은 되었지만 계정 확인에 실패했습니다. 새로고침해 주세요.'
                        )
                    );
                } finally {
                    setLoading(false);
                }
            }, 500);
        } catch (error) {
            console.error('Registration error:', error);
            alert(
                localizedTx(
                    'An error occurred during registration. Please try again.',
                    '가입 중 오류가 발생했습니다. 다시 시도해 주세요.'
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
                                {localizedTx('Join the server', '서버에 참여하세요')}
                            </span>
                        </div>
                        <h1 className="mb-4 text-4xl font-bold text-transparent drop-shadow-2xl sm:text-5xl md:text-6xl bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text">
                            {t('register')}
                        </h1>
                        <div className="relative mx-auto mb-4">
                            <div className="mx-auto h-1 w-40 rounded-full bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-lg" />
                            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                                <FontAwesomeIcon
                                    icon={faUserPlus}
                                    className="bg-stone-900 px-2 text-xl text-red-500"
                                />
                            </div>
                        </div>
                        <p className="text-sm text-stone-400 md:text-base">
                            {localizedTx(
                                'Create your account, then download the client and start your adventure.',
                                '계정을 만든 뒤 클라이언트를 받고 모험을 시작하세요.'
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border-2 border-red-400/25 bg-stone-900/60 p-6 shadow-[0_0_40px_rgba(239,68,68,0.08)] backdrop-blur-sm md:p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="sr-only">
                                    {t('email')}
                                </label>
                                <input
                                    className={inputClass}
                                    type="email"
                                    id="email"
                                    placeholder={t('email')}
                                    autoFocus
                                    autoComplete="email"
                                    {...register('email', {
                                        required: true,
                                        pattern:
                                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                                    })}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-400">{t('emailError')}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="username" className="sr-only">
                                    {t('username')}
                                </label>
                                <input
                                    className={inputClass}
                                    type="text"
                                    id="username"
                                    placeholder={t('username')}
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
                                    autoComplete="new-password"
                                    {...register('password', { required: true, minLength: 2, maxLength: 16 })}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-400">{t('passwordError')}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirm_password" className="sr-only">
                                    {t('confirmPassword')}
                                </label>
                                <input
                                    className={inputClass}
                                    type="password"
                                    id="confirm_password"
                                    placeholder={t('confirmPassword')}
                                    autoComplete="new-password"
                                    {...register('confirm_password', {
                                        required: true,
                                        minLength: 2,
                                        maxLength: 16,
                                    })}
                                />
                                {errors.confirm_password && (
                                    <p className="text-sm text-red-400">{t('passwordError')}</p>
                                )}
                                {!match && (
                                    <p className="text-sm text-red-400">{t('confirmPasswordError')}</p>
                                )}
                            </div>

                            <button
                                className="relative w-full overflow-hidden rounded-xl border-2 border-red-200/60 bg-gradient-to-r from-red-500 to-red-600 py-3.5 text-lg font-bold text-white shadow-[0_0_24px_rgba(239,68,68,0.35)] transition-all duration-300 hover:border-red-100 hover:shadow-[0_0_36px_rgba(239,68,68,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? localizedTx('Creating account…', '계정 만드는 중…')
                                    : t('register')}
                            </button>
                        </form>

                        <div className="mx-auto mt-6 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-red-400/25 to-transparent" />

                        <p className="mt-6 text-center text-sm text-stone-400">
                            {localizedTx('Already have an account?', '이미 계정이 있으신가요?')}{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-red-300 underline-offset-4 hover:text-red-200 hover:underline"
                            >
                                {t('login')}
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
