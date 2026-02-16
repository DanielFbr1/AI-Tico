import React, { useState, useCallback, useRef } from 'react';
import { Sparkles, BookOpen, Film, Palette, Music, Newspaper, Video, FileText, Monitor, ArrowLeft, Send, Podcast, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { ticoAudio } from '../../lib/audio/TicoAudioEngine';

interface IngestionModuleProps {
    onFeed: (fullInput: string) => void;
}

export const IngestionModule: React.FC<IngestionModuleProps> = ({ onFeed }) => {
    const [input, setInput] = useState('');
    const [selectedType, setSelectedType] = useState<{ id: string, label: string, icon: React.ReactNode, color: string, bg: string, border: string } | null>(null);
    const [isListening, setIsListening] = useState(false);

    // Web Speech API references
    const recognitionRef = useRef<any>(null);

    const RESOURCE_TYPES = [
        // CLUSTER C: Letras
        { id: 'book', label: 'Libro', icon: <BookOpen className="w-8 h-8" />, color: 'text-blue-500', bg: 'hover:bg-blue-50', border: 'hover:border-blue-300' },
        { id: 'magazine', label: 'Revista', icon: <Monitor className="w-8 h-8" />, color: 'text-blue-500', bg: 'hover:bg-blue-50', border: 'hover:border-blue-300' },

        // CLUSTER B: Espectáculo
        { id: 'movie', label: 'Película', icon: <Film className="w-8 h-8" />, color: 'text-rose-500', bg: 'hover:bg-rose-50', border: 'hover:border-rose-300' },
        { id: 'song', label: 'Canción', icon: <Music className="w-8 h-8" />, color: 'text-rose-500', bg: 'hover:bg-rose-50', border: 'hover:border-rose-300' },
        { id: 'podcast', label: 'Podcast', icon: <Podcast className="w-8 h-8" />, color: 'text-rose-500', bg: 'hover:bg-rose-50', border: 'hover:border-rose-300' },

        // CLUSTER A: Artes Visuales
        { id: 'video', label: 'Video', icon: <Video className="w-8 h-8" />, color: 'text-pink-500', bg: 'hover:bg-pink-50', border: 'hover:border-pink-300' },
        { id: 'comic', label: 'Cómic', icon: <Palette className="w-8 h-8" />, color: 'text-pink-500', bg: 'hover:bg-pink-50', border: 'hover:border-pink-300' },
        { id: 'art', label: 'Obra de Arte', icon: <Palette className="w-8 h-8" />, color: 'text-pink-500', bg: 'hover:bg-pink-50', border: 'hover:border-pink-300' },

        // CLUSTER D: Análisis
        { id: 'newspaper', label: 'Periódico', icon: <Newspaper className="w-8 h-8" />, color: 'text-emerald-500', bg: 'hover:bg-emerald-50', border: 'hover:border-emerald-300' },
        { id: 'report', label: 'Informe', icon: <FileText className="w-8 h-8" />, color: 'text-emerald-500', bg: 'hover:bg-emerald-50', border: 'hover:border-emerald-300' },
    ];

    const handleSubmit = () => {
        if (!input.trim() || !selectedType) return;

        ticoAudio.playClickSFX();

        // Stop listening if active
        if (isListening) stopListening();

        const fullContent = `[Tipo: ${selectedType.label}] ${input}`;
        onFeed(fullContent);

        setSelectedType(null);
        setInput('');
    };

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("Tu navegador no soporta Dictado por Voz.");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsListening(true);
                toast.info("Escuchando...", { duration: 2000 });
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                toast.success("¡Te he oído!", { duration: 2000 });
            };

            recognition.onerror = (event: any) => {
                console.error("Speech Error:", event.error);
                setIsListening(false);

                if (event.error === 'network') {
                    toast.error("Error de Red: El dictado necesita internet o HTTPS.", {
                        description: "Asegúrate de estar en una conexión estable.",
                        duration: 5000
                    });
                } else if (event.error !== 'no-speech') {
                    toast.error("Error al escuchar. Inténtalo de nuevo.");
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (error) {
            console.error("STT Error:", error);
            setIsListening(false);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">

                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter drop-shadow-sm">
                        ¡Hora de Comer!
                    </h2>
                    <p className="text-lg text-slate-500 font-medium">
                        {selectedType ? `Cuéntame sobre ese ${selectedType.label}...` : "¿Qué ha aprendido la clase hoy? 🍎"}
                    </p>
                </div>

                {!selectedType ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                        {RESOURCE_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => { ticoAudio.playClickSFX(); setSelectedType(type); }}
                                className={`flex flex-col items-center justify-center gap-2 p-4 bg-white border-4 border-slate-100 rounded-[2rem] transition-all hover:-translate-y-1 hover:shadow-xl group ${type.bg} ${type.border}`}
                            >
                                <div className={`text-slate-400 group-hover:${type.color} transition-colors group-hover:scale-110 duration-300`}>
                                    {type.icon}
                                </div>
                                <span className={`font-black text-slate-600 group-hover:${type.color} uppercase tracking-tight text-[10px] transition-colors`}>
                                    {type.label}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center gap-6 animate-in slide-in-from-right-10 fade-in duration-300">
                        <div className="w-full relative group max-w-2xl">
                            {/* Icon Left */}
                            <div className={`absolute left-6 top-1/2 -translate-y-1/2 ${selectedType.color} z-10`}>
                                {selectedType.icon}
                            </div>

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder={isListening ? "Escuchando a los alumnos..." : `Ej: ${selectedType.label === 'Libro' ? "Harry Potter..." : selectedType.label === 'Canción' ? "Imagine..." : "Título o tema..."}`}
                                className={`w-full p-8 pl-20 pr-24 rounded-[3rem] text-2xl font-bold text-slate-700 placeholder:text-slate-300 bg-slate-50 border-4 transition-all shadow-inner outline-none
                                    ${isListening ? 'border-rose-400 ring-8 ring-rose-100 bg-white animate-pulse' : 'border-slate-100 focus:border-rose-300 focus:bg-white focus:ring-8 focus:ring-rose-100'}
                                `}
                                autoFocus
                            />

                            {/* Voice Button Right */}
                            <button
                                onClick={toggleListening}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                                    ${isListening
                                        ? 'bg-rose-500 text-white scale-110 animate-bounce'
                                        : 'bg-white text-slate-400 hover:text-rose-500 hover:scale-105 border-2 border-slate-100'
                                    }
                                `}
                                title={isListening ? "Detener" : "Dictar con voz"}
                            >
                                {isListening ? (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white/40 rounded-full animate-ping" />
                                        <Mic className="w-8 h-8 relative z-10" />
                                    </div>
                                ) : (
                                    <Mic className="w-8 h-8" />
                                )}
                            </button>
                        </div>

                        {/* Status Message for kids */}
                        {isListening && (
                            <div className="flex items-center gap-3 text-rose-500 font-black uppercase tracking-widest animate-pulse">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                                ¡Tico te está escuchando! Habla ahora...
                            </div>
                        )}

                        <div className="flex gap-4 w-full justify-center">
                            <Button
                                onClick={() => {
                                    ticoAudio.playClickSFX();
                                    if (isListening) stopListening();
                                    setSelectedType(null);
                                }}
                                variant="ghost"
                                className="py-8 px-8 rounded-[2rem] text-xl font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 uppercase tracking-widest"
                            >
                                <ArrowLeft className="w-6 h-6 mr-2" /> Atrás
                            </Button>

                            <Button
                                onClick={handleSubmit}
                                disabled={!input.trim() || isListening}
                                className="flex-1 max-w-md py-8 rounded-[2.5rem] text-2xl font-black uppercase tracking-widest bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 shadow-[0_15px_30px_rgba(251,113,133,0.4)] hover:shadow-[0_20px_40px_rgba(251,113,133,0.6)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                            >
                                <span className="flex items-center gap-3">
                                    {isListening ? "Escuchando..." : "Enviar"}
                                    {isListening ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                </span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
