import React from 'react';
import { TICO_OUTFITS } from '../../services/ticoLogic';
import { TicoState } from '../../types';
import ticoLogo from '../../Mascota 1.svg';

interface TicoAvatarProps {
    ticoState: TicoState;
    isProcessing: boolean;
    isActiveMode: boolean; // True if generating something
    isResponding?: boolean; // True if the response bubble is visible
    onAnimationEnd?: () => void;
}

export const TicoAvatar: React.FC<TicoAvatarProps> = ({ ticoState, isProcessing, isActiveMode, isResponding, onAnimationEnd }) => {
    const currentOutfit = TICO_OUTFITS.find(o => o.id === ticoState.current_outfit_id);

    // Video Paths
    const isTech = ticoState.current_outfit_id === 'ana_tech';

    // Video Paths - Dynamic based on outfit
    const IDLE_VIDEO = isTech ? "/tico/tico_tech_idle.webm" : "/tico/videos/tico_idle_animation.webm";
    const PECKING_VIDEO = "/tico/tico_tech_pecking.webm"; // Restaurada versión original de 8s (sin fondo rosa)
    const isBaseOutfit = !ticoState.current_outfit_id || ticoState.current_outfit_id === 'default' || ticoState.current_outfit_id === '';
    const showIdleVideo = isTech; // Only show idle video for Tech outfit specifically

    // Sprite Mapping (Fallback/Specific Outfits)
    const getSprite = () => {
        switch (ticoState.current_outfit_id) {
            case 'sci_astronaut': return "/tico/tico_astronauta_idle.png";
            case 'cre_painter': return "/tico/tico_artista_idle.png";
            case 'nat_explorer': return "/tico/Explorador.png";
            case 'ana_tech': return "/tico/tico_tech_base.png";
            default: return "/tico/tico_tech_base.png";
        }
    };

    // Local state to manage the "Pecking" animation cycle
    const [isPecking, setIsPecking] = React.useState(false);

    // Trigger animation when processing starts
    React.useEffect(() => {
        if (isProcessing) {
            setIsPecking(true);
        } else {
            setIsPecking(false);
        }
    }, [isProcessing]);

    return (
        <div className="relative w-96 h-96 mx-auto flex items-center justify-center hover:scale-105 transition-transform duration-500">
            {/* Background Aura (Soft & Organic) */}
            <div className={`absolute inset-0 rounded-full blur-[80px] opacity-40 mix-blend-multiply transition-colors duration-1000
                ${currentOutfit?.category === 'VisualArts' ? 'bg-pink-400' :
                    currentOutfit?.category === 'Entertainment' ? 'bg-rose-400' :
                        currentOutfit?.category === 'Letters' ? 'bg-blue-400' :
                            currentOutfit?.category === 'Analysis' ? 'bg-emerald-400' : 'bg-rose-200'}
                ${isActiveMode || isProcessing ? 'animate-pulse-glow scale-150' : 'scale-110'}
            `} />

            {/* Main Avatar Container */}
            <div className={`relative z-10 transition-all duration-700 transform 
                ${isPecking ? 'scale-125' : 'scale-100'} 
                flex items-center justify-center
            `}>

                {isPecking ? (
                    <video
                        key="pecking-video"
                        src={PECKING_VIDEO}
                        autoPlay
                        loop={isProcessing}
                        muted
                        playsInline
                        onEnded={() => {
                            if (!isProcessing) {
                                setIsPecking(false);
                            }
                        }}
                        className="w-80 h-80 object-cover drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)]"
                    />
                ) : (isResponding || isActiveMode || showIdleVideo) ? (
                    <video
                        key="active-video-container"
                        src={(isResponding || isActiveMode) ? "/tico/tico_tech_idle.webm" : IDLE_VIDEO}
                        autoPlay
                        loop={!isResponding}
                        muted
                        playsInline
                        onEnded={() => {
                            if (isResponding && onAnimationEnd) {
                                onAnimationEnd();
                            }
                        }}
                        className={`w-80 h-80 object-cover drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)] transition-all duration-500 ${(isActiveMode || isResponding) ? 'animate-float scale-110 brightness-110' : ''}`}
                    />
                ) : (
                    <img
                        src={getSprite()}
                        alt="Tico Avatar"
                        className="w-80 h-80 object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)] filter animate-breathing cursor-pointer"
                    />
                )}

                {/* Outfit Category Badge (Floating Bubble Style) - Hide during action */}
                {currentOutfit && !isProcessing && (
                    <div className="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.15)] border-4 border-white text-5xl animate-bounce-slow flex items-center justify-center w-24 h-24 z-20">
                        {currentOutfit.id.includes('sci') ? '🧪' :
                            currentOutfit.id.includes('cre') ? '🎨' :
                                currentOutfit.id.includes('hum') ? '📜' :
                                    currentOutfit.id.includes('nat') ? '🌿' :
                                        currentOutfit.id.includes('tech') ? '💻' : '✨'}
                    </div>
                )}
            </div>

            {/* Status Text Bubble (Action State) */}
            {isProcessing && (
                <div className="absolute -bottom-8 bg-slate-900 text-white px-8 py-3 rounded-[2rem] shadow-2xl border-4 border-slate-800 animate-bounce duration-300 text-xl font-black tracking-widest uppercase z-30">
                    ⛏️ ¡Picando datos!
                </div>
            )}
        </div>
    );
};
