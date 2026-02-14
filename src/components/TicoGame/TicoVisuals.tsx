import React from 'react';
import { Sparkles } from 'lucide-react';

interface TicoVisualsProps {
    level: number;
    mood: 'happy' | 'neutral' | 'sad';
}

export function TicoVisuals({ level, mood }: TicoVisualsProps) {
    // Placeholder logic for visual changes based on level/mood
    // In a real scenario, this would swap SVGs or apply CSS classes

    const getEmoji = () => {
        if (mood === 'sad') return '😢';
        if (mood === 'happy') return '😄';
        return '😐';
    };

    return (
        <div className="relative flex items-center justify-center w-48 h-48 bg-blue-50 rounded-full border-4 border-white shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-200/50 opacity-50"></div>

            {/* Level Badge */}
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-lg z-20 shadow-sm transform rotate-12">
                Lvl {level}
            </div>

            {/* Character Placeholder (Replace with SVG) */}
            <div className="text-6xl transform transition-transform duration-500 hover:scale-110 cursor-pointer z-10 animate-bounce-slow">
                {getEmoji()}
            </div>

            {/* Simple ambient effect */}
            <Sparkles className="absolute bottom-4 left-4 w-6 h-6 text-yellow-400 animate-spin-slow opacity-70" />
        </div>
    );
}
