'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHammer, faCoins, faStar, faTicket, faArrowUp, faHashtag, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { local } from '@/lib/utils/localize';

interface CharacterDetailsModalProps {
    char: {
        CharName?: string;
        Level?: number;
        Class?: number;
        SpPoint?: number;
        WaguPoint?: number;
        Hoipoi_MixLevel?: number;
        Money?: number;
        MudosaPoint?: number;
        CCBD_Token?: number;
        CCBD_Limit?: number;
        CCBD_Entry?: number;
        Item_Worth?: number;
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function CharacterDetailsModal({ char, isOpen, onClose }: CharacterDetailsModalProps) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[9999] ${isClosing ? 'pointer-events-none' : ''}`}>
            <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />
            <div
                className={`relative w-full h-full flex items-center justify-center p-4 md:p-8 ${
                    isOpen && !isClosing ? 'animate-popup-enter' : isClosing ? 'animate-popup-exit' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full max-w-md bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-red-500/20">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center bg-stone-800/80 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110 border border-red-500/30 cursor-pointer"
                        aria-label="Close"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-stone-300 text-lg" />
                    </button>

                    <div className="p-6">
                        <h2 className="text-xl font-bold text-white mb-4">{local.characterDetails}</h2>
                        {char && (
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="relative shrink-0">
                                        <div className="overflow-hidden rounded-xl border border-red-500/20 bg-stone-900/50">
                                            <Image src={`/classes/${char.Class}.png`} alt="" width={64} height={64} />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 rounded-lg bg-stone-900 px-2 py-1 text-sm font-bold text-red-400 ring-2 ring-stone-800">
                                            Lv.{char.Level}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-400">{char.CharName}</h3>
                                        <div className="mt-1 text-sm text-white/60">
                                            {local.sp}: <span className="text-red-400/90">{char.SpPoint}</span>
                                            <span className="mx-2">•</span>
                                            {local.wagu}: <span className="text-red-400/90">{char.WaguPoint}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-red-500/20">
                                        <span className="text-white/60 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faHammer} className="text-red-400/80" />
                                            Craft Lv.
                                        </span>
                                        <span className="text-red-400 font-bold">{char.Hoipoi_MixLevel}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-red-500/20">
                                        <span className="text-white/60 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faCoins} className="text-red-400/80" />
                                            Zenny
                                        </span>
                                        <span className="text-red-400 font-bold">{char.Money}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-red-500/20">
                                        <span className="text-white/60 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faStar} className="text-red-400/80" />
                                            Mudosa
                                        </span>
                                        <span className="text-red-400 font-bold">{char.MudosaPoint}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-red-500/20">
                                        <span className="text-white/60 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faArrowUp} className="text-red-400/80" />
                                            Upgraded stats
                                        </span>
                                        <span className="text-red-400 font-bold">{(char.Item_Worth ?? 0)}%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-red-500/20">
                                        <span className="text-white/60 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faTicket} className="text-red-400/80" />
                                            {local.ccbdToken}
                                        </span>
                                        <span className="text-red-400 font-bold">{char.CCBD_Token ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-red-500/20">
                                        <span className="text-white/60 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faHashtag} className="text-red-400/80" />
                                            {local.ccbdLimit}
                                        </span>
                                        <span className="text-red-400 font-bold">{char.CCBD_Limit ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg border border-red-500/20">
                                        <span className="text-white/60 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faRightToBracket} className="text-red-400/80" />
                                            {local.ccbdEntry}
                                        </span>
                                        <span className="text-red-400 font-bold">{char.CCBD_Entry ?? 0}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
