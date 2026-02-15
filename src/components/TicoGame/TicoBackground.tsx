import React from 'react';

export const TicoBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-100">
            {/* Main Digital Nest Background */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{
                    backgroundImage: 'url("/tico/bg_nido_digital.jpg")',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* Soft Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />

            {/* Subtle Gradient to blend UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
        </div>
    );
};
