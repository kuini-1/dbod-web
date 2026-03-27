'use client';

import { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { API } from '@/lib/api/client';
import DailyLoginAutoModal from './DailyLoginAutoModal';

interface DailyReward {
    date: number;
    itemId: number;
    amount: number;
    name: string;
    iconUrl: string | null;
    claimed: boolean;
    available: boolean;
    isRepeat?: boolean;
}

const ALWAYS_SHOW_DAILY_LOGIN_MODAL = process.env.NEXT_PUBLIC_DAILY_LOGIN_TEST_ALWAYS_SHOW === '1';

async function delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

export default function NavbarClient() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRewards, setModalRewards] = useState<DailyReward[]>([]);
    const [modalResetDays, setModalResetDays] = useState(0);
    const [claimedDay, setClaimedDay] = useState(0);
    const [claimedAmount, setClaimedAmount] = useState(0);
    const [passIsActive, setPassIsActive] = useState(false);
    const [passPrice, setPassPrice] = useState(0);
    const [mallpoints, setMallpoints] = useState(0);
    const [buyingPass, setBuyingPass] = useState(false);

    const openDailyLoginModal = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const privateRes = await API.get('/private');
        if (privateRes.status !== 200 && privateRes.status !== 201) return;
        setMallpoints(Number(privateRes.data?.mallpoints ?? 0));

        let rewardsRes = await API.get('/daily-rewards');
        if (rewardsRes.status !== 200) {
            await delay(250);
            rewardsRes = await API.get('/daily-rewards');
        }
        if (rewardsRes.status !== 200) return;

        const rewardData = Array.isArray(rewardsRes.data?.data) ? rewardsRes.data.data : [];
        setModalRewards(rewardData);
        setModalResetDays(Number(rewardsRes.data?.timeUntilReset?.days ?? 0));
        setPassIsActive(!!rewardsRes.data?.pass?.isActive);
        setPassPrice(Number(rewardsRes.data?.pass?.price ?? 0));
        setClaimedDay(0);
        setClaimedAmount(0);
        setModalOpen(true);
    };

    useEffect(() => {
        // Sync cookie from localStorage on every page load
        // This ensures cookies are always set when there's a token
        const token = localStorage.getItem('authToken');
        if (token && typeof document !== 'undefined') {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
            
            if (!cookies.token) {
                const isSecure = window.location.protocol === 'https:';
                const secureFlag = isSecure ? '; Secure' : '';
                document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
            }
        }
    }, []);

    useEffect(() => {
        const runAutoCheckin = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const todayKey = new Date().toISOString().slice(0, 10);
            const shownKey = `daily-login-auto-modal:${todayKey}`;
            if (!ALWAYS_SHOW_DAILY_LOGIN_MODAL && sessionStorage.getItem(shownKey)) return;

            // Ensure logged-in state first in case cookie sync is still racing.
            const privateRes = await API.get('/private');
            if (privateRes.status !== 200 && privateRes.status !== 201) return;
            setMallpoints(Number(privateRes.data?.mallpoints ?? 0));

            const autoRes = await API.post('/daily-rewards/auto-checkin');
            const autoClaimed = !!autoRes.data?.autoClaimed;

            if (!ALWAYS_SHOW_DAILY_LOGIN_MODAL && !autoClaimed) return;

            // Retry daily-rewards once if auth/cookie is still racing on initial mount.
            let rewardsRes = await API.get('/daily-rewards');
            if (rewardsRes.status !== 200) {
                await delay(250);
                rewardsRes = await API.get('/daily-rewards');
            }

            const rewardData = Array.isArray(rewardsRes.data?.data) ? rewardsRes.data.data : [];
            setModalRewards(rewardData);
            setModalResetDays(Number(rewardsRes.data?.timeUntilReset?.days ?? 0));
            setPassIsActive(!!rewardsRes.data?.pass?.isActive);
            setPassPrice(Number(rewardsRes.data?.pass?.price ?? 0));
            setClaimedDay(Number(autoRes.data?.claim?.day ?? 0));
            setClaimedAmount(Number(autoRes.data?.claim?.amount ?? 0));
            // In test mode always show modal once per page load, even when rewards fetch fails.
            if (ALWAYS_SHOW_DAILY_LOGIN_MODAL || rewardsRes.status === 200) {
                setModalOpen(true);
            }
            if (!ALWAYS_SHOW_DAILY_LOGIN_MODAL && rewardsRes.status === 200) {
                sessionStorage.setItem(shownKey, '1');
            }
        };

        runAutoCheckin().catch(() => {
            // No-op: auto check-in should never block navigation.
        });
    }, []);

    useEffect(() => {
        const handleOpenDailyLoginModal = () => {
            openDailyLoginModal().catch(() => {
                // No-op: manual open should not break page flow.
            });
        };

        window.addEventListener('open-daily-login-modal', handleOpenDailyLoginModal);
        return () => window.removeEventListener('open-daily-login-modal', handleOpenDailyLoginModal);
    }, []);

    const handlePurchasePass = async () => {
        try {
            setBuyingPass(true);
            const response = await API.post('/daily-rewards/pass/purchase');
            if (response.status !== 200) return;

            setMallpoints(Number(response.data?.mallpoints ?? mallpoints));

            const rewardsRes = await API.get('/daily-rewards');
            if (rewardsRes.status === 200) {
                const rewardData = Array.isArray(rewardsRes.data?.data) ? rewardsRes.data.data : [];
                setModalRewards(rewardData);
                setModalResetDays(Number(rewardsRes.data?.timeUntilReset?.days ?? 0));
                setPassIsActive(!!rewardsRes.data?.pass?.isActive);
                setPassPrice(Number(rewardsRes.data?.pass?.price ?? passPrice));
            }
        } finally {
            setBuyingPass(false);
        }
    };

    return (
        <>
            <Navbar />
            <DailyLoginAutoModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                rewards={modalRewards}
                resetDays={modalResetDays}
                claimedDay={claimedDay}
                claimedAmount={claimedAmount}
                showPurchaseButton
                passIsActive={passIsActive}
                passPrice={passPrice}
                mallpoints={mallpoints}
                buyingPass={buyingPass}
                onPurchase={handlePurchasePass}
                purchaseButtonText="Purchase Now"
                passActiveText="Pass Active"
                purchasingText="Purchasing..."
            />
        </>
    );
}
