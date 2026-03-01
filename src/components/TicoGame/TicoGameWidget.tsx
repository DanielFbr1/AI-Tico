import React, { useState, useEffect } from 'react';
import { useTicoGame } from '../../hooks/useTicoGame';
import { TicoAvatar } from '../tico/TicoAvatar';
import { IngestionModule } from '../tico/IngestionModule';
import { Wardrobe } from '../tico/Wardrobe';
import { BrainChart } from '../tico/BrainChart';
import { StickerAlbum } from '../tico/StickerAlbum';
import { RefreshCw, Utensils, Shirt, BarChart3, Sparkles, X, ChevronLeft, StickyNote, Image as ImageIcon } from 'lucide-react';
import { generateTicoResponse } from '../../services/ticoLogic';
import { generateAndSaveSticker, Sticker } from '../../services/stickerService';
import { TicoBackground } from './TicoBackground';
import { ticoAudio } from '../../lib/audio/TicoAudioEngine';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function TicoGameWidget({ projectId, organizacionId, onBack }: { projectId?: string | number, organizacionId?: string, onBack?: () => void }) {
    // Si hay organizacionId, usamos contexto 'class', si no, 'project' (para compatibilidad)
    const contextType = organizacionId ? 'class' : 'project';
    const contextId = organizacionId || String(projectId || 'default');

    const { state, updateState, equipOutfit, reset } = useTicoGame(contextId, contextType);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTicoBusy, setIsTicoBusy] = useState(false);
    const [activeResponse, setActiveResponse] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'none' | 'ingestion' | 'wardrobe' | 'brain' | 'album'>('none');
    const [hasNewSticker, setHasNewSticker] = useState(false);

    // Sticker Reveal State
    const [revealedSticker, setRevealedSticker] = useState<Sticker | null>(null);

    // Animation Talking State
    const [isTalking, setIsTalking] = useState(false);

    const handleAction = async () => {
        setIsGenerating(true);
        setIsTalking(false);
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

            // Set talking before finishing generation to avoid glitch
            setIsTalking(true);
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

            // Extract the user-friendly resource type (e.g. "Libro", "Película") from the prefix
            const typeMatch = fullInput.match(/\[Tipo: (.*?)\]/);
            const displayType = typeMatch ? typeMatch[1] : 'Dato';

            // Start Sticker Generation immediately without fixed delays
            const contextRes = await generateStickerContext(result.title, displayType);

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
            setIsTalking(true);
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
            <TicoBackground outfitId={state.current_outfit_id} />

            {/* STICKER REVEAL OVERLAY */}
            {revealedSticker && (
                <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-30 animate-pulse"></div>

                        <div className="bg-white p-4 rounded-[3rem] shadow-[0_0_60px_rgba(255,215,0,0.4)] animate-in zoom-in spin-in-[10deg] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative z-10 rotate-3 overflow-hidden">
                            <img
                                src={revealedSticker.sticker_url}
                                alt="New Sticker"
                                className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-xl rounded-2xl bg-white"
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
                Tico AI v3.2.8 - Label Fix ✨🎓
            </div>

            <div className="flex flex-col md:flex-row w-full h-full z-10 relative">

                {/* LEFT AREA: TICO AVATAR - Balanced for Mobile */}
                <div className={`flex-1 md:flex-1 flex flex-col items-center justify-center p-4 md:p-8 translate-y-20 md:translate-y-12 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab !== 'none' ? 'scale-50 md:scale-75 opacity-10 md:opacity-30 -translate-y-20 md:-translate-x-20 blur-[2px]' : 'scale-90 md:scale-110'}`}>
                    <div className="relative transition-transform duration-500 cursor-pointer scale-90 md:scale-[1.1]" onClick={() => { ticoAudio.playCuriositySFX(); handleAction(); }}>
                        <TicoAvatar
                            ticoState={state}
                            isProcessing={isTicoBusy}
                            isActiveMode={isGenerating || isTalking}
                            isResponding={isTalking}
                            onAnimationEnd={() => setTimeout(() => setIsTalking(false), 2000)}
                        />

                        {/* Floating Response Bubble - ABOVE TICO ON MOBILE (Lowered) */}
                        {activeResponse && !revealedSticker && (
                            <div className="absolute left-1/2 md:left-[85%] top-[-160px] md:top-1/2 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 w-[280px] md:w-max md:max-w-[320px] bg-white p-4 md:p-6 rounded-[2rem] md:rounded-tl-none shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] border-4 border-white ring-8 ring-blue-50/50 text-center md:text-left animate-in zoom-in slide-in-from-bottom-8 md:slide-in-from-left-4 duration-500 z-[100]">
                                <p className="text-slate-700 font-black text-sm md:text-lg italic leading-tight">
                                    "{activeResponse}"
                                </p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); ticoAudio.playClickSFX(); setActiveResponse(null); setIsTalking(false); }}
                                    className="absolute -top-3 -right-3 md:-top-5 md:-right-5 bg-slate-900 text-white p-2 md:p-3 rounded-full hover:bg-rose-500 transition-all shadow-lg active:scale-90"
                                >
                                    <X className="w-4 h-4 md:w-5 md:h-5" />
                                </button>

                                <div className="hidden md:block absolute top-[40px] -left-[20px] w-0 h-0 
                                    border-t-[10px] border-t-transparent 
                                    border-b-[10px] border-b-transparent 
                                    border-r-[20px] border-r-white 
                                    filter drop-shadow-sm">
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 md:mt-8 relative group">
                        {/* Dynamic Background Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                        <div className="relative flex items-center bg-white/70 backdrop-blur-2xl border-2 border-white rounded-[2rem] p-1.5 pr-6 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-500 cursor-default overflow-hidden group">
                            {/* Circular Level Rank */}
                            <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 shrink-0">
                                {/* Inner Shadow & Background */}
                                <div className="absolute inset-1 bg-slate-50 rounded-full shadow-inner"></div>

                                <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 64 64">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        className="stroke-slate-100 fill-none"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        className="stroke-blue-500 fill-none transition-all duration-1000"
                                        strokeWidth="6"
                                        strokeDasharray={`${((state.total_resources_ingested % 3) === 0 && state.total_resources_ingested > 0 ? 176 : ((state.total_resources_ingested % 3) * 176) / 3)} 176`}
                                        strokeLinecap="round"
                                    />
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                    <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Nivel</span>
                                    <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter drop-shadow-sm transition-transform group-hover:scale-110 duration-300">
                                        {state.total_resources_ingested}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-12 bg-slate-200 mx-3 md:mx-6 opacity-60" />

                            {/* Info Section */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-[0.2em] drop-shadow-sm">Progreso Tico</span>
                                    {/* Progress Pips */}
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3].map(i => {
                                            const isActive = i <= (state.total_resources_ingested % 3 + 1);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full transition-all duration-500 ${isActive
                                                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_2px_4px_rgba(59,130,246,0.3)] scale-110'
                                                        : 'bg-slate-200'
                                                        }`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm border-2 flex items-center gap-2 transition-all
                                        ${state.current_outfit_id
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/30'
                                            : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                                    >
                                        <Sparkles className={`w-3.5 h-3.5 ${state.current_outfit_id ? 'text-blue-200' : 'text-slate-400'}`} />
                                        {state.current_outfit_id ? 'Modo Experto Activado' : 'Sin Equipamiento'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* CENTER OVERLAY: CONTENT PANEL */}
                {activeTab !== 'none' && !revealedSticker && (
                    <div className="absolute inset-0 md:right-[320px] lg:right-[360px] flex items-center justify-center p-4 md:p-12 z-[60] pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-2xl w-full max-w-5xl h-full md:max-h-[85vh] rounded-3xl md:rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border-4 md:border-[8px] border-white p-4 md:p-12 flex flex-col pointer-events-auto animate-in fade-in zoom-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                            <div className="flex justify-between items-center mb-4 md:mb-8 pb-2 md:pb-4 border-b-2 border-slate-100/50">
                                <h3 className="text-xl md:text-4xl font-black text-slate-800 uppercase flex items-center gap-3 md:gap-5 tracking-tight">
                                    {activeTab === 'ingestion' && <><Utensils className="text-rose-500 w-6 h-6 md:w-12 md:h-12 animate-bounce-slow" /> Alimentar</>}
                                    {activeTab === 'wardrobe' && <><Shirt className="text-blue-600 w-6 h-6 md:w-12 md:h-12 animate-bounce-slow" /> Armario</>}
                                    {activeTab === 'brain' && <><BarChart3 className="text-emerald-500 w-6 h-6 md:w-12 md:h-12 animate-bounce-slow" /> Resumen</>}
                                    {activeTab === 'album' && <><StickyNote className="text-yellow-500 w-6 h-6 md:w-12 md:h-12 animate-bounce-slow" /> Álbum</>}
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

                {/* RIGHT/BOTTOM SIDEBAR: COMPACT & FIXED */}
                <div className="w-full md:w-[320px] lg:w-[360px] md:h-full backdrop-blur-3xl flex flex-col z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] bg-white/95 md:bg-transparent shrink-0 rounded-t-[3rem] md:rounded-none border-t-4 border-white md:border-none">

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

                    {/* MENU LIST & ACTIONS (Unified) - Grid on Mobile to prevent scroll */}
                    <div className="shrink-0 p-4 md:p-6 py-2 md:py-4 grid grid-cols-4 md:flex md:flex-col gap-2 md:gap-3 md:space-y-5">
                        <BigMenuButton
                            icon={<Utensils className="w-6 h-6 md:w-8 md:h-8" />}
                            label="Alimentar"
                            description="Dar datos y comida a Tico"
                            active={activeTab === 'ingestion'}
                            onClick={() => { ticoAudio.playClickSFX(); setActiveTab(activeTab === 'ingestion' ? 'none' : 'ingestion'); }}
                            color="rose"
                        />
                        <BigMenuButton
                            icon={<Shirt className="w-6 h-6 md:w-8 md:h-8" />}
                            label="Armario"
                            description="Personalizar su apariencia"
                            active={activeTab === 'wardrobe'}
                            onClick={() => { ticoAudio.playClickSFX(); setActiveTab(activeTab === 'wardrobe' ? 'none' : 'wardrobe'); }}
                            color="blue"
                        />
                        <BigMenuButton
                            icon={<BarChart3 className="w-6 h-6 md:w-8 md:h-8" />}
                            label="Resumen"
                            description="Registro de datos aprendidos"
                            active={activeTab === 'brain'}
                            onClick={() => { ticoAudio.playClickSFX(); setActiveTab(activeTab === 'brain' ? 'none' : 'brain'); }}
                            color="emerald"
                        />
                        <BigMenuButton
                            icon={<StickyNote className="w-6 h-6 md:w-8 md:h-8" />}
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

                        <div className="hidden md:block h-px bg-slate-200 w-full my-4 opacity-50" />
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
            className={`flex-none md:w-full group flex flex-col md:flex-row items-center gap-1.5 md:gap-6 p-2 md:p-6 rounded-xl md:rounded-[2.5rem] transition-all duration-300 active:scale-95 text-center md:text-left border-2 ${colorStyles[color]} ${activeStyles}`}
        >
            <div className={`p-2 md:p-4 rounded-lg md:rounded-[1.5rem] bg-white shadow-sm transition-all duration-500 md:group-hover:rotate-12 ${iconColors[color]} relative shrink-0`}>
                {icon}
                {notification && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-rose-500 border-2 border-white"></span>
                    </span>
                )}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] md:text-2xl font-black uppercase leading-tight tracking-tight truncate">{label}</span>
                <span className="hidden md:inline text-xs font-bold opacity-70 uppercase tracking-wide mt-1.5">{description}</span>
            </div>
        </button>
    );
}
