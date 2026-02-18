import { useState, useEffect, useRef } from 'react';
import { X, Trophy, Users, Shuffle, Loader2, Copy, Sparkles } from 'lucide-react';
import { useListaAlumnos } from '../hooks/useListaAlumnos';
import { toast } from 'sonner';

interface RuletaModalProps {
    onClose: () => void;
    proyectoId?: string;
    codigoSala?: string;
}

export function RuletaModal({ onClose, proyectoId, codigoSala }: RuletaModalProps) {
    const { alumnos, loading } = useListaAlumnos(codigoSala);
    const [mode, setMode] = useState<'single' | 'groups'>('single');
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState<string | null>(null);

    // Group state
    const [numGroups, setNumGroups] = useState(2);
    const [generatedGroups, setGeneratedGroups] = useState<string[][]>([]);

    // Wheel constants - Vibrant dark colors for maximum text contrast
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#ca8a04', '#059669', '#4f46e5', '#dc2626', '#0891b2'];
    const wheelRef = useRef<HTMLDivElement>(null);

    const spinWheel = () => {
        if (alumnos.length < 1) return;
        if (spinning) return;

        setSpinning(true);
        setWinner(null);

        // 1. Pick the winner index first
        const winnerIndex = Math.floor(Math.random() * alumnos.length);
        const total = alumnos.length;
        const sliceAngle = 360 / total;

        // 2. Calculate rotation
        // Each slice 'i' is centered at (i * sliceAngle) degrees from the top
        // To bring slice 'i' to the top, we rotate the wheel by -(i * sliceAngle)
        const offset = (winnerIndex * sliceAngle);

        // Add multiple full turns (5-8 turns) and subtract the offset
        // We add normalized randomness within the slice (keep it 20% away from borders)
        const randomInnerOffset = (Math.random() * sliceAngle * 0.6) - (sliceAngle * 0.3);

        const extraSpins = 5 + Math.floor(Math.random() * 5);
        const finalRotation = rotation + (extraSpins * 360) + (360 - offset) + randomInnerOffset;

        setRotation(finalRotation);

        setTimeout(() => {
            setSpinning(false);
            setWinner(alumnos[winnerIndex].nombre);

            // Trigger a little celebration burst if possible (handled by UI)
        }, 5000); // Must match transition duration
    };

    const createGroups = () => {
        if (alumnos.length === 0) return;

        const shuffled = [...alumnos].sort(() => Math.random() - 0.5);
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

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col max-h-[95vh] border border-white/20">
                {/* Header - More Compact */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                            <Trophy className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight leading-tight">
                                Sorteo Mágico
                            </h2>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                {alumnos.length} Alumnos • <span className="text-yellow-500 font-mono">{codigoSala}</span>
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

                {/* Main View - Two Columns */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50/50">

                    {/* Column 1: The Wheel (Always visible if pupils exist) */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative border-b md:border-b-0 md:border-r border-slate-200/60 overflow-hidden">

                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                                <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Cargando Clase...</p>
                            </div>
                        ) : !alumnos.length ? (
                            <div className="text-center max-w-xs">
                                <Users className="w-20 h-20 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-slate-800 mb-2">Clase Vacía</h3>
                                <p className="text-slate-500 text-sm">Los alumnos deben entrar con el código para aparecer aquí.</p>
                            </div>
                        ) : (
                            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
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
                                        {alumnos.map((alumno, i) => {
                                            const total = alumnos.length;
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

                                            // Dynamic and larger font sizes for legibility
                                            const fontSize = total > 20 ? "6.5" : total > 15 ? "8.5" : total > 8 ? "11" : "13";

                                            return (
                                                <g key={alumno.id}>
                                                    <path d={d} fill={colors[i % colors.length]} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
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
                                                            strokeWidth: '1.5px',
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

                                {/* Center Knob - Elegant */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-8 border-slate-900 shadow-2xl flex items-center justify-center z-10 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent" />
                                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Column 2: Controls & Results */}
                    <div className="w-full md:w-[400px] flex flex-col p-8 bg-white shrink-0">

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
                                    Grupos
                                </span>
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            {mode === 'single' ? (
                                <div className="flex-1 flex flex-col justify-center gap-10">
                                    <button
                                        onClick={spinWheel}
                                        disabled={spinning || !alumnos.length}
                                        className="w-full py-6 bg-slate-900 text-white font-black text-2xl uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {spinning ? 'GIRANDO...' : '¡SORTEAR!'}
                                    </button>

                                    {/* Winner Area */}
                                    <div className="min-h-[160px] flex items-center justify-center">
                                        {winner && !spinning ? (
                                            <div className="w-full animate-in zoom-in slide-in-from-bottom-8 duration-500 bg-yellow-400/10 border-2 border-yellow-400/50 p-8 rounded-[2.5rem] text-center shadow-[0_0_40px_rgba(250,204,21,0.15)] relative">
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Ganador/a</div>
                                                <p className="text-4xl font-black text-slate-900 mb-1 leading-tight">{winner}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">¡Has sido el elegido! 🎉</p>
                                            </div>
                                        ) : (
                                            <div className="text-center opacity-30 group">
                                                <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-300 group-hover:text-blue-400 transition-colors duration-500" />
                                                <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Pulsa el botón para empezar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="space-y-6 mb-8 shrink-0">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Equipos</label>
                                                <span className="bg-slate-100 text-slate-600 text-xs font-black px-3 py-1 rounded-lg border border-slate-200">{numGroups}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="2"
                                                max={Math.max(2, alumnos.length)}
                                                value={numGroups}
                                                onChange={(e) => setNumGroups(parseInt(e.target.value) || 2)}
                                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <button
                                            onClick={createGroups}
                                            disabled={!alumnos.length}
                                            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50"
                                        >
                                            <Shuffle className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                            GENERAR EQUIPOS
                                        </button>
                                    </div>

                                    {/* Scrollable Results Area */}
                                    <div className="flex-1 min-h-0 flex flex-col">
                                        {generatedGroups.length > 0 ? (
                                            <>
                                                <div className="flex justify-between items-center px-1 mb-4">
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Previa</h3>
                                                    <button onClick={copyGroups} className="text-blue-600 hover:underline transition-all font-black text-[10px] uppercase flex items-center gap-1.5">
                                                        <Copy className="w-3 h-3" /> Copiar Todo
                                                    </button>
                                                </div>

                                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide py-1">
                                                    {generatedGroups.map((grupo, i) => (
                                                        <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-3xl relative overflow-hidden group hover:border-blue-300 transition-all">
                                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-full my-4 scale-y-75" />
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Equipo {i + 1}</h4>
                                                                <span className="text-[10px] font-bold text-slate-400">{grupo.length} integrantes</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {grupo.map((alumno) => (
                                                                    <span key={alumno} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold shadow-sm group-hover:border-blue-100 transition-colors">
                                                                        {alumno}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                                <Users className="w-12 h-12 mb-4 text-slate-300" />
                                                <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 max-w-[150px] leading-relaxed">Configura los equipos arriba</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
