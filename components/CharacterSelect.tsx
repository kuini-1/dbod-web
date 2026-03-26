'use client';

import { useState, useEffect } from 'react';
import { API } from '../lib/api/client';
import Image from 'next/image';
import { useLocale } from './LocaleProvider';

interface Character {
    CharID: number;
    CharName: string;
    Level: number;
    Class: number;
}

interface CharacterSelectProps {
    onSelect: (character: Character) => void;
    selectedCharacter?: Character;
    title?: string;
}

export default function CharacterSelect({ onSelect, selectedCharacter, title = "Select Character" }: CharacterSelectProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                const res = await API.get("/characters");
                
                if (res.status === 200 && res.data.success) {
                    setCharacters(res.data.characters);
                }
            } catch (error) {
                console.error('Failed to fetch characters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCharacters();
    }, []);

    if (loading) {
        return (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="animate-pulse flex items-center justify-center space-x-4">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-indigo-500/50 rounded-lg transition-all duration-200 group cursor-pointer"
            >
                <div className="flex items-center justify-between">
                    <span className="text-white/60">{title === 'Select Character' ? tx('Select Character', '캐릭터 선택') : title}</span>
                    {selectedCharacter ? (
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <Image 
                                    src={`/classes/${selectedCharacter.Class}.png`} 
                                    alt="" 
                                    width={32}
                                    height={32}
                                />
                                <div className="absolute -bottom-2 -right-2 bg-slate-900 px-1.5 py-0.5 rounded-full text-xs font-bold text-indigo-400">
                                    {tx('Lv.', '레벨')} {selectedCharacter.Level}
                                </div>
                            </div>
                            <span className="text-indigo-400 font-bold">{selectedCharacter.CharName}</span>
                            <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <span className="text-slate-400">{tx('Select a character', '캐릭터를 선택하세요')}</span>
                            <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-slate-800/95 rounded-lg border border-slate-700/50 shadow-lg backdrop-blur-sm">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        {characters.map((char) => (
                            <button
                                key={char.CharName}
                                onClick={() => {
                                    onSelect(char);
                                    setIsOpen(false);
                                }}
                                className={`w-full p-3 flex items-center space-x-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                                    selectedCharacter?.CharName === char.CharName
                                        ? 'bg-indigo-600/20 text-indigo-400'
                                        : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                                }`}
                            >
                                <div className="relative">
                                    <Image 
                                        src={`/classes/${char.Class}.png`} 
                                        alt="" 
                                        width={32}
                                        height={32}
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-slate-900 px-1.5 py-0.5 rounded-full text-xs font-bold text-indigo-400">
                                        {tx('Lv.', '레벨')} {char.Level}
                                    </div>
                                </div>
                                <span className="font-bold">{char.CharName}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
