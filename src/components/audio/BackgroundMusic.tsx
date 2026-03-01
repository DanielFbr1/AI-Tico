import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ticoAudio } from '../../lib/audio/TicoAudioEngine';

export function BackgroundMusic() {
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const startAudio = async () => {
            if (isPlaying) return;
            try {
                await ticoAudio.init();
                ticoAudio.play();
                setIsPlaying(true);
            } catch (e) {
                console.warn("Auto-start failed, waiting for interaction", e);
            }
        };

        const handleInteraction = () => {
            startAudio();
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };

        // Intentar iniciar inmediatamente (puede funcionar si venimos de una interacción previa)
        startAudio();

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            ticoAudio.stop();
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []); // Arreglo vacío para que solo se ejecute al montar/desmontar el componente

    const toggleMute = () => {
        if (isMuted) {
            ticoAudio.setVolume(0.4);
            setIsMuted(false);
            // Intentar reanudar o iniciar se la música si está pausada
            ticoAudio.play();
            setIsPlaying(true);
        } else {
            ticoAudio.setVolume(0);
            setIsMuted(true);
        }
    };

    return (
        <div className="absolute top-4 right-[380px] z-50 transition-opacity duration-500 opacity-60 hover:opacity-100">
            <button
                onClick={toggleMute}
                className={`p-2.5 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 group flex items-center gap-2 ${isMuted
                    ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                    : 'bg-white/90 border-purple-200 text-purple-600 hover:scale-105 hover:bg-purple-50'
                    }`}
                title={isMuted ? "Activar música" : "Silenciar música"}
            >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">
                    {isMuted ? 'Muted' : 'Music'}
                </span>
            </button>
        </div>
    );
}
