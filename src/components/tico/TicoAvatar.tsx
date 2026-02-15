import React from 'react';
import { TICO_OUTFITS } from '../../services/ticoLogic';
import { TicoState } from '../../types';
import ticoLogo from '../../Mascota 1.svg';

interface TicoAvatarProps {
    ticoState: TicoState;
    isProcessing: boolean;
    isActiveMode: boolean; // True if generating something
}

export const TicoAvatar: React.FC<TicoAvatarProps> = ({ ticoState, isProcessing, isActiveMode }) => {
    const currentOutfit = TICO_OUTFITS.find(o => o.id === ticoState.current_outfit_id);

    // Video Paths
    const IDLE_VIDEO = "/tico/videos/tico_idle_animation.webm";
    const PECKING_VIDEO = "/tico/videos/tico_pecking_action.webm";
    const isBaseOutfit = !ticoState.current_outfit_id || ticoState.current_outfit_id === 'default';

    // Sprite Mapping (Fallback/Specific Outfits)
    const getSprite = () => {
        switch (ticoState.current_outfit_id) {
            case 'sci_astronaut': return "/tico/tico_astronauta_idle.png";
            case 'cre_painter': return "/tico/tico_artista_idle.png";
            case 'nat_explorer': return "/tico/Explorador.png";
            default: return "/tico/tico_base_idle.png";
        }
    };

    // Local state to manage the "Pecking" animation cycle
    // We want it to play AT LEAST once when triggered, even if processing ends early.
    // We also want it to stop after one loop even if processing is still true (unless we want continuous pecking? User said "play once").
    const [isPecking, setIsPecking] = React.useState(false);
    const [hasInteracted, setHasInteracted] = React.useState(false);

    // Trigger animation when processing starts
    React.useEffect(() => {
        if (isProcessing) {
            setIsPecking(true);
            setHasInteracted(true); // Once we start processing, we have interacted
        }
    }, [isProcessing]);

    // Also trigger interaction flag if isActiveMode (e.g. generating response)
    React.useEffect(() => {
        if (isActiveMode) {
            setHasInteracted(true);
        }
    }, [isActiveMode]);

    // LOGIC:
    // 1. If isPecking -> Show Pecking Video (One Shot)
    // 2. When Video Ends -> setIsPecking(false) -> Show Idle

    return (
        <div className="relative w-96 h-96 mx-auto flex items-center justify-center">
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
                        key="pecking-video" // Force re-mount on activation to restart from 0
                        src={PECKING_VIDEO}
                        autoPlay
                        muted
                        playsInline
                        onEnded={() => setIsPecking(false)}
                        className="w-80 h-80 object-cover drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)]"
                    />
                ) : (isBaseOutfit && hasInteracted) ? (
                    <video
                        src={IDLE_VIDEO}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-80 h-80 object-cover drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)]"
                    />
                ) : (
                    <img
                        src={ticoLogo} // Use the light SVG logo as the initial/fallback state
                        alt="Tico Avatar"
                        onClick={() => setHasInteracted(true)} // Can also trigger here manually
                        className="w-80 h-80 object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)] filter animate-breathing cursor-pointer"
                    />
                )}

                {/* Outfit Category Badge (Floating Bubble Style) - Hide during action */}
                {currentOutfit && !isProcessing && (
                    <div className="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.15)] border-4 border-white text-5xl animate-bounce-slow flex items-center justify-center w-24 h-24 z-20">
                        {currentOutfit.id.includes('sci') ? '🧪' :
                            currentOutfit.id.includes('cre') ? '🎨' :
                                currentOutfit.id.includes('hum') ? '📜' :
                                    currentOutfit.id.includes('nat') ? '🌿' : '✨'}
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
