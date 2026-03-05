import React, { useMemo } from 'react';

interface LivingTreeProps {
    progress: number; // 0 to 100
    health?: number; // 0 to 100
    size?: number;
    isDark?: boolean;
    showLabels?: boolean;
    variant?: 'nexus' | 'satellite';
}

/**
 * LivingTree Component
 * Flexible visualization for project/group progress
 * Variants: 
 * - nexus: A cyber-nature core (Default for Global/Project)
 * - satellite: A technological satellite (Best for Groups)
 */
export function LivingTree({
    progress,
    health = 100,
    size = 300,
    isDark = false,
    showLabels = true,
    variant = 'nexus'
}: LivingTreeProps) {
    const isCritical = health < 30;

    // Shared Palette
    const colors = {
        core: isCritical ? '#ef4444' : (isDark ? '#22d3ee' : '#0891b2'),
        accent: isCritical ? '#f87171' : (isDark ? '#818cf8' : '#4f46e5'),
        energy: isCritical ? '#fee2e2' : (isDark ? '#cffafe' : '#e0f2fe'),
        circuit: isDark ? '#1e293b' : '#e2e8f0',
        nature: isDark ? '#4ade80' : '#22c55e',
        metal: isDark ? '#475569' : '#94a3b8'
    };

    const particles = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            x: 20 + Math.random() * 160,
            y: 20 + Math.random() * 160,
            size: 0.5 + Math.random() * 1.5,
            delay: Math.random() * 3,
            duration: 2 + Math.random() * 3
        }));
    }, []);

    // ==========================================
    // VARIANTE: BATERÍA DE ENERGÍA (SATELLITE/GRUPOS)
    // ==========================================
    if (variant === 'satellite') {
        // Cálculo del llenado de la batería
        const fillHeight = (progress / 100) * 80; // Altura máxima del líquido es 80
        const isFull = progress >= 100;

        return (
            <div className="flex items-center justify-center relative select-none" style={{ width: size, height: size }}>
                <svg viewBox="0 0 200 200" width="100%" height="100%" className="overflow-visible">
                    <defs>
                        <filter id="batteryGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation={isFull ? "4" : "2"} result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="energyLiquid" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#93c5fd" />
                        </linearGradient>
                        <linearGradient id="energyLiquidFull" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#6ee7b7" />
                        </linearGradient>
                        <linearGradient id="glassReflect" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="20%" stopColor="rgba(255,255,255,0)" />
                            <stop offset="80%" stopColor="rgba(255,255,255,0)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                        </linearGradient>
                    </defs>

                    {/* Partículas de fondo / Estrellas perezosas */}
                    <g opacity="0.4">
                        {particles.map((p, i) => (
                            <circle
                                key={`star-${i}`}
                                cx={p.x}
                                cy={p.y}
                                r={p.size}
                                fill="#bae6fd"
                                className="animate-pulse"
                                style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
                            />
                        ))}
                    </g>

                    <g transform="translate(100, 100)">
                        {/* Aura de la batería cuando está al 100% */}
                        {isFull && (
                            <circle cx="0" cy="0" r="60" fill="#10b981" opacity="0.15" filter="url(#batteryGlow)" className="animate-pulse" />
                        )}

                        {/* Top Cap (Polo Positivo) */}
                        <path d="M-15 -60 L15 -60 L15 -50 L-15 -50 Z" fill={colors.metal} />
                        <path d="M-8 -65 L8 -65 L8 -60 L-8 -60 Z" fill={colors.circuit} />
                        {isFull && <circle cx="0" cy="-62.5" r="2" fill="#10b981" filter="url(#batteryGlow)" className="animate-pulse" />}

                        {/* Cuerpo de cristal exterior */}
                        <rect x="-30" y="-50" width="60" height="100" rx="8" fill="rgba(15, 23, 42, 0.4)" stroke={colors.metal} strokeWidth="2" />

                        {/* Marcas de medición laterales */}
                        <g stroke={colors.circuit} strokeWidth="1" opacity="0.5">
                            <line x1="-30" y1="-30" x2="-25" y2="-30" />
                            <line x1="-30" y1="-10" x2="-25" y2="-10" />
                            <line x1="-30" y1="10" x2="-25" y2="10" />
                            <line x1="-30" y1="30" x2="-25" y2="30" />
                        </g>

                        {/* LÍQUIDO DE ENERGÍA (Mascara para el llenado) */}
                        {progress > 0 && (
                            <g filter="url(#batteryGlow)">
                                <clipPath id="energyClip">
                                    <rect x="-26" y={46 - fillHeight} width="52" height={fillHeight} rx="4" />
                                </clipPath>

                                <rect
                                    x="-26" y="-46" width="52" height="92" rx="4"
                                    fill={isFull ? "url(#energyLiquidFull)" : "url(#energyLiquid)"}
                                    clipPath="url(#energyClip)"
                                    className="transition-all duration-1000 ease-out"
                                />

                                {/* Burbujitas subiendo si está cargando */}
                                {!isFull && progress > 5 && (
                                    <g clipPath="url(#energyClip)" opacity="0.6">
                                        <circle cx="-10" cy="40" r="1.5" fill="white" className="animate-[bounce_2s_infinite]" />
                                        <circle cx="5" cy="40" r="2" fill="white" className="animate-[bounce_1.5s_infinite_0.5s]" />
                                        <circle cx="15" cy="40" r="1" fill="white" className="animate-[bounce_2.5s_infinite_1s]" />
                                    </g>
                                )}

                                {/* Rayo Central Brillantito al 100% */}
                                {isFull && (
                                    <path
                                        d="M-4 -20 L8 -5 L-2 0 L6 20 L-8 5 L2 0 Z"
                                        fill="white"
                                        opacity="0.8"
                                        className="animate-pulse"
                                        transform="scale(0.8) translate(2, 5)"
                                    />
                                )}
                            </g>
                        )}

                        {/* Reflejo de cristal curvo */}
                        <rect x="-30" y="-50" width="60" height="100" rx="8" fill="url(#glassReflect)" pointerEvents="none" />

                        {/* Bottom Cap (Polo Negativo) */}
                        <path d="M-35 50 L35 50 L30 60 L-30 60 Z" fill={colors.metal} />

                        {/* Conectores si está al 100% */}
                        {isFull && (
                            <g stroke="#10b981" strokeWidth="2" strokeDasharray="2 4" opacity="0.8" className="animate-[spin_4s_linear_infinite_reverse]" style={{ transformOrigin: '0 55px' }}>
                                <line x1="-40" y1="55" x2="-20" y2="55" />
                                <line x1="20" y1="55" x2="40" y2="55" />
                            </g>
                        )}
                    </g>
                </svg>
            </div>
        );
    }

    // ==========================================
    // VARIANTE: COHETE GLOBAL (NEXUS/GLOBAL)
    // ==========================================
    const isLaunched = progress >= 100;
    const isBuilding = progress < 30;
    const isFueling = progress >= 30 && progress < 70;
    const isIgniting = progress >= 70 && progress < 100;

    // Altura del suelo para el despegue
    const rocketY = isLaunched ? -60 : 0;
    // Temblores pre-lanzamiento
    const rocketShake = isIgniting ? "animate-[shake_0.5s_ease-in-out_infinite]" : "";

    return (
        <div className="flex items-center justify-center relative select-none" style={{ width: size, height: size }}>
            <svg viewBox="0 0 200 200" width="100%" height="100%" className="overflow-visible">
                <defs>
                    <filter id="rocketGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="50%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id="rocketWindow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                    <linearGradient id="fireCol" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="40%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Cielo / Espacio - Las estrellas bajan si despegamos */}
                <g className={`transition-transform duration-[3s] ease-in-out ${isLaunched ? 'translate-y-[40px]' : ''}`}>
                    {particles.map((p, i) => (
                        <circle
                            key={`star-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={p.size}
                            fill={isLaunched ? "#fff" : "#94a3b8"}
                            className="animate-pulse"
                            style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
                        />
                    ))}
                    {isLaunched && (
                        <g opacity="0.3">
                            <circle cx="150" cy="40" r="15" fill="#fef08a" filter="url(#rocketGlow)" />
                            <circle cx="40" cy="80" r="8" fill="#e2e8f0" />
                        </g>
                    )}
                </g>

                <g transform={`translate(100, 100)`}>

                    {/* Plataforma de Lanzamiento (se queda en el suelo) */}
                    <g transform="translate(0, 50)" className={`transition-opacity duration-1000 ${isLaunched ? 'opacity-30 translate-y-20' : 'opacity-100'}`}>
                        <path d="M-40 0 L40 0 L50 15 L-50 15 Z" fill="#334155" />
                        <rect x="-30" y="-10" width="60" height="10" fill="#475569" />
                        {/* Brazos de sujeción (se abren al 70%) */}
                        <g className={`transition-transform duration-1000 origin-bottom ${progress >= 70 ? '-rotate-45 -translate-x-4' : ''}`}>
                            <path d="M-30 -10 L-30 -50 L-15 -50 L-15 -45 L-25 -45 L-25 -10 Z" fill="#64748b" />
                        </g>
                        <g className={`transition-transform duration-1000 origin-bottom ${progress >= 70 ? 'rotate-45 translate-x-4' : ''}`}>
                            <path d="M30 -10 L30 -50 L15 -50 L15 -45 L25 -45 L25 -10 Z" fill="#64748b" />
                        </g>
                    </g>

                    {/* GRUPO PRINCIPAL DEL COHETE QUE SE MUEVE */}
                    <g
                        className={`transition-all duration-[3s] ease-in-out ${rocketShake}`}
                        style={{ transform: `translateY(${rocketY}px)` }}
                    >

                        {/* ESTADO 1: Planos / Construcción (0-30%) */}
                        {isBuilding && (
                            <g stroke={colors.accent} strokeWidth="1" fill="none" opacity="0.8" strokeDasharray="3 3">
                                {/* Silueta Blueprint */}
                                <path d="M0 -40 Q15 -20 15 10 L15 40 L-15 40 L-15 10 Q-15 -20 0 -40 Z" />
                                <circle cx="0" cy="0" r="6" />
                                <path d="M-15 40 L-25 55 L -15 45 Z" />
                                <path d="M15 40 L25 55 L 15 45 Z" />
                                <line x1="-15" y1="10" x2="15" y2="10" />
                                <line x1="-15" y1="25" x2="15" y2="25" />
                                {/* Piezas subiendo (simulación de construcción) */}
                                <rect x="-5" y="40" width="10" height="5" fill={colors.accent} opacity="0.5" className="animate-[bounce_2s_infinite]" />
                            </g>
                        )}

                        {/* ESTADO >= 30%: Cohete Ensamblado */}
                        {!isBuilding && (
                            <g className="animate-in fade-in duration-500">
                                {/* Fuego principal si ignición o lanzado */}
                                {(isIgniting || isLaunched) && (
                                    <g filter="url(#rocketGlow)">
                                        <path d="M-10 40 Q0 90 10 40 Z" fill="url(#fireCol)" className="animate-[pulse_0.1s_ease-in-out_infinite]" />
                                        <path d="M-6 40 Q0 70 6 40 Z" fill="#ffffff" className="animate-[pulse_0.15s_ease-in-out_infinite]" />
                                        {/* Humo lateral en ignición */}
                                        {isIgniting && (
                                            <g opacity="0.5" fill="#cbd5e1">
                                                <circle cx="-25" cy="45" r="8" className="animate-[ping_1.5s_infinite]" />
                                                <circle cx="25" cy="45" r="8" className="animate-[ping_1.5s_infinite_0.5s]" />
                                            </g>
                                        )}
                                        {/* Rastro enorme si lanzado */}
                                        {isLaunched && (
                                            <path d="M-15 40 Q0 150 15 40 Z" fill="url(#fireCol)" opacity="0.6" className="animate-[pulse_0.2s_ease-in-out_infinite]" />
                                        )}
                                    </g>
                                )}

                                {/* Aletas Laterales e Inferiores */}
                                <path d="M-15 20 Q-25 35 -25 45 L-15 35 Z" fill="#ef4444" />
                                <path d="M15 20 Q25 35 25 45 L15 35 Z" fill="#ef4444" />
                                <path d="M-5 40 L0 50 L5 40 Z" fill="#b91c1c" />

                                {/* Cuerpo Principal */}
                                <path d="M0 -40 Q15 -20 15 10 L15 40 L-15 40 L-15 10 Q-15 -20 0 -40 Z" fill="url(#rocketBody)" />

                                {/* Punta del cohete roja */}
                                <path d="M0 -40 Q8 -25 8 -15 L-8 -15 Q-8 -25 0 -40 Z" fill="#ef4444" />

                                {/* Ventana */}
                                <circle cx="0" cy="0" r="8" fill="#e2e8f0" />
                                <circle cx="0" cy="0" r="6" fill="url(#rocketWindow)" />
                                {/* Brillo Ventana */}
                                <path d="M-4 -4 Q0 -6 4 -4 Q2 0 -4 -4 Z" fill="rgba(255,255,255,0.4)" />

                                {/* Líneas de separación */}
                                <line x1="-14" y1="15" x2="14" y2="15" stroke="#94a3b8" strokeWidth="1" />
                                <line x1="-15" y1="30" x2="15" y2="30" stroke="#94a3b8" strokeWidth="1" />

                                {/* Luces parpadeando en modo ignición o lanzado */}
                                {(isIgniting || isLaunched) && (
                                    <>
                                        <circle cx="-10" cy="22" r="1.5" fill="#fbbf24" filter="url(#rocketGlow)" className="animate-[pulse_0.5s_infinite]" />
                                        <circle cx="10" cy="22" r="1.5" fill="#ef4444" filter="url(#rocketGlow)" className="animate-[pulse_0.5s_infinite_0.2s]" />
                                    </>
                                )}

                                {/* Manguera de repostaje (se desconecta al 70%) */}
                                {isFueling && (
                                    <path d="M14 22 Q40 22 50 50" fill="none" stroke="#475569" strokeWidth="3" className="animate-in slide-in-from-right duration-500" />
                                )}
                            </g>
                        )}
                    </g>
                </g>
            </svg>
        </div>
    );
}

export const getTreeStatus = (health: number) => {
    if (health >= 80) return "Estable";
    if (health >= 50) return "Sincronizando";
    if (health >= 20) return "Fallo de Sistema";
    return "Crítico";
};
