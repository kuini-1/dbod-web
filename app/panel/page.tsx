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
    faKey, 
    faLock, 
    faCoins, 
    faDollarSign,
    faEnvelope,
    faCheckCircle,
    faClock,
    faArrowUp,
    faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';
import UpgradeEquipmentModal from '@/components/UpgradeEquipmentModal';
import CharacterDetailsModal from '@/components/CharacterDetailsModal';
import { SuccessToast, WarningToast, DangerToast } from '@/lib/utils/toasts';
import { useForm } from 'react-hook-form';

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
}

interface DonationLogProps {
    Value: number;
    mallpoints: number;
}

type PanelTab = 'userInfo' | 'characters' | 'donations';

const UserInfo = ({ username, email, cp, onChangePassword }: { username: string; email: string; cp: number; onChangePassword: () => void }) => {
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
                    <h2 className='text-xl font-bold text-white/60 mb-4'>Account Status</h2>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between p-3 bg-stone-700/50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faCheckCircle} className='text-white/40 text-sm' />
                                <span className='text-white/60'>Status</span>
                            </div>
                            <span className='px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold flex items-center gap-1'>
                                <FontAwesomeIcon icon={faCheckCircle} className='text-xs' />
                                active
                            </span>
                        </div>
                        <div className='flex items-center justify-between p-3 bg-stone-700/50 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <FontAwesomeIcon icon={faClock} className='text-white/40 text-sm' />
                                <span className='text-white/60'>Last Login</span>
                            </div>
                            <span className='text-red-400 font-bold'>Today</span>
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
            </div>
        </div>
    );
};

const Character = ({ char, onUpgradeClick, onDetailsClick }: { char: CharactersProps; onUpgradeClick: () => void; onDetailsClick: () => void }) => {
    return (
        <div className='group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-stone-800/80 to-stone-900/80 transition-all duration-300 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/5'>
            <div className='p-6'>
                <div className='flex items-start gap-4'>
                    <div className='relative shrink-0'>
                        <div className='overflow-hidden rounded-xl border border-white/10 bg-stone-900/50'>
                            <Image src={`/classes/${char.Class}.png`} alt="" width={48} height={48} />
                        </div>
                        <div className='absolute -bottom-2 -right-2 rounded-lg bg-stone-900 px-2 py-0.5 text-xs font-bold text-red-400 ring-2 ring-stone-800'>
                            Lv.{char.Level}
                        </div>
                    </div>
                    <div className='min-w-0 flex-1'>
                        <h3 className='text-lg font-bold text-red-400 truncate'>{char.CharName}</h3>
                        <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60'>
                            <span>{local.sp}: <span className='text-red-400/90'>{char.SpPoint}</span></span>
                            <span>{local.wagu}: <span className='text-red-400/90'>{char.WaguPoint}</span></span>
                        </div>
                    </div>
                </div>
                <div className='mt-4 flex gap-2'>
                    <button
                        onClick={onDetailsClick}
                        className='flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-stone-800/50 px-4 py-2.5 text-sm font-medium text-white/70 transition-all duration-300 hover:border-red-500/50 hover:text-red-400 cursor-pointer'
                    >
                        <FontAwesomeIcon icon={faCircleInfo} className='text-sm' />
                        <span>Details</span>
                    </button>
                    <button
                        onClick={onUpgradeClick}
                        className='flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-stone-800/50 px-4 py-2.5 text-sm font-medium text-red-400/90 transition-all duration-300 hover:border-red-500/50 hover:text-red-400 cursor-pointer'
                    >
                        <FontAwesomeIcon icon={faArrowUp} className='text-sm' />
                        <span>Upgrade</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const Characters = ({ characters, onUpgradeClick, onDetailsClick }: { characters: CharactersProps[]; onUpgradeClick: (char: CharactersProps) => void; onDetailsClick: (char: CharactersProps) => void }) => {
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

export default function PanelPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<PanelTab>('userInfo');
    const [account, setAccount] = useState<AccountProps & { vip?: number }>();
    const [characters, setCharacters] = useState<CharactersProps[]>([]);
    const [donationLog, setDonationLog] = useState<DonationLogProps[]>([]);
    const [changePassword, setChangePassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedChar, setSelectedChar] = useState<CharactersProps | null>(null);
    const { register, handleSubmit } = useForm();

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
                SuccessToast.fire('Password changed successfully');
            } else if (res.status === 408) {
                WarningToast.fire('Password does not match!');
            } else if (res.status === 409) {
                DangerToast.fire('Unknown error!');
            }
        } catch (error) {
            DangerToast.fire('Unknown error!');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Small delay to ensure NavbarClient has set the cookie
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if user has a token
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/login?redirect=/panel');
                return;
            }
            
            // Helper to get cookies
            const getCookies = () => {
                return document.cookie.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);
            };
            
            // Ensure cookie is set - this is critical for middleware
            let cookies = getCookies();
            if (!cookies.token) {
                const isSecure = window.location.protocol === 'https:';
                const secureFlag = isSecure ? '; Secure' : '';
                document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                // Wait and verify cookie was set
                await new Promise(resolve => setTimeout(resolve, 200));
                cookies = getCookies();
                
                if (!cookies.token) {
                    // Try one more time without encoding
                    document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                    await new Promise(resolve => setTimeout(resolve, 200));
                    cookies = getCookies();
                    
                    if (!cookies.token) {
                        console.error('Failed to set cookie');
                        router.push('/login?redirect=/panel');
                        return;
                    }
                }
            }
            
            // Verify cookie is set and matches token before making API call
            cookies = getCookies();
            const cookieToken = cookies.token;
            console.log('[Panel] Cookie exists before API call:', !!cookieToken);
            console.log('[Panel] Cookie token length:', cookieToken?.length || 0);
            console.log('[Panel] localStorage token length:', token?.length || 0);
            console.log('[Panel] Tokens match:', cookieToken === token);
            
            // If cookie doesn't match token, set it again
            if (cookieToken !== token) {
                console.log('[Panel] Cookie token mismatch, resetting cookie');
                const isSecure = window.location.protocol === 'https:';
                const secureFlag = isSecure ? '; Secure' : '';
                document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            try {
                const profileRes = await API.get("/my-profile");
                console.log('[Panel] API response status:', profileRes.status);
                
                if (profileRes.status === 201) {
                    setAccount(profileRes.data.Account);
                    setDonationLog(profileRes.data.DonationLog);
                    await fetchCharacters();
                } else if (profileRes.status === 401) {
                    console.error('[Panel] 401 Unauthorized - redirecting to login');
                    router.push('/login?redirect=/panel');
                    return;
                }
            } catch (error: any) {
                console.error('[Panel] Failed to fetch profile:', error);
                console.error('[Panel] Error status:', error?.status);
                console.error('[Panel] Error data:', error?.data);
                
                // Check if it's a 401 error
                if (error?.status === 401 || error?.response?.status === 401 || 
                    (error?.data?.message && error.data.message.includes('Unauthorized'))) {
                    router.push('/login?redirect=/panel');
                    return;
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [router]);

    if (loading) {
        return (
            <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto mb-4"></div>
                    <div className="text-xl">Loading...</div>
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
                        <button 
                            onClick={() => setActiveTab('userInfo')} 
                            className={`flex items-center space-x-2 font-bold text-xl transition-colors duration-300 ${
                                activeTab === 'userInfo' 
                                    ? "text-red-400" 
                                    : "text-white/60 hover:text-red-400"
                            }`}
                        >
                            <FontAwesomeIcon icon={faUser} className="text-xl" />
                            <span>{local.userInfo}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('characters')} 
                            className={`flex items-center space-x-2 font-bold text-xl transition-colors duration-300 ${
                                activeTab === 'characters' 
                                    ? "text-red-400" 
                                    : "text-white/60 hover:text-red-400"
                            }`}
                        >
                            <FontAwesomeIcon icon={faUsers} className="text-xl" />
                            <span>{local.characters}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('donations')} 
                            className={`flex items-center space-x-2 font-bold text-xl transition-colors duration-300 ${
                                activeTab === 'donations' 
                                    ? "text-red-400" 
                                    : "text-white/60 hover:text-red-400"
                            }`}
                        >
                            <FontAwesomeIcon icon={faGift} className="text-xl" />
                            <span>{local.donations}</span>
                        </button>
                    </div>

                    <div className="mt-8">
                        {activeTab === 'userInfo' && (
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
                                        <p className="text-white/60 text-lg">No characters found</p>
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
        </div>
    );
}
