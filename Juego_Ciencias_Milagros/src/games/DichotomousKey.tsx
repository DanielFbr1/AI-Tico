import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SPECIES_DB, getSpeciesForDifficulty, type Species, type Difficulty } from '../data/species';
import { fetchWikiImage } from '../utils/wiki';

// ====== VERSION ======
const VERSION = "v4.3.0";

const ARASAAC_URL = (pictoId: number) => `https://static.arasaac.org/pictograms/${pictoId}/${pictoId}_500.png`;

import { QUESTION_DEFS } from '../data/questions';
const ALL_TRAITS = new Set(Object.keys(QUESTION_DEFS));

type Question = { key: string; text: string; pictoId: number; fallbackEmoji: string };

const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES'; utterance.rate = 0.85; utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }
};

const DIFFICULTY_CONFIG: { key: Difficulty; label: string; emoji: string; description: string; color: string; hoverColor: string; borderColor: string; bgLight: string; textColor: string }[] = [
    { key: "primaria", label: "100 especies de Milagros", emoji: "🌱", description: "Clave dicotómica visual 100% natural", color: "bg-emerald-500", hoverColor: "hover:bg-emerald-600", borderColor: "border-emerald-200", bgLight: "bg-emerald-50", textColor: "text-emerald-700" }
];

interface TreeNode { questionText: string; emoji: string; yesSpecies: Species[]; noSpecies: Species[]; yesChild?: TreeNode; noChild?: TreeNode; }

function buildDifficultyTree(species: Species[], usedTraits: Set<string>, maxDepth: number, difficulty: Difficulty): TreeNode | undefined {
    if (species.length <= 1 || maxDepth <= 0) return undefined;

    let bestKey = "", bestDiff = Infinity;
    let bestYes: Species[] = [], bestNo: Species[] = [];

    const keysInRemaining = new Set<string>();
    species.forEach(s => {
        Object.keys(s.traits).forEach(k => {
            if (s.traits[k] !== undefined && ALL_TRAITS.has(k) && !usedTraits.has(k)) keysInRemaining.add(k);
        });
    });

    keysInRemaining.forEach(k => {
        const yes = species.filter(sp => sp.traits[k] === true);
        const no = species.filter(sp => sp.traits[k] === false || sp.traits[k] === undefined);

        if (yes.length > 0 && no.length > 0) {
            const diff = Math.abs(yes.length - no.length);
            if (diff < bestDiff) {
                bestDiff = diff; bestKey = k; bestYes = yes; bestNo = no;
            }
        }
    });

    if (!bestKey) return undefined;

    const def = QUESTION_DEFS[bestKey];
    const nextUsed = new Set(usedTraits);
    nextUsed.add(bestKey);

    return {
        questionText: def.text[difficulty], emoji: def.fallbackEmoji,
        yesSpecies: bestYes, noSpecies: bestNo,
        yesChild: buildDifficultyTree(bestYes, nextUsed, maxDepth - 1, difficulty),
        noChild: buildDifficultyTree(bestNo, nextUsed, maxDepth - 1, difficulty),
    };
}

function SpeciesList({ species, variant }: { species: Species[]; variant: 'yes' | 'no' }) {
    const colors = variant === 'yes' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700';
    return (
        <div className="flex flex-wrap gap-1 py-1">
            {species.map(s => (
                <span key={s.id} className={`text-xs px-2 py-0.5 border rounded-full font-medium ${colors}`}>{s.name}</span>
            ))}
        </div>
    );
}

function TreeBranch({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
    const [expanded, setExpanded] = useState(depth < 3);

    return (
        <div className="relative">
            <button onClick={() => setExpanded(!expanded)} className="flex items-center min-w-max flex-nowrap gap-2 py-1.5 px-3 my-1 rounded-xl hover:bg-blue-50 transition-colors text-left shadow-sm border border-transparent hover:border-blue-100">
                <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${expanded ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{expanded ? '−' : '+'}</span>
                <span className="text-base flex-shrink-0">{node.emoji}</span>
                <span className="text-sm font-bold text-blue-800 flex-1 leading-tight">{node.questionText}</span>
                <span className="text-xs font-mono text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{node.yesSpecies.length} sí / {node.noSpecies.length} no</span>
            </button>

            {expanded && (
                <div className="ml-6 border-l-2 border-blue-100 pl-3">
                    <div className="flex items-start gap-1.5 my-1">
                        <span className="text-xs font-bold text-emerald-600 mt-1 flex-shrink-0">✅ SÍ →</span>
                        <div className="flex-1">{node.yesChild ? <TreeBranch node={node.yesChild} depth={depth + 1} /> : <SpeciesList species={node.yesSpecies} variant="yes" />}</div>
                    </div>
                    <div className="flex items-start gap-1.5 my-1">
                        <span className="text-xs font-bold text-red-500 mt-1 flex-shrink-0">❌ NO →</span>
                        <div className="flex-1">{node.noChild ? <TreeBranch node={node.noChild} depth={depth + 1} /> : <SpeciesList species={node.noSpecies} variant="no" />}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface LevelCardProps {
    title: string;
    emoji: string;
    speciesList: Species[]; // Added back as it's used internally
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
    speciesList,
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
    const [showTree, setShowTree] = useState(false);
    const tree = useMemo(() => buildDifficultyTree(speciesList, new Set(), 50, "primaria"), [speciesList]);

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
                    {tree && (
                        <button onClick={(e) => { e.stopPropagation(); setShowTree(!showTree); }} className="bg-white/20 hover:bg-white/30 px-3 py-2 md:px-5 md:py-3 rounded-xl backdrop-blur-sm transition-colors text-white font-bold flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 shrink-0">
                            <span className="text-lg">🌳</span>
                            <span className="hidden sm:inline text-sm md:text-base">{showTree ? 'Ocultar árbol' : 'Ver árbol dicotómico'}</span>
                        </button>
                    )}
                </div>

                {showTree && tree && (
                    <div className="mt-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-inner border-2 border-white/60 overflow-x-auto text-left min-w-[280px] cursor-default" onClick={(e) => e.stopPropagation()}>
                        <TreeBranch node={tree} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ===========================================================================
// ========================== MAIN COMPONENT =================================
// ===========================================================================
export type CustomLevel = { id: string; label: string; species: Species[] };

export default function DichotomousKey() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [customLevels, setCustomLevels] = useState<CustomLevel[]>([]);

    // Default config species list
    const defaultSpecies = useMemo(() => getSpeciesForDifficulty("primaria"), []);

    const [candidates, setCandidates] = useState<Species[]>([]);
    const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
    const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const prevQuestionRef = useRef<string | null>(null);

    // Feedback al final del juego
    const [feedbackState, setFeedbackState] = useState<'asking' | 'correct' | 'wrong' | null>(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    // Edición de título de botones custom
    const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    // Load custom levels from localStorage on mount and listen for new ones
    useEffect(() => {
        const loadTrees = () => {
            const saved = localStorage.getItem('tico_custom_trees');
            if (saved) {
                try { setCustomLevels(JSON.parse(saved)); } catch (e) { console.error('Error loading custom trees', e); }
            }
        };

        loadTrees();

        window.addEventListener('tico_tree_added', loadTrees);
        return () => window.removeEventListener('tico_tree_added', loadTrees);
    }, []);

    // Save custom levels to localStorage whenever they change
    const updateCustomLevels = useCallback((newLevels: CustomLevel[] | ((prev: CustomLevel[]) => CustomLevel[])) => {
        setCustomLevels(prev => {
            const updated = typeof newLevels === 'function' ? newLevels(prev) : newLevels;
            localStorage.setItem('tico_custom_trees', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const startGame = useCallback((diffKey: Difficulty | null, customLvl: CustomLevel | null = null) => {
        if (customLvl) {
            setDifficulty("primaria"); // fallback key for logic
            setCandidates(customLvl.species);
        } else {
            setDifficulty(diffKey);
            setCandidates(getSpeciesForDifficulty(diffKey as Difficulty));
        }
        setHistory([]);
        setSkippedQuestions(new Set());
        setImageUrl(null);
        setLoadingImage(false);
        prevQuestionRef.current = null;
    }, []);

    const nextQuestion = useMemo<Question | null>(() => {
        if (candidates.length <= 1 || !difficulty) return null;
        const keysInRemaining = new Set<string>();
        candidates.forEach(s => {
            Object.keys(s.traits).forEach(k => {
                if (s.traits[k] !== undefined && ALL_TRAITS.has(k) && !skippedQuestions.has(k)) keysInRemaining.add(k);
            });
        });

        let bestQ: Question | null = null;
        let closestToHalf = Infinity;
        const target = candidates.length / 2;

        keysInRemaining.forEach(k => {
            const yesCount = candidates.filter(sp => sp.traits[k] === true).length;
            const noCount = candidates.filter(sp => sp.traits[k] === false || sp.traits[k] === undefined).length;

            if (yesCount > 0 && noCount > 0) {
                const diff = Math.abs(yesCount - target);
                if (diff < closestToHalf) {
                    closestToHalf = diff;
                    bestQ = { key: k, text: QUESTION_DEFS[k].text[difficulty], pictoId: QUESTION_DEFS[k].pictoId, fallbackEmoji: QUESTION_DEFS[k].fallbackEmoji };
                }
            }
        });
        return bestQ;
    }, [candidates, difficulty, skippedQuestions]);

    useEffect(() => {
        if (nextQuestion && nextQuestion.text !== prevQuestionRef.current) {
            prevQuestionRef.current = nextQuestion.text;
            speak(nextQuestion.text);
        }
    }, [nextQuestion]);

    useEffect(() => {
        if (candidates.length === 1 && !nextQuestion) {
            setLoadingImage(true);
            fetchWikiImage(candidates[0].wikiQuery).then(url => { setImageUrl(url); setLoadingImage(false); });
            speak(`¡Lo encontré! Es un ${candidates[0].name}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candidates.length, nextQuestion]);

    const handleYes = useCallback(() => {
        if (!nextQuestion) return;
        setHistory(h => [...h, { question: nextQuestion.text, answer: "sí" }]);
        setCandidates(prev => prev.filter(c => c.traits[nextQuestion.key] === true));
    }, [nextQuestion]);

    const handleNo = useCallback(() => {
        if (!nextQuestion) return;
        setHistory(h => [...h, { question: nextQuestion.text, answer: "no" }]);
        // If undefined, it implicitly means NO for specific leaf questions
        setCandidates(prev => prev.filter(c => c.traits[nextQuestion.key] === false || c.traits[nextQuestion.key] === undefined));
    }, [nextQuestion]);

    const handleEditSave = (id: string) => {
        if (editName.trim()) {
            updateCustomLevels(prev => prev.map(l => l.id === id ? { ...l, label: editName.trim() } : l));
        }
        setEditingLevelId(null);
    };


    const resetGame = useCallback(() => {
        setDifficulty(null); setCandidates([]); setHistory([]); setSkippedQuestions(new Set());
        setImageUrl(null); setLoadingImage(false); prevQuestionRef.current = null;
        setFeedbackState(null); setFeedbackText(""); setFeedbackSubmitted(false);
        window.speechSynthesis?.cancel();
    }, []);

    const winner = !nextQuestion && candidates.length === 1 ? candidates[0] : null;

    if (!difficulty) {
        return (
            <div className="relative max-w-5xl mx-auto flex flex-col items-center pb-10">
                <div className="flex flex-col gap-8 w-full mt-4 md:mt-10">
                    {DIFFICULTY_CONFIG.map((d) => (
                        <LevelCard
                            key={d.key}
                            title={d.label}
                            emoji={d.emoji}
                            speciesList={defaultSpecies}
                            colorClass={d.color}
                            onPlay={() => startGame(d.key)}
                        />
                    ))}

                    {customLevels.map((lvl) => (
                        <LevelCard
                            key={lvl.id}
                            title={lvl.label}
                            emoji="✨"
                            speciesList={lvl.species}
                            colorClass="bg-indigo-500"
                            gradientClass="bg-gradient-to-br from-indigo-500 to-purple-500"
                            isCustom={true}
                            onPlay={() => startGame(null, lvl)}
                            isEditing={editingLevelId === lvl.id}
                            editName={editName}
                            onEditChange={setEditName}
                            onEditSave={() => handleEditSave(lvl.id)}
                            onEditStart={() => { setEditingLevelId(lvl.id); setEditName(lvl.label); }}
                            onDelete={() => updateCustomLevels(prev => prev.filter(l => l.id !== lvl.id))}
                        />
                    ))}
                </div>


                <p className="mt-6 text-gray-400 text-xs">{VERSION}</p>
            </div>
        );
    }

    return (
        <div className="relative max-w-4xl mx-auto flex flex-col items-center pb-12 w-full">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white mb-8 w-full text-center z-10">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={resetGame} className="text-sm text-slate-500 hover:text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors flex items-center gap-2"><span>←</span> Cambiar nivel</button>
                    <span className="text-sm font-bold px-4 py-2 rounded-full bg-slate-200/50 text-slate-600 border border-slate-300 shadow-sm">
                        {DIFFICULTY_CONFIG.find(d => d.key === difficulty)?.emoji} {DIFFICULTY_CONFIG.find(d => d.key === difficulty)?.label}
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 mb-2 drop-shadow-sm" style={{ fontFamily: "'Patrick Hand', cursive" }}>🌿 Piensa en un ser vivo...</h2>
                {candidates.length > 1 && nextQuestion && <div className="mt-4 text-sm font-bold bg-blue-100/80 text-blue-800 py-1.5 px-4 rounded-full inline-block uppercase tracking-widest border border-blue-200 shadow-sm animate-pulse-slow">Investigando {candidates.length} especies</div>}
            </div>

            <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 w-full flex flex-col items-center min-h-[480px] z-10 relative overflow-hidden">
                {/* Subtle background glow inside the game board */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-blue-50/50 to-emerald-50/50 -z-10 rounded-[2.5rem]"></div>
                {winner ? (
                    <div className="text-center flex flex-col items-center w-full animate-in fade-in zoom-in duration-500">
                        <h3 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600 mb-6 filter drop-shadow-md" style={{ fontFamily: "'Patrick Hand', cursive" }}>¡Es {winner.category === 'Planta' ? 'una' : 'un'} {winner.name}! 🎉</h3>
                        <div className="w-56 h-56 md:w-72 md:h-72 bg-slate-100 rounded-full overflow-hidden shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] border-8 border-white flex items-center justify-center mb-6 relative">
                            {loadingImage ? <span className="text-slate-400 font-bold animate-pulse text-xl">Buscando foto...</span>
                                : imageUrl ? <img src={imageUrl} alt={winner.name} className="w-full h-full object-cover" />
                                    : <span className="text-slate-400 font-bold text-xl">Sin foto</span>}
                        </div>

                        {/* Feedback: preguntar si acertamos */}
                        {!feedbackState && (
                            <div className="flex flex-col items-center gap-4 mb-6 animate-in fade-in duration-300">
                                <p className="text-xl font-bold text-slate-700" style={{ fontFamily: "'Patrick Hand', cursive" }}>¿He acertado? 🤔</p>
                                <div className="flex gap-4">
                                    <button onClick={() => { setFeedbackState('correct'); speak('¡Bien! ¡He acertado!'); }} className="px-8 py-3 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-2xl shadow-[0_8px_15px_-5px_rgba(16,185,129,0.5)] border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all">✅ Sí</button>
                                    <button onClick={() => { setFeedbackState('wrong'); speak('¡Vaya! ¿Cuál era?'); }} className="px-8 py-3 bg-gradient-to-b from-red-400 to-red-600 hover:to-red-700 text-white rounded-2xl font-black text-2xl shadow-[0_8px_15px_-5px_rgba(239,68,68,0.5)] border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">❌ No</button>
                                </div>
                            </div>
                        )}

                        {/* Feedback: ¡Acertamos! */}
                        {feedbackState === 'correct' && (
                            <div className="flex flex-col items-center gap-4 mb-6 animate-in fade-in zoom-in duration-300">
                                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center shadow-sm">
                                    <p className="text-3xl font-black text-emerald-600 mb-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>🎊 ¡Genial! ¡He acertado!</p>
                                    <p className="text-lg text-emerald-700">¡Buen trabajo contestando las preguntas!</p>
                                </div>
                            </div>
                        )}

                        {/* Feedback: No acertamos → preguntar cuál era */}
                        {feedbackState === 'wrong' && !feedbackSubmitted && (
                            <div className="flex flex-col items-center gap-4 mb-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center shadow-sm w-full">
                                    <p className="text-2xl font-black text-amber-600 mb-4" style={{ fontFamily: "'Patrick Hand', cursive" }}>🤔 ¿Qué especie estabas buscando?</p>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={feedbackText}
                                        onChange={e => setFeedbackText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && feedbackText.trim()) setFeedbackSubmitted(true); }}
                                        placeholder="Escribe el nombre del animal o planta..."
                                        className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 bg-white text-lg font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                                    />
                                    <button
                                        onClick={() => { if (feedbackText.trim()) setFeedbackSubmitted(true); }}
                                        disabled={!feedbackText.trim()}
                                        className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-md active:scale-95 transition-all"
                                    >Enviar</button>
                                </div>
                            </div>
                        )}

                        {/* Feedback: Mostrar la RUTA COMPLETA correcta */}
                        {feedbackState === 'wrong' && feedbackSubmitted && (
                            <div className="flex flex-col items-center gap-4 mb-6 w-full max-w-lg animate-in fade-in zoom-in duration-500">
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm w-full">
                                    <p className="text-2xl font-black text-blue-600 mb-2 text-center" style={{ fontFamily: "'Patrick Hand', cursive" }}>📚 ¡Revisemos juntos!</p>
                                    <p className="text-lg text-blue-700 mb-1 text-center">Tú buscabas: <strong className="text-blue-900">{feedbackText}</strong></p>
                                    <p className="text-base text-slate-600 mb-4 text-center">Yo dije: <strong className="text-emerald-700">{winner.name}</strong></p>
                                    {(() => {
                                        const searched = SPECIES_DB.find(s => s.name.toLowerCase().includes(feedbackText.toLowerCase()));
                                        if (!searched) return <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">🔎 No encontré <strong>"{feedbackText}"</strong> en nuestra base de datos. ¡Revisa el nombre!</p>;

                                        // Build the FULL correct path for the searched species
                                        const correctPath: { key: string; question: string; correctAnswer: boolean }[] = [];
                                        const traitKeys = Object.keys(searched.traits).filter(k => searched.traits[k] !== undefined && QUESTION_DEFS[k]);
                                        traitKeys.forEach(k => {
                                            const def = QUESTION_DEFS[k];
                                            if (def) {
                                                correctPath.push({
                                                    key: k,
                                                    question: def.text[difficulty || 'primaria'],
                                                    correctAnswer: searched.traits[k] === true
                                                });
                                            }
                                        });

                                        // Map user answers by question key
                                        const userAnswersByKey: Record<string, string> = {};
                                        history.forEach(h => {
                                            const qKey = Object.keys(QUESTION_DEFS).find(k => {
                                                const d = QUESTION_DEFS[k];
                                                return d.text.primaria === h.question || d.text.eso === h.question || d.text.bachillerato === h.question;
                                            });
                                            if (qKey) userAnswersByKey[qKey] = h.answer;
                                        });

                                        let foundFirstError = false;

                                        return (
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-blue-700 mb-3">🗺️ Ruta correcta para llegar a <strong>{searched.name}</strong>:</p>
                                                {correctPath.map((step, i) => {
                                                    const userAnswer = userAnswersByKey[step.key];
                                                    const correctStr = step.correctAnswer ? 'SÍ' : 'NO';
                                                    let status: 'correct' | 'wrong' | 'not_asked';
                                                    if (userAnswer !== undefined) {
                                                        const userBool = userAnswer === 'sí';
                                                        status = userBool === step.correctAnswer ? 'correct' : 'wrong';
                                                    } else {
                                                        status = 'not_asked';
                                                    }
                                                    const isFirstError = status === 'wrong' && !foundFirstError;
                                                    if (isFirstError) foundFirstError = true;

                                                    return (
                                                        <div key={i} className={`rounded-xl p-3 mb-2 text-sm border ${status === 'correct' ? 'bg-emerald-50 border-emerald-200' :
                                                            status === 'wrong' ? 'bg-red-50 border-red-300 ring-2 ring-red-200' :
                                                                'bg-slate-50 border-slate-200'
                                                            }`}>
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-lg flex-shrink-0 mt-0.5">{
                                                                    status === 'correct' ? '✅' :
                                                                        status === 'wrong' ? '❌' : '🔵'
                                                                }</span>
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-slate-800 mb-1">{step.question}</p>
                                                                    <p className={`font-bold ${status === 'wrong' ? 'text-emerald-600' : 'text-emerald-600'}`}>
                                                                        Respuesta correcta: <strong>{correctStr}</strong>
                                                                    </p>
                                                                    {userAnswer !== undefined && (
                                                                        <p className={`${status === 'wrong' ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                                                            Tú dijiste: <strong>{userAnswer.toUpperCase()}</strong>
                                                                            {isFirstError && <span className="ml-2 text-red-500 font-black">← ¡Aquí te equivocaste!</span>}
                                                                        </p>
                                                                    )}
                                                                    {status === 'not_asked' && (
                                                                        <p className="text-blue-500 italic">Esta pregunta no se hizo en la partida</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <button onClick={resetGame} className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-bold text-xl shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_35px_-5px_rgba(16,185,129,0.5)] active:scale-95 transition-all">🔄 ¡Jugar otra vez!</button>
                    </div>
                ) : (!nextQuestion && candidates.length > 1) ? (
                    <div className="text-center w-full">
                        <h3 className="text-3xl font-bold text-amber-500 mb-4" style={{ fontFamily: "'Patrick Hand', cursive" }}>🤔 ¡Me quede sin pistas! ¿Cuál es?</h3>
                        <p className="text-lg text-gray-600 mb-6">Ayúdame eligiendo de los {candidates.length} que quedan:</p>
                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                            {candidates.map(c => (
                                <button key={c.id} onClick={() => setCandidates([c])}
                                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 rounded-full text-amber-800 font-bold text-sm active:translate-y-1 transition-all"
                                >{c.name}</button>
                            ))}
                        </div>
                        <button onClick={resetGame} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl font-bold text-sm shadow active:translate-y-1 transition-all">🔄 Empezar de nuevo</button>
                    </div>
                ) : (!nextQuestion && candidates.length === 0) ? (
                    <div className="text-center">
                        <h3 className="text-4xl font-bold text-red-500 mb-4" style={{ fontFamily: "'Patrick Hand', cursive" }}>¡Imposible! 😵</h3>
                        <p className="text-xl text-gray-600 mb-8">Esa combinación de pistas no existe en las 100 especies de Milagros.</p>
                        <button onClick={resetGame} className="px-8 py-3 bg-red-400 hover:bg-red-500 text-white rounded-xl font-bold text-xl shadow-lg active:translate-y-1 transition-all">Jugar de nuevo</button>
                    </div>
                ) : nextQuestion ? (
                    <div className="flex flex-col items-center w-full mt-2 animate-in fade-in duration-300">
                        <div className="bg-white/80 rounded-[2rem] p-6 md:p-8 border border-blue-100 mb-12 w-full flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-[0_15px_40px_-15px_rgba(59,130,246,0.15)] relative">
                            {/* Speech bubble pointer */}
                            <div className="absolute -bottom-4 md:bottom-auto md:-right-4 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 w-8 h-8 bg-white/80 border-b border-r md:border-b-0 md:border-t md:border-r border-blue-100 rotate-45 z-0"></div>
                            <div className="w-36 h-36 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-[1.5rem] p-1 flex items-center justify-center flex-shrink-0 shadow-inner z-10">
                                <div className="w-full h-full bg-white rounded-[1.25rem] flex items-center justify-center relative">
                                    <img src={ARASAAC_URL(nextQuestion.pictoId)} alt="picto" className="w-[80%] h-[80%] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                    <span className="text-5xl hidden drop-shadow-sm leading-none">{nextQuestion.fallbackEmoji}</span>
                                </div>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 text-center md:text-left leading-tight md:leading-snug z-10" style={{ fontFamily: "'Patrick Hand', cursive" }}>{nextQuestion.text}</h3>
                            <button onClick={() => speak(nextQuestion.text)} className="md:ml-auto w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-full flex items-center justify-center text-3xl shadow-sm hover:shadow-md transition-all active:scale-95 z-10" title="Escuchar">🔊</button>
                        </div>
                        <div className="flex gap-6 flex-wrap justify-center w-full max-w-2xl px-4 mt-2">
                            <button onClick={handleYes} className="flex-1 min-w-[140px] px-8 py-5 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:to-emerald-700 text-white rounded-3xl font-black text-4xl tracking-wider shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] border-b-[6px] border-emerald-800 active:border-b-0 active:translate-y-[6px] transition-all grid place-items-center">SÍ</button>
                            <button onClick={handleNo} className="flex-1 min-w-[140px] px-8 py-5 bg-gradient-to-b from-red-400 to-red-600 hover:to-red-700 text-white rounded-3xl font-black text-4xl tracking-wider shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)] border-b-[6px] border-red-800 active:border-b-0 active:translate-y-[6px] transition-all grid place-items-center">NO</button>
                        </div>
                    </div>
                ) : null}
            </div>

            {history.length > 0 && (
                <div className="w-full mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-400 mb-3 text-xs tracking-widest uppercase">Historial deductivo:</h4>
                    <div className="flex flex-col gap-2">
                        {history.map((h, i) => (
                            <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${h.answer === "sí" ? 'bg-emerald-50/50' : h.answer === "no" ? 'bg-red-50/50' : 'bg-gray-50'}`}>
                                <span className={`font-black text-lg ${h.answer === "sí" ? 'text-emerald-500' : h.answer === "no" ? 'text-red-400' : 'text-gray-400'}`}>{h.answer === "sí" ? '✅' : h.answer === "no" ? '❌' : '❔'}</span>
                                <span className="text-sm font-medium text-gray-700 mt-1">{h.question}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="mt-4 text-gray-400 font-mono text-xs opacity-50">{VERSION}</p>
        </div>
    );
}
