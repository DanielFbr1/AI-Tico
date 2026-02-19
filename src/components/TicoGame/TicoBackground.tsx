import React from 'react';

interface TicoBackgroundProps {
    outfitId?: string | null;
}

export const TicoBackground: React.FC<TicoBackgroundProps> = ({ outfitId }) => {
    const isTech = outfitId === 'ana_tech';
    const backgroundImage = '/tico/bg_nido_server.jpg';

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-100">
            {/* Main Digital Nest Background - Sharp and Clean */}
            <div
                className="absolute inset-0 bg-cover transition-all duration-1000"
                style={{
                    backgroundImage: `url("${backgroundImage}")`,
                    backgroundPosition: '175% center'
                }}
            />
        </div>
    );
};
