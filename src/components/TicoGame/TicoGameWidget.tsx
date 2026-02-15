import React, { useState, useEffect } from 'react';
import { useTicoGame } from '../../hooks/useTicoGame';
import { TicoAvatar } from '../tico/TicoAvatar';
import { IngestionModule } from '../tico/IngestionModule';
import { Wardrobe } from '../tico/Wardrobe';
import { BrainChart } from '../tico/BrainChart';
import { StickerAlbum } from '../tico/StickerAlbum';
import { RefreshCw, Utensils, Shirt, Cookie, Sparkles, X, ChevronLeft, StickyNote, Image as ImageIcon } from 'lucide-react';
import { generateTicoResponse } from '../../services/ticoLogic';
import { generateAndSaveSticker, Sticker } from '../../services/stickerService';
import { TicoBackground } from './TicoBackground';
import { ticoAudio } from '../../lib/audio/TicoAudioEngine';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function TicoGameWidget({ projectId, onBack }: { projectId?: string | number, onBack?: () => void }) {
    const { state, updateState, equipOutfit, reset } = useTicoGame(String(projectId || 'default'));
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTicoBusy, setIsTicoBusy] = useState(false);
    const [activeResponse, setActiveResponse] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'none' | 'ingestion' | 'wardrobe' | 'brain' | 'album'>('none');
    const [hasNewSticker, setHasNewSticker] = useState(false);

    // Sticker Reveal State
    const [revealedSticker, setRevealedSticker] = useState<Sticker | null>(null);

    const handleAction = async () => {
        setIsGenerating(true);
        setActiveResponse(null);

        // Visual Confetti Explosion for Magic Action
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500', '#8A2BE2']
        });

        try {
            const topics = [
                "animales", "espacio", "inventos", "el cuerpo humano",
                "dinosaurios", "el océano", "historia del mundo", "arte",
                "música", "plantas", "clima", "comida", "deportes"
            ];
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];

            // Avoid repetition by telling the IA what was already said
            const excludeContext = state.shown_facts && state.shown_facts.length > 0
                ? `NO repitas NADA de esto (o cosas muy similares): ${state.shown_facts.slice(-10).join(' | ')}`
                : '';

            const response = await generateTicoResponse(
                state.current_outfit_id,
                `¡Hola Tico! Dime un dato curioso súper breve (máximo 2 frases cortas) sobre **${randomTopic}** para niños de 6 a 12 años. ${excludeContext}. ¡Dilo de forma rápida y divertida!`
            );
            setActiveResponse(response);

            // Save this fact to history to avoid repetition in the future
            updateState({
                ...state,
                shown_facts: [...(state.shown_facts || []), response]
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    // Hoisted Feed Logic (to allow auto-close)
    const handleFeed = async (fullInput: string) => {
        // 1. Close Tab & Start Animation IMMEDIATELY
        setActiveTab('none');
        setIsTicoBusy(true);
        setActiveResponse(null); // Clear previous response

        try {
            // 2. Process in Background
            const { classifyContent, updateTicoProgress, TICO_OUTFITS, generateStickerContext } = await import('../../services/ticoLogic');
            const result = await classifyContent(fullInput);

            // 3. Start Sticker Generation & Minimum Animation Delay

            // Wait for both the AI and at least 3 seconds of pecking animation (giving it more time)
            const minAnimationDelay = new Promise(resolve => setTimeout(resolve, 3000));

            // Translate and Enrich Context (Spanish -> English Visuals)
            const contextPromise = generateStickerContext(result.title);

            const [contextRes, _] = await Promise.all([contextPromise, minAnimationDelay]);

            // Extract the user-friendly resource type (e.g. "Libro", "Película") from the prefix
            const typeMatch = result.title.match(/\[Tipo: (.*?)\]/);
            const displayType = typeMatch ? typeMatch[1] : 'Dato';

            // Now generate sticker with enhanced context
            const res = await generateAndSaveSticker(
                result.title,               // Original title (prefix will be cleaned inside service)
                displayType,                // "Libro", "Película", etc. (instead of result.category)
                String(projectId || 'default'),
                contextRes.englishContext   // Enriched English context
            );

            // 4. Update State
            const { newState, newUnlocks } = updateTicoProgress(state, result);
            updateState(newState);

            if (res.success && res.sticker) {
                setHasNewSticker(true);
                ticoAudio.playStickerSFX(); // Trigger Sticker SFX

                // REVEAL ANIMATION START
                setRevealedSticker(res.sticker);

                // Auto-Close Reveal after 3.5 seconds
                setTimeout(() => {
                    setRevealedSticker(null);
                }, 3500);

            } else {
                toast.error("❌ No se pudo crear la pegatina", {
                    description: res.error || "Error desconocido"
                });
            }

            // 5. Show Result via Tico's Speech (Main Screen)
            const categoryName = result.category === 'VisualArts' ? 'Artes Visuales' :
                result.category === 'Entertainment' ? 'Espectáculo' :
                    result.category === 'Letters' ? 'Letras' :
                        result.category === 'Analysis' ? 'Análisis' : 'Conocimiento';

            const responseText = `¡${categoryName}! ${result.reasoning.split('.')[0]}.`; // Keep it short
            setActiveResponse(responseText);

            // 6. Unlocks? Confetti!
            if (newUnlocks.length > 0) {
                ticoAudio.playUnlockSFX(); // Trigger Unlock SFX
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FF69B4', '#00BFFF'],
                    disableForReducedMotion: true
                });
                // Append unlock msg
                const unlockedNames = newUnlocks.map(id => TICO_OUTFITS.find(o => o.id === id)?.name).join(', ');
                setTimeout(() => {
                    if (isTicoBusy) setActiveResponse(`¡Regalo desbloqueado! 🎁 ${unlockedNames}`);
                }, 4000);
            }

        } catch (error) {
            console.error("Feed Error:", error);
            setActiveResponse("¡Cuaack! Me he atragantado con esos datos...");
        } finally {
            setIsTicoBusy(false);
        }
    };

    return (
        <div className="w-full h-full relative overflow-hidden font-lexend text-slate-800">
            <TicoBackground />

            {/* STICKER REVEAL OVERLAY */}
            {revealedSticker && (
                <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-30 animate-pulse"></div>

                        <div className="bg-white p-4 rounded-[3rem] shadow-[0_0_60px_rgba(255,215,0,0.4)] animate-in zoom-in spin-in-[10deg] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-10 rotate-3">
                            <img
                                src={revealedSticker.sticker_url}
                                alt="New Sticker"
                                className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-xl"
                            />
                        </div>

                        {/* Sparkles */}
                        <Sparkles className="absolute -top-10 -right-10 w-16 h-16 text-yellow-300 animate-bounce-slow" />
                        <Sparkles className="absolute -bottom-5 -left-10 w-12 h-12 text-rose-300 animate-pulse" />
                    </div>

                    <h2 className="mt-12 text-5xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100">
                        ¡Nueva Pegatina!
                    </h2>
                    <p className="text-2xl text-blue-200 font-bold mt-4 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200">
                        {revealedSticker.resource_title}
                    </p>
                    <div className="mt-8 px-6 py-2 bg-white/10 rounded-full text-white/80 text-sm font-bold uppercase tracking-widest animate-pulse">
                        Guardandose en el álbum...
                    </div>
                </div>
            )}

            {/* VERSION TAG */}
            <div className="absolute bottom-4 left-6 text-[10px] font-black text-slate-400/50 uppercase tracking-widest z-10 pointer-events-none">
                Tico AI v2.9.6 - Voice Debugged 🎙️🛠️
            </div>

            <div className="flex flex-row w-full h-full z-10 relative">

                {/* LEFT AREA: TICO AVATAR */}
                <div className={`flex-1 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab !== 'none' ? 'scale-75 opacity-30 -translate-x-20 blur-[2px]' : 'scale-100'}`}>
                    <div className="relative hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => { ticoAudio.playCuriositySFX(); handleAction(); }}>
                        <TicoAvatar
                            ticoState={state}
                            isProcessing={isTicoBusy}
                            isActiveMode={isGenerating}
                        />

                        {/* Floating Response Bubble - RIGHT SIDE */}
                        {activeResponse && !revealedSticker && (
                            <div className="absolute left-[85%] top-1/2 -translate-y-1/2 w-max max-w-[400px] bg-white p-6 rounded-[2rem] rounded-tl-none shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border-4 border-white ring-4 ring-blue-50 text-left animate-in zoom-in slide-in-from-left-4 duration-300 z-50">
                                <p className="text-slate-700 font-bold text-xl italic leading-snug">
                                    "{activeResponse}"
                                </p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); ticoAudio.playClickSFX(); setActiveResponse(null); }}
                                    className="absolute -top-3 -right-3 bg-slate-900 text-white p-2 rounded-full hover:bg-rose-500 transition-all shadow-lg active:scale-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Bubble Triangle pointing Left */}
                                <div className="absolute top-[30px] -left-[20px] w-0 h-0 
                                    border-t-[10px] border-t-transparent 
                                    border-b-[10px] border-b-transparent 
                                    border-r-[20px] border-r-white 
                                    filter drop-shadow-sm">
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 relative group">
                        {/* Dynamic Background Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative flex items-center bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2rem] p-1 pr-8 shadow-2xl hover:scale-105 transition-all duration-500 cursor-default overflow-hidden">
                            {/* Level Circle */}
                            <div className="relative flex items-center justify-center w-20 h-20">
                                <svg className="w-full h-full -rotate-90">
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="34"
                                        className="stroke-slate-200 fill-none"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="34"
                                        className="stroke-blue-500 fill-none transition-all duration-1000"
                                        strokeWidth="6"
                                        strokeDasharray={`${(state.total_resources_ingested % 2 === 0 ? 100 : 50) * 2.13} 213`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none mt-1">
                                    <span className="text-8px font-black text-slate-400 uppercase tracking-tighter">NIVEL</span>
                                    <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                        {state.total_resources_ingested}
                                    </span>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="ml-4 flex flex-col">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-slate-500/80 uppercase tracking-[0.2em]">Progreso Tico</span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-1 h-1 rounded-full ${i <= (state.total_resources_ingested % 3 + 1) ? 'bg-blue-400' : 'bg-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm border
                                        ${state.current_outfit_id
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-white/20'
                                            : 'bg-white text-blue-600 border-blue-50'}`}
                                    >
                                        {state.current_outfit_id ? 'Modo Experto' : 'Tico Original'}
                                    </span>
                                    {state.total_resources_ingested > 10 && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 shadow-sm animate-bounce-slow">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ambient Shine */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-40 group-hover:animate-shine" />
                        </div>
                    </div>
                </div>

                {/* CENTER OVERLAY: CONTENT PANEL */}
                {activeTab !== 'none' && !revealedSticker && (
                    <div className="absolute inset-y-0 left-0 right-[420px] flex items-center justify-center p-6 md:p-12 z-40 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-2xl w-full max-w-5xl h-full max-h-[85vh] rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border-[8px] border-white p-8 md:p-12 flex flex-col pointer-events-auto animate-in fade-in zoom-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                            <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-slate-100/50">
                                <h3 className="text-4xl font-black text-slate-800 uppercase flex items-center gap-5 tracking-tight">
                                    {activeTab === 'ingestion' && <><Utensils className="text-rose-500 w-12 h-12 animate-bounce-slow" /> Alimentar</>}
                                    {activeTab === 'wardrobe' && <><Shirt className="text-blue-600 w-12 h-12 animate-bounce-slow" /> Armario</>}
                                    {activeTab === 'brain' && <><Cookie className="text-emerald-500 w-12 h-12 animate-bounce-slow" /> Ticoteca</>}
                                    {activeTab === 'album' && <><StickyNote className="text-yellow-500 w-12 h-12 animate-bounce-slow" /> Álbum</>}
                                </h3>
                                <button
                                    onClick={() => { ticoAudio.playClickSFX(); setActiveTab('none'); }}
                                    className="p-4 bg-slate-100 rounded-[2rem] hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-90 hover:rotate-90"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                {activeTab === 'ingestion' && (
                                    <IngestionModule
                                        onFeed={handleFeed}
                                    />
                                )}
                                {activeTab === 'wardrobe' && (
                                    <Wardrobe
                                        ticoState={state}
                                        onEquipOutfit={(id) => {
                                            equipOutfit(id);
                                            setActiveTab('none'); // Auto-close on equip
                                        }}
                                    />
                                )}
                                {activeTab === 'brain' && <BrainChart ticoState={state} />}
                                {activeTab === 'album' && <StickerAlbum groupId={String(projectId || 'default')} isActive={activeTab === 'album'} />}
                            </div>
                        </div>
                    </div>
                )}

                {/* RIGHT SIDEBAR: COMPACT & FIXED */}
                <div className="w-[320px] md:w-[360px] h-full bg-white/80 backdrop-blur-xl border-l-[4px] border-white flex flex-col z-50 shadow-[-10px_0_40px_rgba(0,0,0,0.05)]">

                    {/* HEADER ACTIONS */}
                    <div className="p-5 pb-2 shrink-0">
                        {onBack && (
                            <button
                                onClick={() => { ticoAudio.playClickSFX(); onBack && onBack(); }}
                                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-slate-800 text-white font-bold uppercase text-sm tracking-widest hover:bg-rose-500 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 group"
                            >
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Volver a Clase
                            </button>
                        )}
                    </div>

                    {/* MENU LIST & ACTIONS (Unified) */}
                    <div className="flex-1 overflow-y-auto p-6 py-4 space-y-5 custom-scrollbar">
                        <BigMenuButton
                            icon={<Utensils className="w-8 h-8" />}
                            label="Alimentar"
                            description="Dar datos y comida a Tico"
                            active={activeTab === 'ingestion'}
                            onClick={() => { ticoAudio.playClickSFX(); setActiveTab(activeTab === 'ingestion' ? 'none' : 'ingestion'); }}
                            color="rose"
                        />
                        <BigMenuButton
                            icon={<Shirt className="w-8 h-8" />}
                            label="Armario"
                            description="Personalizar su apariencia"
                            active={activeTab === 'wardrobe'}
                            onClick={() => { ticoAudio.playClickSFX(); setActiveTab(activeTab === 'wardrobe' ? 'none' : 'wardrobe'); }}
                            color="blue"
                        />
                        <BigMenuButton
                            icon={<Cookie className="w-8 h-8" />}
                            label="Ticoteca"
                            description="Registro de datos picoteados"
                            active={activeTab === 'brain'}
                            onClick={() => { ticoAudio.playClickSFX(); setActiveTab(activeTab === 'brain' ? 'none' : 'brain'); }}
                            color="emerald"
                        />
                        <BigMenuButton
                            icon={<StickyNote className="w-8 h-8" />}
                            label="Álbum"
                            description="Colección de pegatinas"
                            active={activeTab === 'album'}
                            onClick={() => {
                                ticoAudio.playClickSFX();
                                setActiveTab(activeTab === 'album' ? 'none' : 'album');
                                if (activeTab !== 'album') setHasNewSticker(false);
                            }}
                            color="yellow"
                            notification={hasNewSticker}
                        />

                        <div className="h-px bg-slate-200 w-full my-4 opacity-50" />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface BigMenuButtonProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    active: boolean;
    onClick: () => void;
    color: 'rose' | 'blue' | 'emerald' | 'yellow';
    notification?: boolean;
}

function BigMenuButton({ icon, label, description, active, onClick, color, notification }: BigMenuButtonProps) {
    const colorStyles = {
        rose: 'bg-rose-200 text-rose-800 border-rose-300 hover:bg-rose-500 hover:text-white',
        blue: 'bg-blue-300 text-blue-900 border-blue-400 hover:bg-blue-600 hover:text-white',
        emerald: 'bg-emerald-300 text-emerald-900 border-emerald-400 hover:bg-emerald-600 hover:text-white',
        yellow: 'bg-yellow-200 text-yellow-800 border-yellow-300 hover:bg-yellow-500 hover:text-white',
    };

    const iconColors = {
        rose: 'text-rose-600',
        blue: 'text-indigo-600',
        emerald: 'text-lime-700',
        yellow: 'text-yellow-600',
    };

    const activeStyles = active ?
        'ring-8 ring-offset-0 ring-white scale-[1.02] shadow-xl z-10 border-transparent translate-x-1' :
        'hover:shadow-lg hover:-translate-y-1 opacity-95 hover:opacity-100';

    return (
        <button
            onClick={onClick}
            className={`w-full group flex items-center gap-6 p-6 rounded-[2.5rem] transition-all duration-300 active:scale-95 text-left border-2 ${colorStyles[color]} ${activeStyles}`}
        >
            <div className={`p-4 rounded-[1.5rem] bg-white shadow-sm transition-all duration-500 group-hover:rotate-12 ${iconColors[color]} relative`}>
                {icon}
                {notification && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
                    </span>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-black uppercase leading-none tracking-tight">{label}</span>
                <span className="text-xs font-bold opacity-70 uppercase tracking-wide mt-1.5">{description}</span>
            </div>
        </button>
    );
}
