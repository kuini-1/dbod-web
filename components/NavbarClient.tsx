'use client';

import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { API } from '@/lib/api/client';
import DailyLoginAutoModal from './DailyLoginAutoModal';
import EventDailyLoginModal, { type EventDailyApiPayload } from '@/components/EventDailyLoginModal';

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

function parseEventDailyResponse(data: unknown): {
    payload: EventDailyApiPayload | null;
    shouldAutoOpen: boolean;
} {
    if (!data || typeof data !== 'object') return { payload: null, shouldAutoOpen: false };
    const d = data as EventDailyApiPayload;
    if (!d.success) return { payload: null, shouldAutoOpen: false };
    if (d.hasActiveEvent === false) return { payload: d, shouldAutoOpen: false };
    const rows = Array.isArray(d.data) ? d.data : [];
    return {
        payload: d,
        shouldAutoOpen: rows.some((r) => r.available),
    };
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
    const [eventDailyPayload, setEventDailyPayload] = useState<EventDailyApiPayload | null>(null);
    const [eventDailyModalOpen, setEventDailyModalOpen] = useState(false);
    const [pendingEventAfterDailyClose, setPendingEventAfterDailyClose] = useState(false);

    const refreshEventDailyPayload = useCallback(async () => {
        const res = await API.get('/event-daily-rewards');
        if (res.status === 200 && res.data && typeof res.data === 'object') {
            setEventDailyPayload(res.data as EventDailyApiPayload);
        } else {
            setEventDailyPayload(null);
        }
    }, []);

    const openDailyLoginModal = async () => {
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
            // Ensure logged-in state first in case cookie sync is still racing.
            const privateRes = await API.get('/private');
            if (privateRes.status !== 200 && privateRes.status !== 201) return;
            setMallpoints(Number(privateRes.data?.mallpoints ?? 0));

            // Run on every page load / refresh so the server always applies today's check-in rules.
            const [autoRes, eventAutoRes] = await Promise.all([
                API.post('/daily-rewards/auto-checkin'),
                API.post('/event-daily-rewards/auto-checkin'),
            ]);
            const autoClaimed = !!autoRes.data?.autoClaimed;
            const eventAutoClaimed = !!eventAutoRes.data?.autoClaimed;

            // Always fetch monthly rewards after auto-checkin to avoid stale pre-claim snapshots.
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

            // Same for event rewards: read state after event auto-checkin.
            const eventResAfterAuto = await API.get('/event-daily-rewards');
            const { payload: eventPayload, shouldAutoOpen: shouldShowEvent } =
                parseEventDailyResponse(eventResAfterAuto.data);
            setEventDailyPayload(eventPayload);

            // Test mode: show modal every load even if /daily-rewards fails.
            if (ALWAYS_SHOW_DAILY_LOGIN_MODAL) {
                setModalOpen(true);
                return;
            }

            if (rewardsRes.status !== 200) return;

            // Monthly modal when auto-claimed; event modal when a step is claimable (same load).
            if (autoClaimed && (shouldShowEvent || eventAutoClaimed)) {
                setPendingEventAfterDailyClose(true);
                setModalOpen(true);
            } else if (autoClaimed) {
                setModalOpen(true);
            } else if (shouldShowEvent || eventAutoClaimed) {
                setEventDailyModalOpen(true);
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

        const handleOpenEventDailyLoginModal = () => {
            refreshEventDailyPayload()
                .then(() => setEventDailyModalOpen(true))
                .catch(() => {});
        };

        window.addEventListener('open-daily-login-modal', handleOpenDailyLoginModal);
        window.addEventListener('open-event-daily-login-modal', handleOpenEventDailyLoginModal);
        return () => {
            window.removeEventListener('open-daily-login-modal', handleOpenDailyLoginModal);
            window.removeEventListener('open-event-daily-login-modal', handleOpenEventDailyLoginModal);
        };
    }, [refreshEventDailyPayload]);

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
                onClose={() => {
                    setModalOpen(false);
                    if (pendingEventAfterDailyClose) {
                        setPendingEventAfterDailyClose(false);
                        setEventDailyModalOpen(true);
                    }
                }}
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
            <EventDailyLoginModal
                isOpen={eventDailyModalOpen}
                onClose={() => setEventDailyModalOpen(false)}
                payload={eventDailyPayload}
                loading={false}
                onRefresh={refreshEventDailyPayload}
            />
        </>
    );
}
