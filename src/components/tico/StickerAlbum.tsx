
import React, { useEffect, useState, useMemo } from 'react';
import { getStickers, Sticker } from '../../services/stickerService';
import { Loader2, Sparkles, Image as ImageIcon, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { ticoAudio } from '../../lib/audio/TicoAudioEngine';

interface StickerAlbumProps {
    groupId: string;
}

// 1. COMPONENTE DE MEMORIA: StickerItem optimizado
const StickerItem = React.memo(({ sticker, index }: { sticker: Sticker, index: number }) => {
    return (
        <div
            className="group relative aspect-square animate-in slide-in-from-bottom-4 fade-in duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Sticker Container */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-sm border-2 border-slate-100 group-hover:shadow-xl group-hover:scale-105 group-hover:-rotate-2 transition-all duration-300 flex items-center justify-center p-4 overflow-hidden">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* The Sticker Image - Optimized with Lazy Load and crossOrigin */}
                <img
                    src={sticker.sticker_url}
                    alt={sticker.resource_title}
                    className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500 filter hover:brightness-110 will-change-transform bg-white"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        console.error(`❌ Sticker failed to load: ${sticker.sticker_url}`);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-slate-100');
                    }}
                />

                {/* Fallback Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-[.bg-slate-100]:opacity-100 text-slate-300">
                    <ImageIcon className="w-12 h-12" />
                </div>

                {/* Badge/Label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center text-center">
                    <span className="text-xs font-black uppercase text-rose-500 tracking-widest leading-tight">
                        {sticker.resource_category}
                    </span>
                    <span className="text-sm font-bold text-slate-700 leading-tight line-clamp-2 w-full px-2">
                        {sticker.resource_title}
                    </span>
                </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 translate-y-full group-hover:translate-y-[-100%] transition-transform" />
        </div>
    );
});

StickerItem.displayName = 'StickerItem';

export const StickerAlbum: React.FC<StickerAlbumProps & { isActive?: boolean }> = ({ groupId, isActive }) => {
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [loading, setLoading] = useState(false); // Start false, will set true only when active
    const [isGenerating, setIsGenerating] = useState(false);
    const [projectInfo, setProjectInfo] = useState<{ nombre: string, clase: string } | null>(null);

    useEffect(() => {
        // Only load if the tab is actually active
        if (!isActive) return;

        let isMounted = true;
        const loadStickers = async () => {
            setLoading(true);
            try {
                const [stickerData, projectData] = await Promise.all([
                    getStickers(groupId),
                    supabase.from('proyectos').select('nombre, clase').eq('id', groupId).single()
                ]);

                if (isMounted) {
                    setStickers(stickerData);
                    if (projectData.data) {
                        setProjectInfo({
                            nombre: projectData.data.nombre,
                            clase: projectData.data.clase || ''
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading album data:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadStickers();
        return () => { isMounted = false; };
    }, [groupId, isActive]); // Depend on isActive

    // If not active, show nothing or a tiny placeholder
    if (!isActive && stickers.length === 0) return null;

    // 2. OPTIMIZACIÓN PDF: Evitar cargar todo a la vez si hay cientos
    const handleDownloadPDF = async () => {
        if (stickers.length === 0) return;

        setIsGenerating(true);
        const toastId = toast.loading("🎨 Preparando tu hoja de pegatinas...");

        try {
            // Importación dinámica de jsPDF para no cargar memoria innecesariamente
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            // Configurar fuentes básicas (reducen el peso del PDF)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.setTextColor(30, 41, 59);
            doc.text("Mi Álbum de TICO-AI", 105, 20, { align: "center" });

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            const subtitle = projectInfo
                ? `${projectInfo.nombre}${projectInfo.clase ? ` - ${projectInfo.clase}` : ''}`
                : "Colección de Pegatinas Mágicas";
            doc.text(subtitle, 105, 28, { align: "center" });

            const margin = 15;
            const stickerSize = 40;
            const gap = 8;
            const columns = 4;
            let x = margin;
            let y = 40;

            for (let i = 0; i < stickers.length; i++) {
                const sticker = stickers[i];
                try {
                    // Cargar imagen con timeout y cache limitado
                    const response = await fetch(sticker.sticker_url);
                    const blob = await response.blob();
                    const base64Img = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    doc.setDrawColor(203, 213, 225);
                    doc.setLineDashPattern([2, 1], 0);
                    doc.circle(x + stickerSize / 2, y + stickerSize / 2, stickerSize / 2 + 1);
                    doc.setLineDashPattern([], 0);

                    // Compresión JPEG para ahorrar memoria en el PDF
                    doc.addImage(base64Img, 'JPEG', x, y, stickerSize, stickerSize, undefined, 'FAST');

                    doc.setFontSize(7);
                    doc.setTextColor(148, 163, 184);
                    const title = sticker.resource_title.length > 25
                        ? sticker.resource_title.substring(0, 22) + "..."
                        : sticker.resource_title;
                    doc.text(title, x + stickerSize / 2, y + stickerSize + 4, { align: "center" });

                    if ((i + 1) % columns === 0) {
                        x = margin;
                        y += stickerSize + gap + 10;
                    } else {
                        x += stickerSize + gap;
                    }

                    if (y > 250 && i < stickers.length - 1) {
                        doc.addPage();
                        x = margin;
                        y = 20;
                    }
                } catch (e) {
                    console.error("Failed to add sticker to PDF:", sticker.resource_title, e);
                }
            }

            doc.save(`Tico_Stickers_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("✨ ¡Álbum descargado!", { id: toastId });
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("❌ Error al generar PDF", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-rose-400" />
                <p className="font-bold text-lg animate-pulse">Abriendo el álbum...</p>
            </div>
        );
    }

    if (stickers.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-48 h-48 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
                    <ImageIcon className="w-20 h-20 text-slate-300" />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-700 mb-2">¡El álbum está vacío!</h3>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">
                        Alimenta a Tico con libros, películas o canciones para conseguir pegatinas mágicas.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="bg-rose-100/50 px-4 py-2 rounded-2xl border border-rose-200">
                    <span className="text-rose-600 font-bold uppercase tracking-wider text-sm">
                        Colección: {stickers.length} pegatinas
                    </span>
                </div>

                <button
                    onClick={() => { ticoAudio.playClickSFX(); handleDownloadPDF(); }}
                    disabled={isGenerating}
                    className="flex items-center gap-3 px-6 py-2.5 bg-slate-800 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    {isGenerating ? "Generando..." : "Imprimir Álbum"}
                </button>
            </div>

            {/* Grid optimizado con renderizado perezoso */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 pb-20 overflow-y-auto custom-scrollbar p-1 md:p-2">
                {stickers.map((sticker, index) => (
                    <StickerItem key={sticker.id} sticker={sticker} index={index} />
                ))}
            </div>
        </div>
    );
};
