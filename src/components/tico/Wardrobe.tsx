import React, { useState } from 'react';
import { TICO_OUTFITS } from '../../services/ticoLogic';
import { TicoState, TicoOutfit, TicoCategory } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Lock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ticoAudio } from '../../lib/audio/TicoAudioEngine';

interface WardrobeProps {
    ticoState: TicoState;
    onEquipOutfit: (outfitId: string | null) => void;
}

export const Wardrobe: React.FC<WardrobeProps> = ({ ticoState, onEquipOutfit }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const ITEMS_PER_PAGE = 4;

    const allItems = [
        {
            id: 'default',
            name: 'Original',
            description: 'Tico al natural.',
            category: 'Letters' as const,
            prompt_modifier: '',
            required_level: 0
        },
        ...TICO_OUTFITS
    ];

    const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
    const currentItems = allItems.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    return (
        <Card className="w-full h-full border-none shadow-none bg-transparent flex flex-col">
            <CardContent className="flex-1 min-h-0 p-0 flex flex-col items-center justify-center relative">

                <div className="flex items-center gap-2 w-full">
                    <button
                        onClick={() => { ticoAudio.playClickSFX(); setCurrentPage(p => Math.max(0, p - 1)); }}
                        disabled={currentPage === 0}
                        className="p-2 rounded-full bg-white shadow-md border-2 border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-90 disabled:opacity-20"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="flex-1 grid grid-cols-2 gap-3 animate-in slide-in-from-right-10 duration-500">
                        {currentItems.map(outfit => {
                            const isUnlocked = outfit.id === 'default' || ticoState.unlocked_outfits.includes(outfit.id);
                            const isEquipped = (outfit.id === 'default' && ticoState.current_outfit_id === null) ||
                                (ticoState.current_outfit_id === outfit.id);

                            const xpForCategory = outfit.category ? (ticoState.experience[outfit.category as TicoCategory] || 0) : 0;

                            return (
                                <OutfitCard
                                    key={outfit.id}
                                    outfit={outfit as TicoOutfit}
                                    isUnlocked={isUnlocked}
                                    isEquipped={isEquipped}
                                    currentXP={xpForCategory}
                                    onEquip={() => {
                                        ticoAudio.playClickSFX();
                                        onEquipOutfit(outfit.id === 'default' ? null : outfit.id);
                                    }}
                                />
                            );
                        })}
                    </div>

                    <button
                        onClick={() => { ticoAudio.playClickSFX(); setCurrentPage(p => Math.min(totalPages - 1, p + 1)); }}
                        disabled={currentPage >= totalPages - 1}
                        className="p-2 rounded-full bg-white shadow-md border-2 border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-90 disabled:opacity-20"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Pagination Dots */}
                <div className="flex gap-2 mt-4">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPage ? 'w-6 bg-rose-500' : 'w-1.5 bg-slate-200'}`}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

interface OutfitCardProps {
    outfit: Partial<TicoOutfit> & { id: string, name: string, description: string, required_level?: number, category?: string };
    isUnlocked: boolean;
    isEquipped: boolean;
    onEquip: () => void;
    currentXP: number;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, isUnlocked, isEquipped, onEquip, currentXP }) => {
    const emojis: { [key: string]: string } = {
        'default': '🦜',
        'vis_painter': '🎨',
        'vis_designer': '👓',
        'vis_curator': '🧤',
        'ent_musician': '🎸',
        'ent_director': '📣',
        'ent_magician': '🎩',
        'let_writer': '🖋️',
        'let_novelist': '⌨️',
        'let_philosopher': '🌿',
        'ana_detective': '🕵️‍♂️',
        'ana_journalist': '📸',
        'ana_scientist': '🥼'
    };

    const requiredXP = outfit.required_level || 0;
    const progressPercent = Math.min(100, (currentXP / requiredXP) * 100);
    const resourcesNeeded = Math.max(0, Math.ceil((requiredXP - currentXP) / 100));

    return (
        <div
            className={`
                relative p-3 rounded-[2rem] border-4 transition-all group overflow-hidden flex flex-col items-center justify-center min-h-[160px]
                ${isUnlocked ? 'hover:-translate-y-1 hover:shadow-xl cursor-pointer' : 'opacity-80 grayscale-[0.5] cursor-not-allowed'}
                ${isEquipped ? 'border-rose-300 bg-rose-50 ring-4 ring-rose-50' : 'border-slate-100 bg-white hover:border-slate-200'}
            `}
            onClick={() => isUnlocked && onEquip()}
        >
            {!isUnlocked && (
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center p-4">
                    <div className="bg-white/90 p-2 rounded-full shadow-sm mb-2">
                        <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-auto">
                        <div
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 bg-rose-50 px-2 py-0.5 rounded-md">
                        {resourcesNeeded} {resourcesNeeded === 1 ? 'RECURSO' : 'RECURSOS'}
                    </span>
                </div>
            )}

            {isEquipped && (
                <div className="absolute top-3 right-3 bg-rose-500 text-white p-1 rounded-full z-10 shadow-lg animate-in zoom-in">
                    <Check className="w-3 h-3 stroke-[4]" />
                </div>
            )}

            <div className={`text-center space-y-2 relative z-10 flex flex-col items-center ${!isUnlocked ? 'blur-[2px] opacity-40' : ''}`}>
                <div className="text-5xl group-hover:scale-110 transition-transform duration-500 drop-shadow-md">
                    {emojis[outfit.id] || '👕'}
                </div>
                <div className="w-full px-2">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-tight line-clamp-1">{outfit.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold leading-tight mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {outfit.description}
                    </p>
                </div>

                {outfit.category && (
                    <div className={`
                        inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2 mt-auto
                        ${outfit.category === 'VisualArts' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                            outfit.category === 'Entertainment' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                outfit.category === 'Letters' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    outfit.category === 'Analysis' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'}
                    `}>
                        {outfit.category === 'VisualArts' ? 'Artes Visuales' :
                            outfit.category === 'Entertainment' ? 'Espectáculo' :
                                outfit.category === 'Letters' ? 'Letras' :
                                    outfit.category === 'Analysis' ? 'Análisis' : outfit.category}
                    </div>
                )}
            </div>
        </div>
    );
};
