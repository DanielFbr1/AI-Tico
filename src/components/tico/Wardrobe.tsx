import React, { useState } from 'react';
import { TICO_OUTFITS } from '../../services/ticoLogic';
import { TicoState, TicoOutfit } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Lock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';

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
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
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

                            return (
                                <OutfitCard
                                    key={outfit.id}
                                    outfit={outfit}
                                    isUnlocked={isUnlocked}
                                    isEquipped={isEquipped}
                                    onEquip={() => onEquipOutfit(outfit.id === 'default' ? null : outfit.id)}
                                />
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
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
    outfit: Partial<TicoOutfit> & { name: string, description: string };
    isUnlocked: boolean;
    isEquipped: boolean;
    onEquip: () => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, isUnlocked, isEquipped, onEquip }) => {
    const emojis: { [key: string]: string } = {
        'default': '🦜',
        'vis_painter': '🎨',
        'vis_designer': '👓',
        'ent_musician': '🎸',
        'ent_director': '📣',
        'let_writer': '🖋️',
        'let_novelist': '⌨️',
        'ana_detective': '🕵️‍♂️',
        'ana_journalist': '📸'
    };

    return (
        <div
            className={`
                relative p-3 rounded-[1.5rem] border-4 transition-all group overflow-hidden
                ${isUnlocked ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : 'opacity-60 grayscale cursor-not-allowed'}
                ${isEquipped ? 'border-rose-300 bg-rose-50 ring-4 ring-rose-50' : 'border-slate-100 bg-white hover:border-rose-100'}
            `}
            onClick={() => isUnlocked && onEquip()}
        >
            {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px] z-20">
                    <Lock className="w-8 h-8 text-slate-400 drop-shadow-lg" />
                </div>
            )}

            {isEquipped && (
                <div className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full z-10 shadow-lg animate-in zoom-in">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                </div>
            )}

            <div className="text-center space-y-1.5 relative z-10">
                <div className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
                    {emojis[outfit.id as string] || '👕'}
                </div>
                <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">{outfit.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {outfit.description}
                    </p>
                </div>

                {outfit.category && (
                    <div className={`
                        inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2
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
