import { useState, useEffect, useRef } from 'react';
import { X, Trophy, Users, Shuffle, Loader2, Copy, Sparkles, Dices, Check } from 'lucide-react';
import { useListaAlumnos } from '../hooks/useListaAlumnos';
import { toast } from 'sonner';

interface RuletaModalProps {
    onClose: () => void;
    proyectoId?: string;
    codigoSala?: string;
}

export function RuletaModal({ onClose, proyectoId, codigoSala }: RuletaModalProps) {
    const { alumnos, loading } = useListaAlumnos(codigoSala);
    const [mode, setMode] = useState<'single' | 'groups' | 'dice'>('single');
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState<string | null>(null);

    const [numGroups, setNumGroups] = useState(2);
    const [generatedGroups, setGeneratedGroups] = useState<string[][]>([]);

    // Members management (Local list for editing during session)
    const [managedMembers, setManagedMembers] = useState<{ id: string; nombre: string }[]>([]);
    const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
    // UI state for adding a new member via inline input
    const [addInputTeam, setAddInputTeam] = useState<number | null>(null);
    const [addInputValue, setAddInputValue] = useState('');
    // Sync managed members when alumnos are loaded from hook
    useEffect(() => {
        if (alumnos.length > 0 && managedMembers.length === 0) {
            setManagedMembers(alumnos.map(a => ({ id: a.id, nombre: a.nombre })));
        }
    }, [alumnos]);

    // Dice state
    const [numDice, setNumDice] = useState(1);
    const [diceType, setDiceType] = useState<6 | 12>(6);
    const [diceValues, setDiceValues] = useState<number[]>([1, 1, 1, 1, 1, 1]);
    const [isRollingDice, setIsRollingDice] = useState(false);

    const D12Icon = ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Contorno exterior heptagonal/octagonal (vista aproximada de dodecaedro iso) */}
            <polygon points="12 2 19 6 21 14 16 21 8 21 3 14 5 6" />

            {/* Pentágono central (cara frontal principal) */}
            <polygon points="12 7 16 11 14 16 10 16 8 11" fill="currentColor" fillOpacity="0.1" />

            {/* Líneas que conectan el pentágono central con los vértices exteriores */}
            <line x1="12" y1="2" x2="12" y2="7" />
            <line x1="19" y1="6" x2="16" y2="11" />
            <line x1="16" y1="21" x2="14" y2="16" />
            <line x1="8" y1="21" x2="10" y2="16" />
            <line x1="5" y1="6" x2="8" y2="11" />

            {/* Texto centrado en la cara frontal */}
            <text x="12" y="12.5" fontSize="3.5" fontWeight="900" textAnchor="middle" fill="currentColor" stroke="none">12</text>
        </svg>
    );
    // Wheel constants - Vibrant dark colors for maximum text contrast
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#ca8a04', '#059669', '#4f46e5', '#dc2626', '#0891b2'];
    const wheelRef = useRef<HTMLDivElement>(null);
    const [mobileTab, setMobileTab] = useState<'wheel' | 'controls'>(mode === 'single' ? 'wheel' : 'controls');

    // Sync mobile tab when mode changes via desktop interface logic
    useEffect(() => {
        if (mode === 'single') setMobileTab('wheel');
        else if (mode === 'dice') setMobileTab('wheel');
        else if (generatedGroups.length === 0) setMobileTab('controls');
    }, [mode, generatedGroups.length]);

    // Mobile: combined view state
    const [mobileSubView, setMobileSubView] = useState<'wheel' | 'controls'>('wheel');

    const spinWheel = () => {
        if (managedMembers.length < 1) return;
        if (spinning) return;

        setSpinning(true);
        setWinner(null);

        // 1. Pick the winner index first
        const winnerIndex = Math.floor(Math.random() * managedMembers.length);
        const total = managedMembers.length;
        const sliceAngle = 360 / total;

        // 2. Target calculation: rotate to make the slice appear under pointer
        const offset = (winnerIndex * sliceAngle) + (sliceAngle / 2);
        const randomInnerOffset = (Math.random() * sliceAngle * 0.6) - (sliceAngle * 0.3);

        const extraSpins = 5 + Math.floor(Math.random() * 5);
        const finalRotation = rotation + (extraSpins * 360) + (360 - offset) + randomInnerOffset;

        setRotation(finalRotation);

        setTimeout(() => {
            setSpinning(false);
            setWinner(managedMembers[winnerIndex].nombre);
            setShowWinnerOverlay(true);

            // Trigger a little celebration burst if possible (handled by UI)
        }, 5000); // Must match transition duration
    };

    const createGroups = () => {
        if (managedMembers.length === 0) return;

        const shuffled = [...managedMembers].sort(() => Math.random() - 0.5);
        const groups: string[][] = Array.from({ length: numGroups }, () => []);

        shuffled.forEach((alumno, index) => {
            groups[index % numGroups].push(alumno.nombre);
        });

        setGeneratedGroups(groups);
    };

    const copyGroups = () => {
        const text = generatedGroups.map((g, i) => `Grupo ${i + 1}: ${g.join(', ')}`).join('\n');
        navigator.clipboard.writeText(text);
        toast.success("Grupos copiados al portapapeles");
    };

    const rollDice = () => {
        if (isRollingDice) return;
        setIsRollingDice(true);

        // Efecto visual rápido (ahora llega hasta diceType y genera 6 valores independientemente de numDice para que slice funcione)
        const timer = setInterval(() => {
            setDiceValues(
                Array.from({ length: 6 }, () => Math.floor(Math.random() * diceType) + 1)
            );
        }, 100);

        setTimeout(() => {
            clearInterval(timer);
            setDiceValues(
                Array.from({ length: 6 }, () => Math.floor(Math.random() * diceType) + 1)
            );
            setIsRollingDice(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full h-full md:max-w-7xl md:h-[90vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">

                {/* Header - Kid Friendly & Modern */}
                <div className="bg-slate-900 text-white p-4 md:p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                            <Trophy className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight leading-tight">
                                Sorteo Mágico
                            </h2>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                {managedMembers.length} Alumnos • <span className="text-yellow-500 font-mono">{codigoSala}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors group"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Winner Overlay (Anuncio de Ganador) */}
                {showWinnerOverlay && winner && (
                    <div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl animate-in zoom-in duration-300"
                        onClick={() => setShowWinnerOverlay(false)}
                    >
                        <div className="text-center p-8 relative">
                            <button
                                onClick={() => setShowWinnerOverlay(false)}
                                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl text-slate-900 hover:scale-110 transition-transform"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(250,204,21,0.5)] animate-bounce">
                                <Trophy className="w-12 h-12 text-slate-900" />
                            </div>
                            <h3 className="text-white/60 font-black uppercase tracking-[0.3em] text-xs mb-2">¡Ha salido elegido/a!</h3>
                            <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl">
                                {winner}
                            </h2>
                            <button
                                onClick={() => setShowWinnerOverlay(false)}
                                className="px-12 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-yellow-400 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm"
                            >
                                Genial
                            </button>
                        </div>
                    </div>
                )}

                {/* Main View */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50/50 min-h-0">

                    {/* === MOBILE COMBINED VIEW === */}
                    <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-y-auto">
                        {/* Mobile Mode Switcher */}
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-2">
                            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                                <button
                                    onClick={() => setMode('single')}
                                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'single'
                                        ? 'bg-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <Shuffle className="w-4 h-4" />
                                        Ruleta
                                    </span>
                                </button>
                                <button
                                    onClick={() => setMode('groups')}
                                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'groups'
                                        ? 'bg-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Equipos
                                    </span>
                                </button>
                                <button
                                    onClick={() => setMode('dice')}
                                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'dice'
                                        ? 'bg-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <Dices className="w-4 h-4" />
                                        Dados
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Content: single combined scrollable area */}
                        <div className="flex-1 p-4 space-y-4">
                            {mode === 'single' ? (
                                <>
                                    {/* Wheel */}
                                    <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center mx-auto">
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                                            <div className="w-10 h-12 bg-slate-900 rounded-b-lg flex items-center justify-center p-1">
                                                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-yellow-400" />
                                            </div>
                                        </div>
                                        <div className={`absolute inset-0 rounded-full bg-blue-500/10 blur-3xl transition-opacity duration-1000 ${spinning ? 'opacity-100' : 'opacity-0'}`} />
                                        <div
                                            className="w-[90%] h-[90%] rounded-full border-[10px] border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden transition-transform duration-[5s] cubic-bezier(0.1, 0, 0.1, 1)"
                                            style={{ transform: `rotate(${rotation}deg)` }}
                                        >
                                            <svg viewBox="-100 -100 200 200" className="w-full h-full">
                                                {managedMembers.map((alumno, i) => {
                                                    const total = managedMembers.length;
                                                    const angle = 2 * Math.PI / total;
                                                    const startAngle = i * angle - Math.PI / 2 - (total > 0 ? (2 * Math.PI / total / 2) : 0);
                                                    const endAngle = (i + 1) * angle - Math.PI / 2 - (total > 0 ? (2 * Math.PI / total / 2) : 0);
                                                    const x1 = 100 * Math.cos(startAngle);
                                                    const y1 = 100 * Math.sin(startAngle);
                                                    const x2 = 100 * Math.cos(endAngle);
                                                    const y2 = 100 * Math.sin(endAngle);
                                                    const largeArc = angle > Math.PI ? 1 : 0;
                                                    const d = `M 0 0 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                                    const midAngle = startAngle + angle / 2;
                                                    const textX = 75 * Math.cos(midAngle);
                                                    const textY = 75 * Math.sin(midAngle);
                                                    const rotationDeg = (midAngle * 180 / Math.PI);
                                                    const fontSize = total > 20 ? "6.5" : total > 15 ? "8.5" : total > 8 ? "11" : "13";
                                                    return (
                                                        <g key={`${alumno.id}-${i}`}>
                                                            <path d={d} fill={colors[i % colors.length]} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                                                            <rect x={textX - 25} y={textY - (parseFloat(fontSize) / 2) - 2} width={50} height={parseFloat(fontSize) + 4} rx="4" fill="rgba(255,255,255,0.2)" transform={`rotate(${rotationDeg + 90}, ${textX}, ${textY})`} className="pointer-events-none" />
                                                            <text x={textX} y={textY} fill="white" fontSize={fontSize} fontWeight="900" textAnchor="middle" alignmentBaseline="middle" transform={`rotate(${rotationDeg + 90}, ${textX}, ${textY})`} className="pointer-events-none tracking-tight" style={{ paintOrder: 'stroke fill', stroke: 'rgba(0,0,0,0.3)', strokeWidth: '1px', strokeLinejoin: 'round' }}>
                                                                {alumno.nombre.length > 15 ? alumno.nombre.slice(0, 13) + '..' : alumno.nombre}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        </div>
                                        <button
                                            onClick={spinWheel}
                                            disabled={spinning || !managedMembers.length}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-slate-900 rounded-full border-[4px] border-white shadow-[0_0_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center z-40 transition-all active:scale-90"
                                        >
                                            <Shuffle className={`w-6 h-6 text-white ${spinning ? 'animate-spin' : ''}`} />
                                            <span className="text-[9px] font-black text-white uppercase">{spinning ? 'SORTEO' : 'GIRAR'}</span>
                                        </button>
                                    </div>
                                    {/* Participants list compact */}
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participantes</h3>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{managedMembers.length}</span>
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                placeholder="Añadir nombre..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = e.currentTarget.value.trim();
                                                        if (val) {
                                                            setManagedMembers([...managedMembers, { id: Math.random().toString(), nombre: val }]);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {managedMembers.map((m, idx) => (
                                                <div key={m.id} className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                                                    <span className="text-xs font-bold text-slate-700">{m.nombre}</span>
                                                    <button
                                                        onClick={() => setManagedMembers(managedMembers.filter((_, i) => i !== idx))}
                                                        className="w-5 h-5 rounded-full text-slate-300 flex items-center justify-center hover:text-red-500"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : mode === 'groups' ? (
                                <>
                                    {/* Groups Controls */}
                                    <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-5 text-center">
                                        <h3 className="text-base font-black text-slate-900 mb-1 uppercase tracking-tight">Formador de Equipos</h3>
                                        <p className="text-slate-500 text-[11px] mb-4">
                                            Divide a tus <span className="text-blue-600 font-bold">{managedMembers.length} alumnos</span> en equipos.
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Equipos</label>
                                                <span className="bg-white text-blue-600 text-xs font-black px-3 py-1 rounded-lg border border-blue-100">{numGroups}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max={Math.min(10, Math.max(1, managedMembers.length))}
                                                value={numGroups}
                                                onChange={(e) => setNumGroups(parseInt(e.target.value) || 1)}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <button
                                            onClick={createGroups}
                                            disabled={!managedMembers.length}
                                            className="mt-4 w-full py-4 bg-blue-600 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Shuffle className="w-5 h-5" />
                                            GENERAR EQUIPOS
                                        </button>
                                    </div>
                                    {/* Generated Groups */}
                                    {generatedGroups.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                    Equipos Generados
                                                </h3>
                                                <button onClick={copyGroups} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase flex items-center gap-1">
                                                    <Copy className="w-3 h-3" /> Copiar
                                                </button>
                                            </div>
                                            {generatedGroups.map((grupo, i) => (
                                                <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">Equipo {i + 1}</h4>
                                                        {addInputTeam === i ? (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nombre"
                                                                    value={addInputValue}
                                                                    onChange={(e) => setAddInputValue(e.target.value)}
                                                                    className="px-2 py-1 border rounded-lg text-xs w-24"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            if (addInputValue.trim()) {
                                                                                setGeneratedGroups(prev => {
                                                                                    const newGroups = [...prev];
                                                                                    if (newGroups[i]) newGroups[i] = [...newGroups[i], addInputValue.trim()];
                                                                                    return newGroups;
                                                                                });
                                                                            }
                                                                            setAddInputTeam(null);
                                                                            setAddInputValue('');
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        if (addInputValue.trim()) {
                                                                            setGeneratedGroups(prev => {
                                                                                const newGroups = [...prev];
                                                                                if (newGroups[i]) newGroups[i] = [...newGroups[i], addInputValue.trim()];
                                                                                return newGroups;
                                                                            });
                                                                        }
                                                                        setAddInputTeam(null);
                                                                        setAddInputValue('');
                                                                    }}
                                                                    className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center active:scale-90"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setAddInputTeam(null); setAddInputValue(''); }}
                                                                    className="w-7 h-7 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center active:scale-90"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setAddInputTeam(i); setAddInputValue(''); }}
                                                                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90 relative"
                                                                title="Añadir Integrante"
                                                            >
                                                                <Users className="w-3.5 h-3.5" />
                                                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 text-[8px] border border-white flex items-center justify-center font-bold">+</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {grupo.map((alumno, idx) => (
                                                            <div key={`${alumno}-${idx}`} className="flex items-center gap-1">
                                                                <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl text-[11px] font-bold">{alumno}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setGeneratedGroups(prev => {
                                                                            const newGroups = [...prev];
                                                                            if (newGroups[i]) newGroups[i] = newGroups[i].filter((_, index) => index !== idx);
                                                                            return newGroups;
                                                                        });
                                                                    }}
                                                                    className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white active:scale-90"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Dice Mobile */}
                                    <div className="flex flex-col items-center gap-6">
                                        <div className={`flex flex-wrap items-center justify-center gap-4 ${numDice > 3 ? 'scale-75' : 'scale-90'}`}>
                                            {diceValues.slice(0, numDice).map((val, idx) => (
                                                <div key={idx} className="perspective-1000">
                                                    {diceType === 6 ? (
                                                        <div
                                                            className={`w-24 h-24 relative preserve-3d transition-transform duration-500 ${isRollingDice ? 'animate-rolling-dice' : ''}`}
                                                            style={{
                                                                transform: !isRollingDice ? (
                                                                    val === 1 ? 'rotateX(0deg) rotateY(0deg)' :
                                                                        val === 2 ? 'rotateX(-90deg) rotateY(0deg)' :
                                                                            val === 3 ? 'rotateY(-90deg) rotateX(0deg)' :
                                                                                val === 4 ? 'rotateY(90deg) rotateX(0deg)' :
                                                                                    val === 5 ? 'rotateX(90deg) rotateY(0deg)' :
                                                                                        'rotateX(180deg) rotateY(0deg)'
                                                                ) : undefined
                                                            }}
                                                        >
                                                            {[1, 2, 3, 4, 5, 6].map((v) => (
                                                                <div key={v} className="absolute inset-0 bg-white border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-inner" style={{ transform: v === 1 ? 'translateZ(48px)' : v === 2 ? 'rotateX(90deg) translateZ(48px)' : v === 3 ? 'rotateY(90deg) translateZ(48px)' : v === 4 ? 'rotateY(-90deg) translateZ(48px)' : v === 5 ? 'rotateX(-90deg) translateZ(48px)' : 'rotateX(180deg) translateZ(48px)', backfaceVisibility: 'hidden' }}>
                                                                    <div className="grid grid-cols-3 gap-1 p-3 w-full h-full">
                                                                        {v === 1 && <div className="col-start-2 row-start-2 w-3 h-3 bg-slate-900 rounded-full" />}
                                                                        {v === 2 && <><div className="col-start-1 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /></>}
                                                                        {v === 3 && <><div className="col-start-1 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-2 row-start-2 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /></>}
                                                                        {v === 4 && <><div className="col-start-1 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-1 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /></>}
                                                                        {v === 5 && <><div className="col-start-1 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-2 row-start-2 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-1 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /></>}
                                                                        {v === 6 && <><div className="col-start-1 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-1 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-1 row-start-2 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-2 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-1 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /><div className="col-start-3 row-start-3 w-3 h-3 bg-slate-900 rounded-full" /></>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className={`w-24 h-24 relative text-slate-900 flex items-center justify-center transition-all duration-[1.5s] ${isRollingDice ? 'animate-spin scale-90 blur-[1px]' : 'scale-100'}`}>
                                                            <svg viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="1" className="w-full h-full drop-shadow-xl">
                                                                <polygon points="12 2 19 6 21 14 16 21 8 21 3 14 5 6" />
                                                                <text x="12" y="12.5" fontSize="4.5" fontWeight="900" textAnchor="middle" fill="currentColor" stroke="none">{val}</text>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="inline-block px-8 py-4 bg-slate-900 rounded-[2rem] shadow-2xl">
                                            <span className="text-4xl font-black text-white">
                                                {numDice === 1 ? diceValues[0] : diceValues.slice(0, numDice).reduce((a, b) => a + b, 0)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Dice controls mobile */}
                                    <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-5">
                                        <div className="flex gap-2 justify-center bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-4">
                                            <button onClick={() => setDiceType(6)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all ${diceType === 6 ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
                                                <Dices className="w-4 h-4" /> D6
                                            </button>
                                            <button onClick={() => setDiceType(12)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all ${diceType === 12 ? 'bg-purple-100 text-purple-700' : 'text-slate-400'}`}>
                                                <D12Icon className="w-4 h-4" /> D12
                                            </button>
                                        </div>
                                        <div className="flex gap-2 justify-center mb-4">
                                            {[1, 2, 3, 4, 5, 6].map(n => (
                                                <button key={n} onClick={() => setNumDice(n)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${numDice === n ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={rollDice} disabled={isRollingDice} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                            <Dices className={`w-5 h-5 ${isRollingDice ? 'animate-spin' : ''}`} />
                                            {isRollingDice ? 'LANZANDO...' : 'LANZAR DADOS'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* === DESKTOP Column 1: The Wheel / Dice / Groups Results === */}
                    <div className={`hidden md:flex flex-1 flex-col items-center justify-center p-12 relative border-r border-slate-200/60 overflow-hidden`}>

                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                                <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Cargando Clase...</p>
                            </div>
                        ) : !managedMembers.length ? (
                            <div className="text-center max-w-xs">
                                <Users className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-slate-800 mb-2">Clase Vacía</h3>
                                <p className="text-slate-500 text-sm">Los alumnos deben entrar con el código para aparecer aquí.</p>
                            </div>
                        ) : mode === 'dice' ? (
                            <div className="flex flex-col items-center justify-center gap-6 md:gap-12 w-full h-full animate-in zoom-in duration-500 overflow-y-auto py-8">
                                <div className={`flex flex-wrap items-center justify-center gap-4 md:gap-8 ${numDice > 3 ? 'scale-75 md:scale-85' : 'scale-90 md:scale-100'}`}>
                                    {diceValues.slice(0, numDice).map((val, idx) => (
                                        <div key={idx} className="perspective-1000">
                                            {diceType === 6 ? (
                                                <div
                                                    className={`w-24 h-24 md:w-32 md:h-32 relative preserve-3d transition-transform duration-500 ${isRollingDice ? 'animate-rolling-dice' : ''}`}
                                                    style={{
                                                        transform: !isRollingDice ? (
                                                            val === 1 ? 'rotateX(0deg) rotateY(0deg)' :
                                                                val === 2 ? 'rotateX(-90deg) rotateY(0deg)' :
                                                                    val === 3 ? 'rotateY(-90deg) rotateX(0deg)' :
                                                                        val === 4 ? 'rotateY(90deg) rotateX(0deg)' :
                                                                            val === 5 ? 'rotateX(90deg) rotateY(0deg)' :
                                                                                'rotateX(180deg) rotateY(0deg)'
                                                        ) : undefined
                                                    }}
                                                >
                                                    {[1, 2, 3, 4, 5, 6].map((v) => (
                                                        <div
                                                            key={v}
                                                            className="absolute inset-0 bg-white border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-inner"
                                                            style={{
                                                                transform: v === 1 ? 'translateZ(48px)' :
                                                                    v === 2 ? 'rotateX(90deg) translateZ(48px)' :
                                                                        v === 3 ? 'rotateY(90deg) translateZ(48px)' :
                                                                            v === 4 ? 'rotateY(-90deg) translateZ(48px)' :
                                                                                v === 5 ? 'rotateX(-90deg) translateZ(48px)' :
                                                                                    'rotateX(180deg) translateZ(48px)',
                                                                backfaceVisibility: 'hidden',
                                                            }}
                                                        >
                                                            <div className={`grid grid-cols-3 gap-1 md:gap-2 p-3 md:p-4 w-full h-full`}>
                                                                {v === 1 && <div className="col-start-2 row-start-2 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" />}
                                                                {v === 2 && (<><div className="col-start-1 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /></>)}
                                                                {v === 3 && (<><div className="col-start-1 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-2 row-start-2 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /></>)}
                                                                {v === 4 && (<><div className="col-start-1 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-1 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /></>)}
                                                                {v === 5 && (<><div className="col-start-1 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-2 row-start-2 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-1 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /></>)}
                                                                {v === 6 && (<><div className="col-start-1 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-1 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-1 row-start-2 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-2 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-1 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /><div className="col-start-3 row-start-3 w-3 h-3 md:w-4 md:h-4 bg-slate-900 rounded-full shadow-sm" /></>)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div
                                                    className={`w-24 h-24 md:w-32 md:h-32 relative text-slate-900 flex items-center justify-center transition-all duration-[1.5s] ease-in-out ${isRollingDice ? 'animate-spin scale-90 blur-[1px]' : 'scale-100 hover:scale-110 drop-shadow-2xl'}`}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-xl">
                                                        <polygon points="12 2 19 6 21 14 16 21 8 21 3 14 5 6" />
                                                        <polygon points="12 6.5 16.5 10.5 14.5 15.5 9.5 15.5 7.5 10.5" fill="rgba(37,99,235,0.05)" />
                                                        <line x1="12" y1="2" x2="12" y2="6.5" />
                                                        <line x1="19" y1="6" x2="16.5" y2="10.5" />
                                                        <line x1="16" y1="21" x2="14.5" y2="15.5" />
                                                        <line x1="8" y1="21" x2="9.5" y2="15.5" />
                                                        <line x1="5" y1="6" x2="7.5" y2="10.5" />

                                                        {/* Number inside the polygon */}
                                                        <text x="12" y="12.5" fontSize="4.5" fontWeight="900" textAnchor="middle" fill="currentColor" stroke="none">
                                                            {val}
                                                        </text>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center">
                                    <div className="inline-block px-8 py-4 bg-slate-900 rounded-[2rem] shadow-2xl">
                                        <span className="text-5xl font-black text-white">
                                            {numDice === 1 ? diceValues[0] : diceValues.slice(0, numDice).reduce((a, b) => a + b, 0)}
                                        </span>
                                    </div>
                                    <p className="mt-4 font-black text-slate-400 uppercase text-[10px] tracking-[0.3em]">
                                        {numDice === 1 ? 'Resultado' : 'Suma Total'}
                                    </p>
                                </div>

                                {/* Botón de lanzar para móvil */}
                                <button
                                    onClick={rollDice}
                                    disabled={isRollingDice}
                                    className="md:hidden mt-4 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                >
                                    <Dices className={`w-5 h-5 ${isRollingDice ? 'animate-spin' : ''}`} />
                                    {isRollingDice ? 'LANZANDO...' : 'LANZAR'}
                                </button>
                            </div>
                        ) : mode === 'groups' ? (
                            <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto px-4 md:px-12 py-8">
                                {generatedGroups.length > 0 ? (
                                    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex justify-between items-center mb-6 px-2">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                                <Users className="w-5 h-5 text-blue-600" />
                                                Equipos Generados
                                            </h3>
                                            <button onClick={copyGroups} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-blue-100 transition-colors">
                                                <Copy className="w-3 h-3" /> Copiar Todo
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-12">
                                            {generatedGroups.map((grupo, i) => (
                                                <div key={i} className="bg-white border border-slate-200 p-6 rounded-[2.5rem] relative overflow-hidden group/card shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                                    <div className="flex justify-between items-center mb-5">
                                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">Equipo {i + 1}</h4>
                                                        {addInputTeam === i ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nombre integrante"
                                                                    value={addInputValue}
                                                                    onChange={(e) => setAddInputValue(e.target.value)}
                                                                    className="px-2 py-1 border rounded"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            // Confirm addition
                                                                            if (addInputValue.trim()) {
                                                                                setGeneratedGroups(prev => {
                                                                                    const newGroups = [...prev];
                                                                                    if (newGroups[i]) {
                                                                                        newGroups[i] = [...newGroups[i], addInputValue.trim()];
                                                                                    }
                                                                                    return newGroups;
                                                                                });
                                                                            }
                                                                            setAddInputTeam(null);
                                                                            setAddInputValue('');
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        if (addInputValue.trim()) {
                                                                            setGeneratedGroups(prev => {
                                                                                const newGroups = [...prev];
                                                                                if (newGroups[i]) {
                                                                                    newGroups[i] = [...newGroups[i], addInputValue.trim()];
                                                                                }
                                                                                return newGroups;
                                                                            });
                                                                            toast.success(`Añadido a Equipo ${i + 1}`);
                                                                        }
                                                                        setAddInputTeam(null);
                                                                        setAddInputValue('');
                                                                    }}
                                                                    className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg active:scale-90"
                                                                >
                                                                    <Check className="w-5 h-5 font-black" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setAddInputTeam(null);
                                                                        setAddInputValue('');
                                                                    }}
                                                                    className="w-10 h-10 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all active:scale-90"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAddInputTeam(i);
                                                                    setAddInputValue('');
                                                                }}
                                                                className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                                title="Añadir Integrante"
                                                            >
                                                                <Users className="w-4 h-4" />
                                                                <span className=" absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 text-[10px] border-2 border-white flex items-center justify-center font-bold">+</span>
                                                            </button>
                                                        )}

                                                    </div>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {grupo.map((alumno, idx) => (
                                                            <div key={`${alumno}-${idx}`} className="flex items-center gap-1 group/item">
                                                                <span className="px-3.5 py-2 bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl text-[11px] font-bold shadow-sm group-hover/card:bg-white transition-colors">
                                                                    {alumno}
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        setGeneratedGroups(prev => {
                                                                            const newGroups = [...prev];
                                                                            if (newGroups[i]) {
                                                                                newGroups[i] = newGroups[i].filter((_, index) => index !== idx);
                                                                            }
                                                                            return newGroups;
                                                                        });
                                                                    }}
                                                                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                                                                    title="Eliminar Integrante"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {grupo.length === 0 && (
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase italic p-2">Emtpy Team</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-700">
                                        <div className="w-48 h-48 bg-blue-50 rounded-[3rem] flex items-center justify-center mb-8 relative group">
                                            <div className="absolute inset-0 bg-blue-100 rounded-[3rem] scale-90 blur-xl opacity-50 group-hover:scale-110 transition-transform duration-500" />
                                            <Users className="w-24 h-24 text-blue-600 relative z-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Formador de Equipos</h3>
                                        <p className="text-slate-500 max-w-xs leading-relaxed">
                                            Divide a tus <span className="text-blue-600 font-bold">{managedMembers.length} alumnos</span> en grupos equilibrados para tus actividades.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative w-full max-w-[260px] xs:max-w-[320px] md:max-w-[420px] aspect-square flex items-center justify-center my-auto">
                                {/* Pointer - More Stylized */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                                    <div className="w-10 h-12 bg-slate-900 rounded-b-lg flex items-center justify-center p-1">
                                        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-yellow-400" />
                                    </div>
                                </div>

                                {/* Wheel Outer Glow */}
                                <div className={`absolute inset-0 rounded-full bg-blue-500/10 blur-3xl transition-opacity duration-1000 ${spinning ? 'opacity-100' : 'opacity-0'}`} />

                                {/* The Wheel */}
                                <div
                                    ref={wheelRef}
                                    className="w-[90%] h-[90%] rounded-full border-[10px] border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden transition-transform duration-[5s] cubic-bezier(0.1, 0, 0.1, 1)"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                >
                                    <svg viewBox="-100 -100 200 200" className="w-full h-full">
                                        {managedMembers.map((alumno, i) => {
                                            const total = managedMembers.length;
                                            const angle = 2 * Math.PI / total;
                                            const startAngle = i * angle - Math.PI / 2 - (total > 0 ? (2 * Math.PI / total / 2) : 0);
                                            const endAngle = (i + 1) * angle - Math.PI / 2 - (total > 0 ? (2 * Math.PI / total / 2) : 0);

                                            const x1 = 100 * Math.cos(startAngle);
                                            const y1 = 100 * Math.sin(startAngle);
                                            const x2 = 100 * Math.cos(endAngle);
                                            const y2 = 100 * Math.sin(endAngle);
                                            const largeArc = angle > Math.PI ? 1 : 0;
                                            const d = `M 0 0 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;

                                            const midAngle = startAngle + angle / 2;
                                            const textX = 75 * Math.cos(midAngle);
                                            const textY = 75 * Math.sin(midAngle);
                                            const rotationDeg = (midAngle * 180 / Math.PI);

                                            const fontSize = total > 20 ? "6.5" : total > 15 ? "8.5" : total > 8 ? "11" : "13";

                                            return (
                                                <g key={`${alumno.id}-${i}`}>
                                                    <path d={d} fill={colors[i % colors.length]} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

                                                    <rect
                                                        x={textX - 25}
                                                        y={textY - (parseFloat(fontSize) / 2) - 2}
                                                        width={50}
                                                        height={parseFloat(fontSize) + 4}
                                                        rx="4"
                                                        fill="rgba(255,255,255,0.2)"
                                                        transform={`rotate(${rotationDeg + 90}, ${textX}, ${textY})`}
                                                        className="pointer-events-none"
                                                    />

                                                    <text
                                                        x={textX}
                                                        y={textY}
                                                        fill="white"
                                                        fontSize={fontSize}
                                                        fontWeight="900"
                                                        textAnchor="middle"
                                                        alignmentBaseline="middle"
                                                        transform={`rotate(${rotationDeg + 90}, ${textX}, ${textY})`}
                                                        className="pointer-events-none tracking-tight"
                                                        style={{
                                                            paintOrder: 'stroke fill',
                                                            stroke: 'rgba(0,0,0,0.3)',
                                                            strokeWidth: '1px',
                                                            strokeLinejoin: 'round'
                                                        }}
                                                    >
                                                        {alumno.nombre.length > 15 ? alumno.nombre.slice(0, 13) + '..' : alumno.nombre}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* Center Knob */}
                                <button
                                    onClick={spinWheel}
                                    disabled={spinning || !managedMembers.length}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-slate-900 rounded-full border-[4px] border-white shadow-[0_0_40px_rgba(0,0,0,0.4),0_0_20px_rgba(37,99,235,0.2)] flex flex-col items-center justify-center z-40 transition-all active:scale-90 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 group cursor-pointer overflow-hidden isolate"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                                    <div className={`absolute inset-0 bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${spinning ? 'opacity-100 animate-spin-slow' : ''}`} />
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                                    <div className="relative z-10 flex flex-col items-center justify-center">
                                        <Shuffle className={`w-7 h-7 mb-1 transition-all duration-500 ${spinning ? 'text-white animate-spin' : 'text-white group-hover:scale-110'}`} />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.15em] leading-tight drop-shadow-md">
                                            {spinning ? 'SORTEO' : 'GIRAR'}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2),inset_0_-2px_10px_rgba(0,0,0,0.4)] rounded-full pointer-events-none" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Column 2: Controls (Desktop only) */}
                    <div className="hidden md:flex w-[400px] flex-col p-8 bg-white shrink-0 overflow-y-auto">

                        {/* Mode Switcher */}
                        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 mb-8">
                            <button
                                onClick={() => setMode('single')}
                                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'single'
                                    ? 'bg-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Shuffle className="w-4 h-4" />
                                    Ruleta
                                </span>
                            </button>
                            <button
                                onClick={() => setMode('groups')}
                                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'groups'
                                    ? 'bg-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Equipos
                                </span>
                            </button>
                            <button
                                onClick={() => setMode('dice')}
                                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'dice'
                                    ? 'bg-blue-600 text-white shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Dices className="w-4 h-4" />
                                    Dados
                                </span>
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            {mode === 'single' ? (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 mb-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participantes</h3>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{managedMembers.length}</span>
                                        </div>

                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                placeholder="Añadir nombre..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = e.currentTarget.value.trim();
                                                        if (val) {
                                                            setManagedMembers([...managedMembers, { id: Math.random().toString(), nombre: val }]);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>

                                        <div className="max-h-[380px] md:max-h-[480px] overflow-y-auto pr-2 space-y-2 scrollbar-hide py-1">
                                            {managedMembers.map((m, idx) => (
                                                <div key={m.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-xl group hover:border-blue-200 transition-all shadow-sm">
                                                    <span className="text-sm font-bold text-slate-700">{m.nombre}</span>
                                                    <button
                                                        onClick={() => setManagedMembers(managedMembers.filter((_, i) => i !== idx))}
                                                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90 flex-shrink-0"
                                                        title="Eliminar"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : mode === 'dice' ? (
                                <div className="flex-1 flex flex-col justify-center gap-8">
                                    <div className="bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] p-8 text-center">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                                            <Dices className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Mini-Dados</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                            Selecciona tipo y cantidad de dados.
                                        </p>

                                        <div className="flex flex-col gap-4 mb-2">
                                            {/* Selector de Tipo de Dado */}
                                            <div className="flex gap-2 justify-center bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                                                <button
                                                    onClick={() => setDiceType(6)}
                                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all ${diceType === 6 ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    <Dices className="w-4 h-4" />
                                                    D6
                                                </button>
                                                <button
                                                    onClick={() => setDiceType(12)}
                                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all ${diceType === 12 ? 'bg-purple-100 text-purple-700' : 'text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    <D12Icon className="w-4 h-4" />
                                                    D12
                                                </button>
                                            </div>

                                            {/* Selector de Cantidad */}
                                            <div className="flex gap-2 justify-center">
                                                {[1, 2, 3, 4, 5, 6].map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setNumDice(n)}
                                                        className={`w-10 h-10 md:w-11 md:h-11 rounded-xl font-black text-xs transition-all ${numDice === n ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-300'}`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={rollDice}
                                        disabled={isRollingDice}
                                        className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50"
                                    >
                                        <span className={`transition-transform duration-500 ${isRollingDice ? 'animate-spin' : 'group-hover:rotate-12'}`}>
                                            <Dices className="w-6 h-6" />
                                        </span>
                                        {isRollingDice ? 'LANZANDO...' : 'LANZAR DADOS'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] p-8 text-center mb-8">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                                            <Users className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Formador de Equipos</h3>
                                        <p className="text-slate-500 text-[11px] leading-relaxed mb-6 font-medium">
                                            Divide a tus alumnos en grupos equilibrados para tus actividades.
                                        </p>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Equipos</label>
                                                <span className="bg-white text-blue-600 text-xs font-black px-3 py-1 rounded-lg border border-blue-100 shadow-sm">{numGroups}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max={Math.min(10, Math.max(1, managedMembers.length))}
                                                value={numGroups}
                                                onChange={(e) => setNumGroups(parseInt(e.target.value) || 1)}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={createGroups}
                                        disabled={!managedMembers.length}
                                        className="w-full py-6 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50"
                                    >
                                        <Shuffle className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                                        GENERAR EQUIPOS
                                    </button>

                                    <div className="mt-auto pt-8 text-center opacity-20">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gestión de Equipos v1.5.16</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Bottom Navigation Bar is now replaced by the top mode switcher */}
                </div>
            </div>
        </div>
    );
}
