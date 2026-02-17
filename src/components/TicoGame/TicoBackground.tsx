import React from 'react';

interface TicoBackgroundProps {
    outfitId?: string | null;
}

export const TicoBackground: React.FC<TicoBackgroundProps> = ({ outfitId }) => {
    const isTech = outfitId === 'ana_tech';
    const backgroundImage = '/tico/bg_nido_server.jpg';

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-100">
            {/* Main Digital Nest Background */}
            <div
                className="absolute inset-0 bg-cover transition-all duration-1000"
                style={{
                    backgroundImage: `url("${backgroundImage}")`,
                    backgroundRepeat: 'repeat-x',
                    backgroundPosition: '175% center'
                }}
            />

            {/* Soft Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

            {/* Subtle Gradient to blend UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
        </div>
    );
};
