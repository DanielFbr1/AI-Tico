import React, { useState } from 'react';
import { SPECIES_DB, type Species, type TrophicLevel } from '../data/species';
import { fetchWikiImage } from '../utils/wiki';
// Ordered Top to Bottom for the visual pyramid shape
const LEVELS: { id: TrophicLevel; label: string; placedClass: string; textColor: string; desc: string }[] = [
    { id: 'Consumidor Terciario', label: '4. C. Terciario', placedClass: 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-[0_5px_15px_-5px_rgba(139,92,246,0.5)] border-2 border-white/40', textColor: 'text-white', desc: 'Superdepredador' },
    { id: 'Consumidor Secundario', label: '3. C. Secundario', placedClass: 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_5px_15px_-5px_rgba(244,63,94,0.5)] border-2 border-white/40', textColor: 'text-white', desc: 'Carnívoro' },
    { id: 'Consumidor Primario', label: '2. C. Primario', placedClass: 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_5px_15px_-5px_rgba(245,158,11,0.5)] border-2 border-white/40', textColor: 'text-white', desc: 'Herbívoro (Come plantas)' },
    { id: 'Productor', label: '1. Productor', placedClass: 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_5px_15px_-5px_rgba(16,185,129,0.5)] border-2 border-white/40', textColor: 'text-white', desc: 'Fotosíntesis (Base)' },
    { id: 'Descomponedor', label: '5. Descomponedores', placedClass: 'bg-gradient-to-r from-slate-600 to-slate-700 shadow-[0_5px_15px_-5px_rgba(71,85,105,0.5)] border-2 border-white/40', textColor: 'text-white', desc: 'Recicla nutrientes' }
];

// Cadenas coherentes exactas de 5 niveles que pertenecen al mismo ecosistema
const CHAINS = [
    ['p22', 'i26', 'v10', 'v14', 'i15'], // Hierba -> Saltamontes -> Petirrojo -> Lechuza -> Lombriz
    ['p23', 'i13', 'v19', 'v22', 'i11'], // Trébol -> Caracol -> Erizo -> Zorro -> Mosca verde
    ['p12', 'i4', 'v9', 'v16', 'i16'],   // Rosal -> Mosquito -> Avión común -> Milano real -> Cochinilla
    ['p5', 'i22', 'i32', 'v15', 'i3'],   // Chopo -> Hormiga -> Mantis -> Cigüeña -> Mosca
    ['p1', 'v17', 'v4', 'v22', 'i29']    // Encina -> Ratón -> Urraca -> Zorro -> Escarabajo pelotero
];

function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

export type CustomEcosystem = { id: string; label: string; species: Species[]; emoji?: string; colorClass?: string };

interface LevelCardProps {
    title: string;
    emoji: string;
    colorClass: string;
    gradientClass?: string;
    isCustom?: boolean;
    onPlay: () => void;
    isEditing?: boolean;
    editName?: string;
    onEditChange?: (name: string) => void;
    onEditSave?: () => void;
    onEditStart?: () => void;
    onDelete?: () => void;
}

function LevelCard({
    title,
    emoji,
    colorClass,
    gradientClass,
    isCustom = false,
    onPlay,
    isEditing = false,
    editName = "",
    onEditChange = () => { },
    onEditSave = () => { },
    onEditStart = () => { },
    onDelete = () => { }
}: LevelCardProps) {
    return (
        <div className="w-full relative group animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`absolute inset-0 bg-gradient-to-r ${colorClass.replace('bg-', 'from-').replace('500', '400')} to-transparent opacity-0 group-hover:opacity-20 rounded-[2rem] transition-opacity duration-300 blur-xl`}></div>
            <div className={`${gradientClass || colorClass} text-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border-0 flex flex-col w-full relative z-10 transition-all`}>
                <div className="flex items-center gap-4 md:gap-6 w-full cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-transform" onClick={onPlay}>
                    <span className="text-5xl md:text-6xl drop-shadow-md">{emoji}</span>
                    <div className="text-left flex-1 flex flex-col min-w-0">
                        {isEditing ? (
                            <input
                                autoFocus
                                type="text"
                                value={editName}
                                onChange={e => onEditChange(e.target.value)}
                                onBlur={onEditSave}
                                onKeyDown={e => e.key === 'Enter' && onEditSave()}
                                onClick={(e) => e.stopPropagation()}
                                className="text-2xl md:text-3xl font-extrabold tracking-wide bg-white/20 border-b-2 border-white text-white focus:outline-none focus:bg-white/30 px-2 py-1 rounded w-full"
                                style={{ fontFamily: "'Patrick Hand', cursive" }}
                            />
                        ) : (
                            <div className="group/edit flex items-center gap-2 md:gap-3 flex-wrap">
                                <h3 className="text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow-sm truncate" style={{ fontFamily: "'Patrick Hand', cursive" }}>{title}</h3>
                                {isCustom && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); onEditStart(); }} className="opacity-0 group-hover/edit:opacity-100 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all shrink-0" title="Editar título">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover/edit:opacity-100 p-1.5 bg-red-400/80 hover:bg-red-500 rounded-lg transition-all shrink-0" title="Eliminar">🗑️</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="bg-white/20 hover:bg-white/30 px-5 py-3 rounded-xl backdrop-blur-sm transition-colors text-white font-bold flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline">Jugar</span>
                        <span className="text-2xl opacity-90">▶</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TrophicPyramid() {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [activeCustomLevel, setActiveCustomLevel] = useState<CustomEcosystem | null>(null);
    const [customLevels, setCustomLevels] = useState<CustomEcosystem[]>([]);

    // Edición de título de botones custom
    const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const updateCustomLevels = React.useCallback((newLevels: CustomEcosystem[]) => {
        setCustomLevels(newLevels);
        localStorage.setItem('tico_custom_pyramids', JSON.stringify(newLevels));
    }, []);

    React.useEffect(() => {
        const loadCustom = () => {
            const saved = localStorage.getItem('tico_custom_pyramids');
            if (saved) {
                try {
                    setCustomLevels(JSON.parse(saved));
                } catch (e) {
                    console.error("Error al cargar cadenas custom:", e);
                }
            }
        };

        loadCustom();
        window.addEventListener('tico_pyramid_added', loadCustom);
        return () => window.removeEventListener('tico_pyramid_added', loadCustom);
    }, []);

    const [levelSpecies, setLevelSpecies] = useState<Species[]>([]);
    const [images, setImages] = useState<Record<string, string>>({});
    const [placed, setPlaced] = useState<Record<string, Species>>({});
    const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [won, setWon] = useState(false);

    const startRound = (customLvl: CustomEcosystem | null = activeCustomLevel) => {
        setIsPlaying(true);
        setActiveCustomLevel(customLvl);
        setPlaced({});
        setSelectedSpecies(null);
        setErrorMsg(null);
        setWon(false);

        let selected: Species[] = [];
        if (customLvl) {
            selected = customLvl.species;
        } else {
            // Pick one coherent chain
            const randomChainIds = CHAINS[Math.floor(Math.random() * CHAINS.length)];
            selected = randomChainIds.map(id => SPECIES_DB.find(s => s.id === id)!);
        }

        selected.forEach(sp => {
            fetchWikiImage(sp.wikiQuery).then(url => {
                if (url) setImages(prev => ({ ...prev, [sp.id]: url }));
            });
        });

        setLevelSpecies(shuffleArray(selected));
    };

    const resetGame = () => {
        setIsPlaying(false);
        setActiveCustomLevel(null);
        setLevelSpecies([]);
        setImages({});
        setPlaced({});
        setWon(false);
    };

    // Helper para intentar colocar una especie en un nivel
    const tryPlaceSpecies = (sp: Species, levelId: TrophicLevel) => {
        if (sp.trophicLevel === levelId) {
            const newPlaced = { ...placed, [levelId]: sp };
            setPlaced(newPlaced);
            setSelectedSpecies(null);
            setErrorMsg(null);

            if (Object.keys(newPlaced).length === LEVELS.length) {
                setWon(true);
            }
        } else {
            setErrorMsg(`¡Ups! ${sp.name} no es un ${levelId}. Pista: ${LEVELS.find(l => l.id === sp.trophicLevel)?.desc}`);
            setSelectedSpecies(null);
        }
    };

    // --- Clic Events ---
    const handleSpeciesClick = (sp: Species) => {
        if (Object.values(placed).some(p => p.id === sp.id)) return;
        setSelectedSpecies(sp);
        setErrorMsg(null);
    };

    const handleSlotClick = (levelId: TrophicLevel) => {
        if (!selectedSpecies) return;
        tryPlaceSpecies(selectedSpecies, levelId);
    };

    // --- Drag & Drop Events ---
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        // También lo seleccionamos por si acaso
        const sp = levelSpecies.find(s => s.id === id);
        if (sp) setSelectedSpecies(sp);
    };

    const handleDrop = (e: React.DragEvent, levelId: TrophicLevel) => {
        e.preventDefault();
        const droppedId = e.dataTransfer.getData('text/plain');
        const sp = levelSpecies.find(s => s.id === droppedId);
        if (sp) {
            tryPlaceSpecies(sp, levelId);
        }
    };

    const handleEditSave = (id: string) => {
        updateCustomLevels(
            customLevels.map(lvl => lvl.id === id ? { ...lvl, label: editName || lvl.label } : lvl)
        );
        setEditingLevelId(null);
    };

    const addMockCustomPyramid = () => {
        const mockSpeciesInfo = CHAINS[0].map(id => SPECIES_DB.find(s => s.id === id)!);
        const newLevel: CustomEcosystem = {
            id: Date.now().toString(),
            label: "Mi Ecosistema (AI Test)",
            species: mockSpeciesInfo,
            emoji: "🧪",
            colorClass: "bg-orange-500"
        };
        updateCustomLevels([...customLevels, newLevel]);
    };

    if (!isPlaying) {
        return (
            <div className="relative max-w-5xl mx-auto flex flex-col items-center pb-10">
                <div className="flex flex-col gap-6 w-full mt-4 md:mt-0">
                    <LevelCard
                        title="Ecosistema General (Aleatorio)"
                        emoji="🌍"
                        colorClass="bg-emerald-500"
                        onPlay={() => startRound(null)}
                    />

                    {customLevels.map((lvl) => (
                        <LevelCard
                            key={lvl.id}
                            title={lvl.label}
                            emoji="✨"
                            colorClass="bg-indigo-500"
                            gradientClass="bg-gradient-to-br from-indigo-500 to-purple-500"
                            isCustom={true}
                            onPlay={() => startRound(lvl)}
                            isEditing={editingLevelId === lvl.id}
                            editName={editName}
                            onEditChange={setEditName}
                            onEditSave={() => handleEditSave(lvl.id)}
                            onEditStart={() => { setEditingLevelId(lvl.id); setEditName(lvl.label); }}
                            onDelete={() => setCustomLevels(prev => prev.filter(l => l.id !== lvl.id))}
                        />
                    ))}
                </div>

                <div className="mt-8">
                    <button onClick={addMockCustomPyramid} className="text-purple-600 bg-purple-100 hover:bg-purple-200 px-6 py-2.5 rounded-full font-bold transition-colors shadow-sm text-sm flex items-center gap-2 border border-purple-200 hover:border-purple-300">
                        <span>🪄</span> Simular ecosistema generado por IA (Test)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-5xl mx-auto pb-0">
            <div className="w-full flex justify-between items-center mb-4">
                <button onClick={resetGame} className="text-sm text-slate-500 hover:text-slate-800 font-bold bg-white/80 hover:bg-white px-4 py-2 rounded-full transition-colors flex items-center gap-2 shadow-sm border border-slate-200"><span>←</span> Cambiar ecosistema</button>
                <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-bold shadow-sm border border-emerald-200">
                    {activeCustomLevel ? activeCustomLevel.label : "Ecosistema General"}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 w-full mt-0">
                {/* Available species bank */}
                <div className="w-full lg:w-1/3 bg-white p-3 lg:p-4 rounded-3xl shadow-lg border-2 border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-700 text-base lg:text-md mb-2 text-center">Seres Vivos a colocar:</h3>

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        {levelSpecies.map(sp => {
                            const isPlaced = Object.values(placed).some(p => p.id === sp.id);
                            const isSelected = selectedSpecies?.id === sp.id;

                            if (isPlaced) return null;

                            return (
                                <div
                                    key={sp.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, sp.id)}
                                    onClick={() => handleSpeciesClick(sp)}
                                    className={`flex items-center p-2 lg:p-3 rounded-2xl border-2 text-left transition-all cursor-grab active:cursor-grabbing ${isSelected ? 'border-orange-500 bg-orange-50 scale-105 shadow-md' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}`}
                                >
                                    {images[sp.id] ? (
                                        <img draggable={false} src={images[sp.id]} alt={sp.name} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover mr-2 lg:mr-3 bg-gray-100 pointer-events-none" />
                                    ) : (
                                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-100 flex items-center justify-center mr-2 lg:mr-3 text-lg pointer-events-none">⏳</div>
                                    )}
                                    <div className="pointer-events-none">
                                        <p className="font-bold text-gray-800 text-sm lg:text-base pointer-events-none">{sp.name}</p>
                                        <p className="text-[10px] lg:text-xs text-gray-500 pointer-events-none">{sp.category}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {errorMsg && (
                        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 animate-bounce">
                            {errorMsg}
                        </div>
                    )}

                    {won && (
                        <div className="mt-8 p-8 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-3xl text-center shadow-[0_10px_30px_-5px_rgba(16,185,129,0.5)] animate-in fade-in zoom-in slide-in-from-bottom-6 duration-500 border border-emerald-300 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50 pointer-events-none mix-blend-overlay"></div>
                            <h3 className="text-5xl font-black mb-3 drop-shadow-sm relative z-10" style={{ fontFamily: "'Patrick Hand', cursive" }}>¡Perfecto! 🎉</h3>
                            <p className="mb-6 font-medium text-lg text-emerald-50 relative z-10">Has completado la pirámide trófica. ¡Increíble!</p>
                            <button onClick={() => startRound()} className="px-8 py-3 bg-white text-emerald-600 font-bold text-lg rounded-full hover:bg-emerald-50 hover:shadow-lg active:scale-95 transition-all shadow-md relative z-10">
                                ¡Jugar otra vez!
                            </button>
                        </div>
                    )}
                </div>

                {/* Pyramid slots */}
                <div className="flex-1 flex flex-col items-center gap-1.5 w-full mt-6 md:mt-0">
                    {LEVELS.map((lvl, index) => {
                        const widthPct = 50 + (index * 12); // Triangle shape: top is narrower, bottom is wide
                        const isPlaced = placed[lvl.id];

                        return (
                            <React.Fragment key={lvl.id}>
                                <div
                                    onClick={() => handleSlotClick(lvl.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, lvl.id)}
                                    className={`relative flex items-center justify-center p-1.5 md:p-2 min-h-[60px] md:min-h-[75px] w-full transition-all duration-300 group
                                      ${isPlaced ? lvl.placedClass : 'bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-white/80 cursor-pointer hover:shadow-lg'}
                                      ${selectedSpecies && !isPlaced ? 'animate-pulse ring-4 ring-orange-500/60 ring-offset-2 bg-orange-50/50 outline outline-4 outline-orange-400/30' : ''}
                                    `}
                                    style={{ width: `${widthPct}%`, borderRadius: index === 0 ? '2rem 2rem 0.5rem 0.5rem' : index === LEVELS.length - 1 ? '0.5rem 0.5rem 2rem 2rem' : '0.5rem' }} // Removed clipPath to allow shadow visibility
                                >
                                    {/* Workaround for clip-path on the top piece visually matching a pyramid, better to just use borders and widths nicely */}
                                    <div className="absolute inset-0 rounded-inherit border-inherit pointer-events-none" style={{ borderRadius: 'inherit' }}></div>
                                    {!isPlaced ? (
                                        <div className="text-center pointer-events-none z-10 transition-transform group-hover:scale-105">
                                            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-1 group-hover:text-orange-500 transition-colors">{lvl.label}</p>
                                            <p className="text-sm text-slate-500 font-medium group-hover:text-slate-700">{lvl.desc}</p>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center justify-center gap-3 md:gap-5 ${lvl.textColor} w-full pointer-events-none z-10 animate-in zoom-in duration-300`}>
                                            {images[isPlaced.id] ? (
                                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 ${lvl.textColor === 'text-white' ? 'border-white/40' : 'border-white/80'} shadow-md bg-white/20 shrink-0`}>
                                                    <img src={images[isPlaced.id]} alt={isPlaced.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 border-2 ${lvl.textColor === 'text-white' ? 'border-white/40' : 'border-white/80'} shadow-md flex items-center justify-center text-xl shrink-0`}>🧩</div>
                                            )}
                                            <div className="text-left filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                                                <p className={`text-[10px] md:text-xs uppercase tracking-wider font-bold ${lvl.textColor === 'text-white' ? 'text-white/90' : 'text-slate-600'} mb-0.5`}>{lvl.label}</p>
                                                <p className="text-lg md:text-xl font-black tracking-wide" style={{ fontFamily: "'Patrick Hand', cursive" }}>{isPlaced.name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Up Arrow to signify energy flow from bottom to top, except below the last item */}
                                {index < LEVELS.length - 1 && (
                                    <div className="text-lg text-emerald-500/80 font-black animate-bounce z-10 -my-2 md:-my-3 filter drop-shadow-sm rotate-0 pointer-events-none">
                                        ⬆️
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
