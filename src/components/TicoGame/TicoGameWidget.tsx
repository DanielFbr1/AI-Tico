import React from 'react';
import { useTicoGame } from '../../hooks/useTicoGame'; // Adjust path if needed
import { TicoVisuals } from './TicoVisuals';
import { Heart, Play, BookOpen, RefreshCw } from 'lucide-react';

export function TicoGameWidget() {
    const { state, feed, play, educate, reset } = useTicoGame();

    const progressPercentage = Math.min((state.experience / state.maxExperience) * 100, 100);

    return (
        <div className="w-full bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 flex flex-col items-center gap-6 relative overflow-hidden">
            {/* Version Tag */}
            <div className="absolute top-4 left-4 text-[10px] text-slate-300 font-mono select-none">
                v1.0.1 (Game Logic)
            </div>

            <div className="w-full flex justify-between items-center mb-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tu Mascota de Clase</h3>
                <button onClick={reset} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="Reiniciar">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <TicoVisuals level={state.level} mood={state.mood} />

            {/* Stats */}
            <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Experiencia</span>
                    <span>{state.experience} / {state.maxExperience} XP</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full justify-center">
                <ActionButton
                    icon={<Heart className="w-5 h-5" />}
                    label="Alimentar"
                    onClick={feed}
                    color="rose"
                />
                <ActionButton
                    icon={<Play className="w-5 h-5" />}
                    label="Jugar"
                    onClick={play}
                    color="yellow"
                />
                <ActionButton
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Educar"
                    onClick={educate}
                    color="emerald"
                />
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color: 'rose' | 'yellow' | 'emerald' }) {
    const colorClasses = {
        rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100',
        yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-100',
        emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100',
    };

    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 flex-1 ${colorClasses[color]}`}
        >
            <div className="mb-1">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}
