'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faMinus, faRotate } from '@fortawesome/free-solid-svg-icons';
import { local, formatString } from '@/lib/utils/localize';
import { API } from '@/lib/api/client';
import { SuccessToast, DangerToast } from '@/lib/utils/toasts';

interface CharacterForModal {
    CharID?: number;
    CharName?: string;
    CCBD_Token?: number;
    CCBD_Limit?: number;
    CCBD_Entry?: number;
    Item_Worth?: number;
}

interface UpgradeEquipmentModalProps {
    char: CharacterForModal | null;
    accountVip?: number;
    mallpoints?: number;
    isOpen: boolean;
    onClose: () => void;
    onRefillSuccess?: (newCCBDEntry: number) => void;
}

const DUMMY_STATS = [
    { name: 'con', min: 10, max: 20, newMin: 12, newMax: 24 },
    { name: 'foc', min: 8, max: 16, newMin: 10, newMax: 19 },
    { name: 'eng', min: 5, max: 15, newMin: 6, newMax: 18 },
    { name: 'dex', min: 12, max: 22, newMin: 14, newMax: 26 },
    { name: 'str', min: 10, max: 25, newMin: 12, newMax: 30 },
    { name: 'sol', min: 3, max: 10, newMin: 4, newMax: 12 },
    { name: 'crit block %', min: 2, max: 8, newMin: 2, newMax: 10 },
    { name: 'lp regen', min: 5, max: 15, newMin: 6, newMax: 18 },
    { name: 'ep regen', min: 4, max: 12, newMin: 5, newMax: 14 },
    { name: 'physical defense', min: 20, max: 50, newMin: 24, newMax: 60 },
    { name: 'energy defense', min: 18, max: 45, newMin: 22, newMax: 54 },
    { name: 'attack speed', min: 1, max: 5, newMin: 1, newMax: 6 },
    { name: 'cast speed', min: 1, max: 4, newMin: 1, newMax: 5 },
    { name: 'move speed', min: 2, max: 8, newMin: 2, newMax: 10 },
    { name: 'critical rate', min: 3, max: 12, newMin: 4, newMax: 14 },
    { name: 'critical damage', min: 5, max: 20, newMin: 6, newMax: 24 },
    { name: 'block rate', min: 2, max: 10, newMin: 2, newMax: 12 },
    { name: 'dodge rate', min: 2, max: 9, newMin: 2, newMax: 11 },
    { name: 'accuracy', min: 4, max: 16, newMin: 5, newMax: 19 },
    { name: 'physical attack', min: 15, max: 40, newMin: 18, newMax: 48 },
    { name: 'energy attack', min: 14, max: 38, newMin: 17, newMax: 46 },
    { name: 'lp max', min: 50, max: 150, newMin: 60, newMax: 180 },
    { name: 'ep max', min: 40, max: 120, newMin: 48, newMax: 144 },
    { name: 'lp regen %', min: 1, max: 5, newMin: 1, newMax: 6 },
    { name: 'ep regen %', min: 1, max: 4, newMin: 1, newMax: 5 },
    { name: 'physical pierce', min: 2, max: 8, newMin: 2, newMax: 10 },
    { name: 'energy pierce', min: 2, max: 7, newMin: 2, newMax: 8 },
    { name: 'damage reduction', min: 1, max: 6, newMin: 1, newMax: 7 },
    { name: 'reflect damage', min: 0, max: 4, newMin: 0, newMax: 5 },
    { name: 'cooldown reduction', min: 1, max: 3, newMin: 1, newMax: 4 },
    { name: 'skill power', min: 10, max: 30, newMin: 12, newMax: 36 },
];

export default function UpgradeEquipmentModal({ char, accountVip = 0, mallpoints = 0, isOpen, onClose, onRefillSuccess }: UpgradeEquipmentModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [upgradeAmount, setUpgradeAmount] = useState(0);
    const [showRefillConfirm, setShowRefillConfirm] = useState(false);
    const [isRefilling, setIsRefilling] = useState(false);
    const [ccbdEntry, setCcbEntry] = useState(char?.CCBD_Entry ?? 0);

    const itemWorth = char?.Item_Worth ?? 0;

    const ccbdTokens = char?.CCBD_Token ?? 0;
    const ccbdLimit = char?.CCBD_Limit ?? 0;
    const maxUpgrades = Math.floor(ccbdTokens / 5);

    const canRefill = ccbdEntry < ccbdLimit && mallpoints >= 25;
    const refillCost = 25;

    useEffect(() => {
        if (char) {
            setCcbEntry(char.CCBD_Entry ?? 0);
        }
    }, [char?.CCBD_Entry]);

    useEffect(() => {
        if (isOpen && char) {
            setUpgradeAmount(0);
        }
    }, [isOpen, char]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    const incrementAmount = () => setUpgradeAmount((prev) => Math.min(prev + 1, maxUpgrades));
    const decrementAmount = () => setUpgradeAmount((prev) => Math.max(prev - 1, 0));
    const canIncrement = upgradeAmount < maxUpgrades;

    const handleRefillConfirm = async () => {
        if (!char?.CharID) return;
        setIsRefilling(true);
        try {
            const res = await API.post('/ccbd-refill', { CharID: char.CharID });
            if (res.status === 200 && res.data.success) {
                const newEntry = res.data.CCBD_Entry ?? ccbdLimit;
                setCcbEntry(newEntry);
                setShowRefillConfirm(false);
                SuccessToast.fire(local.refillSuccess);
                onRefillSuccess?.(newEntry);
            } else {
                DangerToast.fire(res.data.message || 'Failed to refill');
            }
        } catch {
            DangerToast.fire('Failed to refill');
        } finally {
            setIsRefilling(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[9999] ${isClosing ? 'pointer-events-none' : ''}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full h-full flex items-center justify-center p-4 md:p-8 ${
                    isOpen && !isClosing ? 'animate-popup-enter' : isClosing ? 'animate-popup-exit' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-red-500/20 flex flex-col">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center bg-stone-800/80 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110 border border-red-500/30 cursor-pointer"
                        aria-label="Close"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-stone-300 text-lg" />
                    </button>

                    {/* Header */}
                    <div className="p-6 border-b border-red-500/20">
                        <h2 className="text-2xl font-bold text-white">{local.upgradeEquipmentStats}</h2>
                        {char?.CharName && (
                            <p className="text-stone-400 text-sm mt-1">{char.CharName}</p>
                        )}
                    </div>

                    {/* Content - scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Info row: CCBD_Token, CCBD_Limit, CCBD_Entry, VIP */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">{local.ccbdToken}</div>
                                <div className="text-red-400 font-bold text-lg">{char?.CCBD_Token ?? 0}</div>
                                <div className="text-stone-500 text-xs mt-0.5">5 per upgrade</div>
                            </div>
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">{local.ccbdLimit}</div>
                                <div className="text-red-400 font-bold text-lg">{char?.CCBD_Limit ?? 0}</div>
                            </div>
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">{local.ccbdEntry}</div>
                                <div className="text-red-400 font-bold text-lg">{ccbdEntry}</div>
                                {canRefill && (
                                    <button
                                        onClick={() => setShowRefillConfirm(true)}
                                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-400/90 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 rounded transition-colors cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faRotate} className="text-xs" />
                                        <span>{local.refill}</span>
                                    </button>
                                )}
                            </div>
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">VIP</div>
                                <div className="text-red-400 font-bold text-lg">{accountVip ?? 0}</div>
                            </div>
                        </div>

                        {/* Upgrade section */}
                        <div className="p-4 bg-stone-800/50 rounded-xl border border-red-500/20">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div className="text-stone-300">
                                    {local.currentUpgradedStats}: <span className="text-red-400 font-bold">{itemWorth}%</span>
                                </div>
                                {maxUpgrades === 0 && (
                                    <p className="text-amber-400/90 text-sm">Need 5 CCBD tokens per upgrade. You have {ccbdTokens} tokens.</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={decrementAmount}
                                        disabled={upgradeAmount <= 0}
                                        className="w-10 h-10 flex items-center justify-center bg-stone-700 hover:bg-red-500/20 rounded-lg border border-red-500/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-700"
                                    >
                                        <FontAwesomeIcon icon={faMinus} className="text-stone-300" />
                                    </button>
                                    <span className="text-white font-bold min-w-[4rem] text-center">{upgradeAmount}</span>
                                    <button
                                        onClick={incrementAmount}
                                        disabled={!canIncrement}
                                        className="w-10 h-10 flex items-center justify-center bg-stone-700 hover:bg-red-500/20 rounded-lg border border-red-500/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-700"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-stone-300" />
                                    </button>
                                </div>
                                <div className="text-stone-300">
                                    {formatString(local.increaseStatsBy, upgradeAmount, itemWorth + upgradeAmount)}
                                </div>
                            </div>
                        </div>

                        {/* Stats preview (dummy) */}
                        <div className="p-4 bg-stone-800/50 rounded-xl border border-red-500/20">
                            <h3 className="text-lg font-semibold text-white mb-4">Stats Preview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                {DUMMY_STATS.map((stat, i) => (
                                    <div key={i} className="flex justify-between text-sm py-1.5 px-2 bg-stone-900/50 rounded border border-red-500/10">
                                        <span className="text-stone-300 capitalize">{stat.name}</span>
                                        <span className="text-stone-400">
                                            {upgradeAmount >= 1 ? (
                                                <>{stat.min}-{stat.max} → <span className="text-red-400">{stat.newMin}-{stat.newMax}</span></>
                                            ) : (
                                                <>{stat.min}-{stat.max}</>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-4 bg-red-950/20 rounded-xl border border-red-500/30">
                            <p className="text-red-200/90 text-sm">{local.craftedEquipmentOnly}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refill confirmation popup */}
            {showRefillConfirm && (
                <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="mx-4 max-w-sm w-full rounded-xl border border-red-500/20 bg-stone-900 p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-2">{local.refillConfirmTitle}</h3>
                        <p className="text-stone-300 text-sm mb-4">
                            {formatString(local.refillConfirmMessage, ccbdLimit)} ({refillCost} {local.cashPoints})
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRefillConfirm(false)}
                                disabled={isRefilling}
                                className="flex-1 py-2 rounded-lg border border-white/20 bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {local.cancel}
                            </button>
                            <button
                                onClick={handleRefillConfirm}
                                disabled={isRefilling}
                                className="flex-1 py-2 rounded-lg border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isRefilling ? local.loading : local.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
