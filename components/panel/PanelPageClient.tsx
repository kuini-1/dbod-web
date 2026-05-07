'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faUsers,
    faGift,
    faCalendarCheck,
    faKey,
    faLock,
    faCoins,
    faDollarSign,
    faEnvelope,
    faCheckCircle,
    faClock,
    faArrowUp,
    faCircleInfo,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';
import { useLocale } from '@/components/LocaleProvider';
import UpgradeEquipmentModal from '@/components/UpgradeEquipmentModal';
import CharacterDetailsModal from '@/components/CharacterDetailsModal';
import { SuccessToast, WarningToast, DangerToast } from '@/lib/utils/toasts';
import { useForm } from 'react-hook-form';

type PanelTab = 'user-info' | 'characters' | 'donations';

interface AccountProps {
    Username: string;
    email: string;
    mallpoints: number;
}

interface CharactersProps {
    CharID?: number;
    CharName: string;
    Level: number;
    Class: number;
    SpPoint: number;
    WaguPoint: number;
    Hoipoi_MixLevel: number;
    Money: number;
    MudosaPoint: number;
    CCBD_Token?: number;
    CCBD_Limit?: number;
    CCBD_Entry?: number;
    Item_Worth?: number;
    BoughtSP?: number;
}

interface DonationLogProps {
    Value: number;
    mallpoints: number;
}

const UserInfo = ({
    username,
    email,
    cp,
    onChangePassword
}: {
    username: string;
    email: string;
    cp: number;
    onChangePassword: () => void;
}) => {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-stone-800/50 rounded-xl p-6 border border-white/5 hover:border-red-500/50 transition-colors duration-300'>
                    <h2 className='text-xl font-bold text-white/60 mb-4'>{local.userInfo}</h2>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between p-3 bg-stone-700/50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faUser} className='text-white/40 text-sm' />
                                <span className='text-white/60'>{local.username}</span>
                            </div>
                            <span className='text-red-400 font-bold'>{username}</span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-stone-700/50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faEnvelope} className='text-white/40 text-sm' />
                                <span className='text-white/60'>{local.email}</span>
                            </div>
                            <span className='text-red-400 font-bold'>{email}</span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-stone-700/50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faCoins} className='text-white/40 text-sm' />
                                <span className='text-white/60'>{local.cashPoints}</span>
                            </div>
                            <span className='text-red-400 font-bold'>{cp}</span>
                        </div>
                    </div>
                </div>

                <div className='bg-stone-800/50 rounded-xl p-6 border border-white/5 hover:border-red-500/50 transition-colors duration-300'>
                    <h2 className='text-xl font-bold text-white/60 mb-4'>{tx('Account Status', '계정 상태')}</h2>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between p-3 bg-stone-700/50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faCheckCircle} className='text-white/40 text-sm' />
                                <span className='text-white/60'>{tx('Status', '상태')}</span>
                            </div>
                            <span className='px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold flex items-center gap-1'>
                                <FontAwesomeIcon icon={faCheckCircle} className='text-xs' />
                                {tx('active', '활성')}
                            </span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-stone-700/50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faClock} className='text-white/40 text-sm' />
                                <span className='text-white/60'>{tx('Last Login', '최근 로그인')}</span>
                            </div>
                            <span className='text-red-400 font-bold'>{tx('Today', '오늘')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex flex-col md:flex-row gap-4'>
                <button
                    onClick={onChangePassword}
                    className='flex-1 p-4 bg-stone-800/50 hover:bg-stone-700/50 border border-white/5 hover:border-red-500/50 rounded-xl transition-all duration-300 group cursor-pointer'
                >
                    <div className='flex items-center justify-center space-x-3'>
                        <FontAwesomeIcon
                            icon={faKey}
                            className='text-red-400 group-hover:scale-110 transition-transform duration-300 text-xl'
                        />
                        <span className='font-bold text-lg'>{local.changePassword}</span>
                    </div>
                </button>
                <Link href="/donate" className="flex-1">
                    <button className='w-full p-4 bg-stone-800/50 hover:bg-stone-700/50 border border-white/5 hover:border-red-500/50 rounded-xl transition-all duration-300 group cursor-pointer'>
                        <div className='flex items-center justify-center space-x-3'>
                            <FontAwesomeIcon
                                icon={faGift}
                                className='text-red-400 group-hover:scale-110 transition-transform duration-300 text-xl'
                            />
                            <span className='font-bold text-lg'>{local.donate}</span>
                        </div>
                    </button>
                </Link>
                <button
                    onClick={() => window.dispatchEvent(new Event('open-daily-login-modal'))}
                    className='flex-1 w-full p-4 bg-stone-800/50 hover:bg-stone-700/50 border border-white/5 hover:border-red-500/50 rounded-xl transition-all duration-300 group cursor-pointer'
                >
                    <div className='flex items-center justify-center space-x-3'>
                        <FontAwesomeIcon
                            icon={faCalendarCheck}
                            className='text-red-400 group-hover:scale-110 transition-transform duration-300 text-xl'
                        />
                        <span className='font-bold text-lg'>{tx('Daily Login', '출석 보상')}</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

const Character = ({ char, onUpgradeClick, onDetailsClick, onPurchaseSpClick }: { char: CharactersProps; onUpgradeClick: () => void; onDetailsClick: () => void; onPurchaseSpClick: () => void }) => {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const canUpgrade = Number(char.CCBD_Token ?? 0) >= 5;
    return (
        <div className='group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-stone-800/80 to-stone-900/80 transition-all duration-300 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/5'>
            {canUpgrade ? (
                <div className='absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-300'>
                    <span className='w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse' />
                    {tx('Upgrade ready', '업그레이드 가능')}
                </div>
            ) : null}
            <div className='p-6'>
                <div className='flex items-start gap-4'>
                    <div className='relative shrink-0'>
                        <div className='overflow-hidden rounded-xl border border-white/10 bg-stone-900/50'>
                            <Image src={`/classes/${char.Class}.png`} alt="" width={48} height={48} />
                        </div>
                        <div className='absolute -bottom-2 -right-2 rounded-lg bg-stone-900 px-2 py-0.5 text-xs font-bold text-red-400 ring-2 ring-stone-800'>
                            {tx('Lv.', '레벨')} {char.Level}
                        </div>
                    </div>
                    <div className='min-w-0 flex-1'>
                        <h3 className='text-lg font-bold text-red-400 truncate'>{char.CharName}</h3>
                        <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60'>
                            <span>{local.sp}: <span className='text-red-400/90'>{char.SpPoint}</span></span>
                            <span>{tx('Bought SP', '구매 SP')}: <span className='text-red-400/90'>{char.BoughtSP ?? 0}</span></span>
                            <span>{tx('Tokens', '토큰')}: <span className='text-red-400/90'>{char.CCBD_Token ?? 0}</span></span>
                        </div>
                    </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                    <button
                        onClick={onDetailsClick}
                        className='flex-1 min-w-[108px] whitespace-nowrap flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-stone-800/60 px-3 py-2.5 text-xs font-semibold tracking-wide text-white/70 transition-all duration-300 hover:border-red-500/50 hover:text-red-300 hover:bg-stone-800 cursor-pointer'
                    >
                        <FontAwesomeIcon icon={faCircleInfo} className='text-sm' />
                        <span>{tx('Details', '상세')}</span>
                    </button>
                    <button
                        onClick={onPurchaseSpClick}
                        className='flex-1 min-w-[132px] whitespace-nowrap flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-semibold tracking-wide text-red-200 transition-all duration-300 hover:border-red-400/60 hover:bg-red-500/20 cursor-pointer'
                    >
                        <FontAwesomeIcon icon={faPlus} className='text-sm' />
                        <span>{tx('Purchase SP', 'SP 구매')}</span>
                    </button>
                    <button
                        onClick={onUpgradeClick}
                        className={`flex-1 min-w-[120px] whitespace-nowrap flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                            canUpgrade
                                ? 'border border-red-500/50 bg-red-500/20 text-red-200 hover:bg-red-500/30 hover:border-red-400'
                                : 'border border-white/10 bg-stone-800/60 text-red-300/90 hover:border-red-500/50 hover:text-red-300'
                        }`}
                    >
                        <FontAwesomeIcon icon={faArrowUp} className='text-sm' />
                        <span>{tx('Upgrade', '업그레이드')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const Characters = ({ characters, onUpgradeClick, onDetailsClick, onPurchaseSpClick }: { characters: CharactersProps[]; onUpgradeClick: (char: CharactersProps) => void; onDetailsClick: (char: CharactersProps) => void; onPurchaseSpClick: (char: CharactersProps) => void }) => {
    return (
        <div className='space-y-6'>
            <h2 className='text-2xl font-bold text-white/60'>{local.characters}</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {characters?.map((char, i) => (
                    <Character
                        key={char.CharID ?? i}
                        char={char}
                        onUpgradeClick={() => onUpgradeClick(char)}
                        onDetailsClick={() => onDetailsClick(char)}
                        onPurchaseSpClick={() => onPurchaseSpClick(char)}
                    />
                ))}
            </div>
        </div>
    );
};

const Donations = ({ donations }: { donations: DonationLogProps[] }) => {
    return (
        <div className='space-y-4'>
            <h2 className='text-2xl font-bold text-white/60 mb-6'>{local.donations}</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {donations?.map((donation, i) => (
                    <div key={i} className='p-4 bg-stone-800/50 rounded-xl border border-white/5 hover:border-red-500/50 transition-all duration-300 group'>
                        <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faGift} className='text-red-400/60 text-sm' />
                                <span className='text-white/60'>#{i + 1}</span>
                            </div>
                            <span className='text-sm text-white/40'>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faDollarSign} className='text-red-400 text-sm' />
                                <span className='text-lg font-bold text-red-400'>{donation.Value} USD</span>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faCoins} className='text-green-400 text-sm' />
                                <span className='text-lg font-bold text-green-400'>{donation.mallpoints} CP</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function PanelPageClient({ activeTab, redirectPath }: { activeTab: PanelTab; redirectPath: string }) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const router = useRouter();
    const [account, setAccount] = useState<AccountProps & { vip?: number }>();
    const [characters, setCharacters] = useState<CharactersProps[]>([]);
    const [donationLog, setDonationLog] = useState<DonationLogProps[]>([]);
    const [changePassword, setChangePassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [purchaseSpModalOpen, setPurchaseSpModalOpen] = useState(false);
    const [purchaseSpConfirmOpen, setPurchaseSpConfirmOpen] = useState(false);
    const [purchaseSpQuantity, setPurchaseSpQuantity] = useState(1);
    const [purchaseSpLoading, setPurchaseSpLoading] = useState(false);
    const [selectedChar, setSelectedChar] = useState<CharactersProps | null>(null);
    const { register, handleSubmit } = useForm();
    const hasUpgradeableCharacter = characters.some((char) => Number(char.CCBD_Token ?? 0) >= 5);
    const spUnitCost = 10;
    const maxPurchasedSpTotal = 100;
    const selectedCharBoughtSP = Math.max(0, Number(selectedChar?.BoughtSP ?? 0));
    const remainingPurchasableSP = Math.max(0, maxPurchasedSpTotal - selectedCharBoughtSP);
    const normalizedPurchaseQuantity = remainingPurchasableSP > 0
        ? Math.min(Math.max(1, purchaseSpQuantity), remainingPurchasableSP)
        : 0;
    const spTotalCost = normalizedPurchaseQuantity * spUnitCost;

    const fetchCharacters = async () => {
        try {
            const res = await API.get("/characters");
            if (res.status === 200 && res.data.success) {
                setCharacters(res.data.characters);
            }
        } catch (error: any) {
            console.error('Failed to fetch characters:', error);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            const res = await API.post("/auth/change-password", data);
            if (res.status === 201) {
                setChangePassword(false);
                SuccessToast.fire(tx('Password changed successfully', '비밀번호가 변경되었습니다'));
            } else if (res.status === 408) {
                WarningToast.fire(tx('Password does not match!', '비밀번호가 일치하지 않습니다!'));
            } else if (res.status === 409) {
                DangerToast.fire(tx('Unknown error!', '알 수 없는 오류!'));
            }
        } catch (error) {
            DangerToast.fire(tx('Unknown error!', '알 수 없는 오류!'));
        }
    };

    const closePurchaseSpModal = () => {
        setPurchaseSpModalOpen(false);
        setPurchaseSpConfirmOpen(false);
        setPurchaseSpQuantity(1);
        setSelectedChar(null);
    };

    const executePurchaseSp = async (quantity: number, totalCost: number) => {
        if (!selectedChar?.CharID) return;
        setPurchaseSpLoading(true);
        try {
            const res = await API.post('/characters/purchase-sp', {
                charId: selectedChar.CharID,
                quantity,
            });

            if (res.status === 200 && res.data?.success) {
                const updatedCharacter = res.data.character;
                setAccount((current) => current ? { ...current, mallpoints: res.data.mallpoints } : current);
                setCharacters((current) => current.map((char) => (
                    char.CharID === updatedCharacter.CharID
                        ? { ...char, SpPoint: updatedCharacter.SpPoint, BoughtSP: updatedCharacter.BoughtSP }
                        : char
                )));
                SuccessToast.fire(tx('SP purchased successfully.', 'SP 구매가 완료되었습니다.'));
                closePurchaseSpModal();
            } else if (res.status === 402) {
                WarningToast.fire(tx('Not enough cash points.', '캐시 포인트가 부족합니다.'));
            } else {
                DangerToast.fire(res.data?.message || tx('Failed to purchase SP.', 'SP 구매에 실패했습니다.'));
            }
        } catch (error: any) {
            if (error?.response?.status === 402) {
                WarningToast.fire(tx('Not enough cash points.', '캐시 포인트가 부족합니다.'));
            } else {
                DangerToast.fire(error?.response?.data?.message || tx('Failed to purchase SP.', 'SP 구매에 실패했습니다.'));
            }
        } finally {
            setPurchaseSpLoading(false);
        }
    };

    const purchaseSp = async () => {
        const quantity = Math.floor(Number(purchaseSpQuantity));
        if (!Number.isFinite(quantity) || quantity <= 0) {
            DangerToast.fire(tx('Please enter a valid SP amount.', '올바른 SP 수량을 입력하세요.'));
            return;
        }

        if (remainingPurchasableSP <= 0) {
            WarningToast.fire(tx('This character already reached the max purchased SP (100).', '이 캐릭터는 이미 구매 SP 최대치(100)에 도달했습니다.'));
            return;
        }

        if (quantity > remainingPurchasableSP) {
            WarningToast.fire(
                tx(
                    `You can only purchase up to ${remainingPurchasableSP} more SP.`,
                    `최대 ${remainingPurchasableSP} SP까지만 추가 구매할 수 있습니다.`
                )
            );
            return;
        }

        const totalCost = quantity * spUnitCost;
        if ((account?.mallpoints ?? 0) < totalCost) {
            WarningToast.fire(tx('Not enough cash points.', '캐시 포인트가 부족합니다.'));
            return;
        }

        setPurchaseSpConfirmOpen(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            await new Promise(resolve => setTimeout(resolve, 100));

            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                return;
            }

            const getCookies = () => {
                return document.cookie.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);
            };

            let cookies = getCookies();
            if (!cookies.token) {
                const isSecure = window.location.protocol === 'https:';
                const secureFlag = isSecure ? '; Secure' : '';
                document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                await new Promise(resolve => setTimeout(resolve, 200));
                cookies = getCookies();

                if (!cookies.token) {
                    document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                    await new Promise(resolve => setTimeout(resolve, 200));
                    cookies = getCookies();

                    if (!cookies.token) {
                        router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                        return;
                    }
                }
            }

            cookies = getCookies();
            const cookieToken = cookies.token;
            if (cookieToken !== token) {
                const isSecure = window.location.protocol === 'https:';
                const secureFlag = isSecure ? '; Secure' : '';
                document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            try {
                const profileRes = await API.get("/my-profile");
                if (profileRes.status === 201) {
                    setAccount(profileRes.data.Account);
                    setDonationLog(profileRes.data.DonationLog);
                    await fetchCharacters();
                } else if (profileRes.status === 401) {
                    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                    return;
                }
            } catch (error: any) {
                if (error?.status === 401 || error?.response?.status === 401 ||
                    (error?.data?.message && error.data.message.includes('Unauthorized'))) {
                    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                    return;
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router, redirectPath]);

    if (loading) {
        return (
            <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto mb-4"></div>
                    <div className="text-xl">{local.loading}</div>
                </div>
            </div>
        );
    }

    if (changePassword) {
        return (
            <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className='bg-stone-800/50 rounded-xl p-6 md:p-10 border border-white/5'>
                        <div className='flex items-center space-x-4 mb-8'>
                            <button
                                onClick={() => setChangePassword(false)}
                                className='text-xl hover:text-red-400 transition-colors duration-200 p-2 cursor-pointer'
                            >
                                ←
                            </button>
                            <h1 className='text-2xl text-red-400 font-bold'>{local.changePassword}</h1>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                            <input
                                className='w-full bg-stone-700/50 p-4 text-lg rounded-xl border border-white/5 focus:border-red-500/50 outline-none transition-colors duration-300'
                                type="password"
                                placeholder={local.currentPassword}
                                autoFocus
                                {...register("CurrentPassword", { required: true, minLength: 2, maxLength: 16 })}
                            />
                            <input
                                className='w-full bg-stone-700/50 p-4 text-lg rounded-xl border border-white/5 focus:border-red-500/50 outline-none transition-colors duration-300'
                                type="password"
                                placeholder={local.newPassword}
                                {...register("NewPassword", { required: true, minLength: 2, maxLength: 16 })}
                            />
                            <button
                                className='w-full p-4 bg-stone-800/50 hover:bg-stone-700/50 border border-white/5 hover:border-red-500/50 rounded-xl transition-all duration-300 group'
                                type="submit"
                            >
                                <div className='flex items-center justify-center space-x-3'>
                                    <FontAwesomeIcon
                                        icon={faLock}
                                        className='text-red-400 group-hover:scale-110 transition-transform duration-300 text-xl'
                                    />
                                    <span className='font-bold text-lg'>{local.changePassword}</span>
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-stone-800/50 rounded-xl p-6 md:p-10 border border-white/5">
                    <div className="flex flex-wrap gap-4 md:gap-10 mb-8 border-b border-white/5 pb-4">
                        <Link
                            href="/panel/user-info"
                            className={`flex items-center space-x-2 font-bold text-xl transition-colors duration-300 cursor-pointer ${activeTab === 'user-info'
                                ? "text-red-400"
                                : "text-white/60 hover:text-red-400"
                                }`}
                        >
                            <FontAwesomeIcon icon={faUser} className="text-xl" />
                            <span>{local.userInfo}</span>
                        </Link>
                        <Link
                            href="/panel/characters"
                            className={`flex items-center space-x-2 font-bold text-xl transition-colors duration-300 cursor-pointer ${activeTab === 'characters'
                                ? "text-red-400"
                                : "text-white/60 hover:text-red-400"
                                }`}
                        >
                            <FontAwesomeIcon icon={faUsers} className="text-xl" />
                            <span>{local.characters}</span>
                            {hasUpgradeableCharacter ? (
                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                            ) : null}
                        </Link>
                        <Link
                            href="/panel/donations"
                            className={`flex items-center space-x-2 font-bold text-xl transition-colors duration-300 cursor-pointer ${activeTab === 'donations'
                                ? "text-red-400"
                                : "text-white/60 hover:text-red-400"
                                }`}
                        >
                            <FontAwesomeIcon icon={faGift} className="text-xl" />
                            <span>{local.donations}</span>
                        </Link>
                    </div>

                    <div className="mt-8">
                        {activeTab === 'user-info' && (
                            <UserInfo
                                username={account?.Username || ''}
                                email={account?.email || ''}
                                cp={account?.mallpoints || 0}
                                onChangePassword={() => setChangePassword(true)}
                            />
                        )}
                        {activeTab === 'characters' && (
                            <>
                                {characters.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-white/60 text-lg">{tx('No characters found', '캐릭터가 없습니다')}</p>
                                    </div>
                                ) : (
                                    <Characters
                                        characters={characters}
                                        onUpgradeClick={(char) => {
                                            setSelectedChar(char);
                                            setUpgradeModalOpen(true);
                                        }}
                                        onDetailsClick={(char) => {
                                            setSelectedChar(char);
                                            setDetailsModalOpen(true);
                                        }}
                                        onPurchaseSpClick={(char) => {
                                            setSelectedChar(char);
                                            const bought = Math.max(0, Number(char.BoughtSP ?? 0));
                                            const remaining = Math.max(0, maxPurchasedSpTotal - bought);
                                            setPurchaseSpQuantity(remaining > 0 ? 1 : 0);
                                            setPurchaseSpModalOpen(true);
                                        }}
                                    />
                                )}
                            </>
                        )}
                        {activeTab === 'donations' && (
                            <Donations donations={donationLog || []} />
                        )}
                    </div>
                </div>
            </div>

            <UpgradeEquipmentModal
                char={selectedChar}
                accountVip={account?.vip ?? 0}
                mallpoints={account?.mallpoints ?? 0}
                isOpen={upgradeModalOpen}
                onClose={() => {
                    setUpgradeModalOpen(false);
                    setSelectedChar(null);
                }}
                onRefillSuccess={(newCCBDEntry) => {
                    fetchCharacters();
                    if (selectedChar) {
                        setSelectedChar({ ...selectedChar, CCBD_Entry: newCCBDEntry });
                    }
                }}
                onUpgradeSuccess={(payload) => {
                    fetchCharacters();
                    if (selectedChar) {
                        setSelectedChar({ ...selectedChar, ...payload });
                    }
                }}
            />
            <CharacterDetailsModal
                char={selectedChar}
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedChar(null);
                }}
            />

            {purchaseSpModalOpen && selectedChar ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-stone-900 p-6 shadow-2xl shadow-black/40">
                        <div className="mb-5">
                            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">{tx('Purchase SP', 'SP 구매')}</p>
                            <h2 className="mt-1 text-2xl font-bold text-white">{selectedChar.CharName}</h2>
                            <p className="mt-2 text-sm text-white/55">{tx('Choose how many skill points to buy for this character.', '이 캐릭터에 구매할 스킬 포인트 수량을 선택하세요.')}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl border border-white/5 bg-stone-800/60 p-4">
                                <div className="flex items-center justify-between text-sm text-white/60">
                                    <span>{tx('Rate', '요율')}</span>
                                    <span className="font-semibold text-red-300">1 SP = {spUnitCost} CP</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-white/60">
                                    <span>{tx('Your Cash Points', '보유 캐시 포인트')}</span>
                                    <span className="font-semibold text-white">{account?.mallpoints ?? 0} CP</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-white/60">
                                    <span>{tx('Current SP', '현재 SP')}</span>
                                    <span className="font-semibold text-white">{selectedChar.SpPoint}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-white/60">
                                    <span>{tx('Purchased SP Limit', '구매 SP 제한')}</span>
                                    <span className="font-semibold text-white">{selectedCharBoughtSP}/{maxPurchasedSpTotal}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-white/60">
                                    <span>{tx('Remaining Purchasable', '추가 구매 가능')}</span>
                                    <span className="font-semibold text-white">{remainingPurchasableSP}</span>
                                </div>
                            </div>

                            <label className="block">
                                <span className="text-sm font-medium text-white/70">{tx('SP Amount', 'SP 수량')}</span>
                                <input
                                    type="number"
                                    min={remainingPurchasableSP > 0 ? 1 : 0}
                                    max={remainingPurchasableSP}
                                    value={purchaseSpQuantity}
                                    onChange={(event) => {
                                        const next = Math.floor(Number(event.target.value || 0));
                                        if (!Number.isFinite(next)) {
                                            setPurchaseSpQuantity(remainingPurchasableSP > 0 ? 1 : 0);
                                            return;
                                        }
                                        if (remainingPurchasableSP <= 0) {
                                            setPurchaseSpQuantity(0);
                                            return;
                                        }
                                        setPurchaseSpQuantity(Math.min(remainingPurchasableSP, Math.max(1, next)));
                                    }}
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-stone-800 px-4 py-3 text-lg font-semibold text-white outline-none transition-colors focus:border-red-500/60"
                                />
                            </label>

                            <div className="rounded-xl bg-red-500/10 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/70">{tx('Total Cost', '총 비용')}</span>
                                    <span className="text-xl font-bold text-red-300">{spTotalCost} CP</span>
                                </div>
                                <p className="mt-1 text-xs text-white/45">
                                    {tx('Your in-game SP updates immediately if the character is online.', '캐릭터가 온라인이면 게임 내 SP가 즉시 갱신됩니다.')}
                                </p>
                                {remainingPurchasableSP <= 0 ? (
                                    <p className="mt-2 text-xs font-semibold text-amber-300">
                                        {tx('This character already reached the 100 purchased SP cap.', '이 캐릭터는 구매 SP 최대치 100에 도달했습니다.')}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={closePurchaseSpModal}
                                disabled={purchaseSpLoading}
                                className="flex-1 rounded-xl border border-white/10 bg-stone-800 px-4 py-3 font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-60"
                            >
                                {tx('Cancel', '취소')}
                            </button>
                            <button
                                type="button"
                                onClick={purchaseSp}
                                disabled={purchaseSpLoading || remainingPurchasableSP <= 0 || (account?.mallpoints ?? 0) < spTotalCost}
                                className="flex-1 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-3 font-semibold text-red-200 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {purchaseSpLoading ? tx('Purchasing...', '구매 중...') : tx('Purchase', '구매')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {purchaseSpConfirmOpen && selectedChar ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-stone-900 p-6 shadow-2xl shadow-black/40">
                        <p className="text-sm font-semibold uppercase tracking-wide text-red-300">{tx('Confirm Purchase', '구매 확인')}</p>
                        <h3 className="mt-1 text-xl font-bold text-white">{selectedChar.CharName}</h3>
                        <div className="mt-4 space-y-2 text-sm text-white/70">
                            <div className="flex items-center justify-between">
                                <span>{tx('SP to purchase', '구매 SP')}</span>
                                <span className="font-semibold text-white">+{normalizedPurchaseQuantity}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>{tx('Total cost', '총 비용')}</span>
                                <span className="font-semibold text-red-300">{spTotalCost} CP</span>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-white/50">
                            {tx('This action will spend cash points immediately.', '이 작업은 즉시 캐시 포인트를 차감합니다.')}
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setPurchaseSpConfirmOpen(false)}
                                disabled={purchaseSpLoading}
                                className="flex-1 rounded-xl border border-white/10 bg-stone-800 px-4 py-3 font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-60"
                            >
                                {tx('Back', '뒤로')}
                            </button>
                            <button
                                type="button"
                                onClick={() => executePurchaseSp(normalizedPurchaseQuantity, spTotalCost)}
                                disabled={purchaseSpLoading}
                                className="flex-1 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-3 font-semibold text-red-200 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {purchaseSpLoading ? tx('Purchasing...', '구매 중...') : tx('Confirm', '확인')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
