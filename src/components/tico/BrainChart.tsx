import React from 'react';
import { TicoState, TicoCategory } from '../../types';
import { Card } from '../ui/card';
import { Sparkles, BookOpen, Film, Music, Newspaper, Info, HelpCircle, GraduationCap, Palette, Video, FileText, Monitor, Podcast } from 'lucide-react';

interface BrainChartProps {
    ticoState: TicoState;
}

export const BrainChart: React.FC<BrainChartProps> = ({ ticoState }) => {
    const stats = ticoState.resource_stats || {};
    const hasStats = Object.keys(stats).length > 0;

    // Helper to get icons for common resource types matching IngestionModule
    const getIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('libro')) return <BookOpen className="w-8 h-8 text-blue-500" />;
        if (t.includes('película') || t.includes('cine') || t.includes('peli')) return <Film className="w-8 h-8 text-rose-500" />;
        if (t.includes('canción') || t.includes('música')) return <Music className="w-8 h-8 text-rose-500" />;
        if (t.includes('periódico')) return <Newspaper className="w-8 h-8 text-emerald-500" />;
        if (t.includes('cómic')) return <Palette className="w-8 h-8 text-pink-500" />;
        if (t.includes('video')) return <Video className="w-8 h-8 text-pink-500" />;
        if (t.includes('informe')) return <FileText className="w-8 h-8 text-emerald-500" />;
        if (t.includes('revista')) return <Monitor className="w-8 h-8 text-blue-500" />;
        if (t.includes('podcast')) return <Podcast className="w-8 h-8 text-rose-500" />;
        if (t.includes('obra de arte')) return <Palette className="w-8 h-8 text-pink-500" />;
        return <HelpCircle className="w-8 h-8 text-slate-400" />;
    };

    const categories: { id: TicoCategory, label: string, color: string, icon: React.ReactNode }[] = [
        { id: 'VisualArts', label: 'Artes Visuales', color: 'bg-pink-500', icon: <Palette className="w-4 h-4" /> },
        { id: 'Entertainment', label: 'Espectáculo', color: 'bg-rose-500', icon: <Music className="w-4 h-4" /> },
        { id: 'Letters', label: 'Letras', color: 'bg-blue-500', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'Analysis', label: 'Análisis', color: 'bg-emerald-500', icon: <Newspaper className="w-4 h-4" /> },
    ];

    return (
        <div className="w-full flex flex-col gap-2 md:gap-4 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar pr-2">
            {/* ULTRA-COMPACT HERO SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-[2rem] p-5 text-white shadow-lg shrink-0">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-[1rem] shrink-0 shadow-inner">
                            <GraduationCap className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 italic">
                                <span>Récord</span>
                                <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none flex items-baseline gap-2">
                                {ticoState.total_resources_ingested}
                                <span className="text-lg opacity-60 italic font-medium">Saberes</span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex-1 md:border-l border-white/20 md:pl-6">
                        <p className="text-sm md:text-base text-white font-bold leading-tight drop-shadow-sm italic">
                            "¡Estamos aprendiendo muchísimo juntos! Cada recurso nos hace más grandes."
                        </p>
                    </div>
                </div>
            </div>

            {/* WISDOM BARS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 shrink-0">
                {categories.map(cat => {
                    const xp = ticoState.experience[cat.id] || 0;
                    const level = Math.floor(xp / 100);
                    const progress = xp % 100;

                    return (
                        <Card key={cat.id} className="p-4 rounded-[1.5rem] border-2 border-slate-100 shadow-sm bg-white/80 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${cat.color} text-white`}>
                                        {cat.icon}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">{cat.label}</span>
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Lv. {level}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                    className={`h-full ${cat.color} transition-all duration-1000 ease-out shadow-inner`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 px-1">
                                <span className="text-[9px] font-bold text-slate-400">Progreso actual</span>
                                <span className="text-[9px] font-black text-slate-600">{progress}%</span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* STATS GRID */}
            <div className="flex-1 min-h-0">
                <div className="px-4 mb-3 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Nuestra Colección
                    </h3>
                </div>

                {hasStats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 pb-6">
                        {Object.entries(stats).map(([type, count], index) => (
                            <Card
                                key={type}
                                className="group bg-white/70 backdrop-blur-md p-4 rounded-[1.5rem] border-2 border-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-500 overflow-hidden relative"
                                style={{ animationDelay: `${index * 40}ms` }}
                            >
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="mb-2 p-2 bg-slate-50 rounded-xl group-hover:scale-110 transition-all duration-500 group-hover:bg-white">
                                        {getIcon(type)}
                                    </div>
                                    <span className="text-2xl font-black text-slate-800 leading-none mb-1 tracking-tight">{count}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-indigo-500 transition-colors">{type}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border-4 border-dashed border-white/60">
                        <BookOpen className="w-10 h-10 text-slate-300 mb-2 opacity-40 animate-pulse" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-tight">Ticoteca vacía</h3>
                    </div>
                )}
            </div>
        </div>
    );
};
