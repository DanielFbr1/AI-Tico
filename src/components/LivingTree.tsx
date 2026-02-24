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

    // Common calculation
    const coreSize = 15 + (progress / 5);
    const nodesCount = Math.floor(progress / 10);

    const particles = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            angle: (i * 360) / 12,
            distance: 40 + Math.random() * 40,
            delay: Math.random() * 5,
            size: 1 + Math.random() * 2
        }));
    }, []);

    // RENDER SATELLITE VARIANT
    if (variant === 'satellite') {
        const wingWidth = 10 + (progress / 2); // Wings grow with progress
        return (
            <div className="flex items-center justify-center relative select-none" style={{ width: size, height: size }}>
                <svg viewBox="0 0 200 200" width="100%" height="100%" className="overflow-visible">
                    <defs>
                        <filter id="satGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="solarPanel" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e3a8a" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1e3a8a" />
                        </linearGradient>
                        <linearGradient id="solarReflect" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="10%" stopColor="rgba(255,255,255,0)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                        <linearGradient id="scannerBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={colors.energy} stopOpacity="0.4" />
                            <stop offset="50%" stopColor={colors.energy} stopOpacity="0.1" />
                            <stop offset="100%" stopColor={colors.energy} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Deep Space Background / Data points */}
                    <g opacity="0.4">
                        {particles.map((p, i) => (
                            <circle
                                key={`star-${i}`}
                                cx={100 + Math.cos(p.angle * 2) * 80}
                                cy={100 + Math.sin(p.angle * 3) * 80}
                                r={0.5 + Math.random()}
                                fill="#bae6fd"
                                className="animate-pulse"
                                style={{ animationDelay: `${p.delay}s`, animationDuration: `${2 + Math.random() * 3}s` }}
                            />
                        ))}
                    </g>

                    {/* Orbit lines */}
                    <ellipse cx="100" cy="100" rx="85" ry="35" fill="none" stroke={colors.circuit} strokeWidth="0.5" transform="rotate(-15 100 100)" strokeDasharray="4 4" opacity="0.5" />
                    <ellipse cx="100" cy="100" rx="85" ry="35" fill="none" stroke={colors.accent} strokeWidth="1.5" transform="rotate(-15 100 100)" strokeDasharray={(progress / 100) * 534 + " 534"} opacity="0.3" className="transition-all duration-1000" />


                    {/* Satellite Body Container */}
                    <g transform="translate(100, 100) rotate(-15)" filter="url(#satGlow)">

                        {/* Wings / Solar Panels */}
                        <g className="transition-all duration-1000">
                            {/* Left Wing */}
                            <g transform={`translate(${-wingWidth - 16}, -10)`} opacity={progress > 10 ? 1 : 0.3}>
                                <rect x="0" y="0" width={wingWidth} height="20" rx="2" fill="url(#solarPanel)" stroke={colors.accent} strokeWidth="0.5" />
                                <rect x="0" y="0" width={wingWidth} height="20" rx="2" fill="url(#solarReflect)" />
                                {/* Panel Grid */}
                                {progress > 30 && (
                                    <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5">
                                        <line x1="0" y1="10" x2={wingWidth} y2="10" />
                                        <line x1={wingWidth / 3} y1="0" x2={wingWidth / 3} y2="20" />
                                        <line x1={wingWidth * 0.66} y1="0" x2={wingWidth * 0.66} y2="20" />
                                    </g>
                                )}
                            </g>

                            {/* Right Wing */}
                            <g transform={`translate(16, -10)`} opacity={progress > 10 ? 1 : 0.3}>
                                <rect x="0" y="0" width={wingWidth} height="20" rx="2" fill="url(#solarPanel)" stroke={colors.accent} strokeWidth="0.5" />
                                <rect x="0" y="0" width={wingWidth} height="20" rx="2" fill="url(#solarReflect)" />
                                {/* Panel Grid */}
                                {progress > 30 && (
                                    <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5">
                                        <line x1="0" y1="10" x2={wingWidth} y2="10" />
                                        <line x1={wingWidth / 3} y1="0" x2={wingWidth / 3} y2="20" />
                                        <line x1={wingWidth * 0.66} y1="0" x2={wingWidth * 0.66} y2="20" />
                                    </g>
                                )}
                            </g>
                        </g>

                        {/* Central Hub Connectors */}
                        <rect x="-20" y="-3" width="40" height="6" fill={colors.metal} />

                        {/* Main Body Structure */}
                        <rect x="-14" y="-18" width="28" height="36" rx="4" fill="#334155" stroke={colors.metal} strokeWidth="1" />
                        <rect x="-10" y="-14" width="20" height="28" rx="2" fill="#1e293b" />

                        {/* Core Status indicator */}
                        <circle cx="0" cy="0" r="4" fill={colors.core} className={progress > 0 ? "animate-pulse" : ""} />
                        <circle cx="0" cy="0" r="6" fill="none" stroke={colors.core} strokeWidth="0.5" opacity="0.5" />

                        {/* Bottom Engine / Thruster */}
                        <path d="M-8,18 L8,18 L10,24 L-10,24 Z" fill={colors.metal} />
                        {progress > 5 && (
                            <circle cx="0" cy="25" r="3" fill={colors.accent} opacity="0.6" filter="url(#satGlow)">
                                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.5s" repeatCount="indefinite" />
                            </circle>
                        )}

                        {/* Antenna System (grows at 50%) */}
                        {progress > 50 && (
                            <g className="transition-all duration-1000 ease-out">
                                <line x1="0" y1="-18" x2="0" y2="-38" stroke={colors.metal} strokeWidth="2" />
                                <line x1="-5" y1="-28" x2="5" y2="-28" stroke={colors.metal} strokeWidth="1" />
                                <line x1="-3" y1="-33" x2="3" y2="-33" stroke={colors.metal} strokeWidth="1" />
                                {/* Beacons */}
                                <circle cx="0" cy="-38" r="2" fill="#ef4444">
                                    <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
                                </circle>
                            </g>
                        )}

                        {/* Advanced Scanner Beam (100%) */}
                        {progress >= 100 && (
                            <g className="animate-in fade-in zoom-in duration-1000">
                                <path d="M-10,24 L10,24 L50,110 L-50,110 Z" fill="url(#scannerBeam)" className="origin-top animate-[pulse_3s_ease-in-out_indefinite]" />
                                {/* Scanning line */}
                                <line x1="-40" y1="80" x2="40" y2="80" stroke={colors.energy} strokeWidth="1" opacity="0.6">
                                    <animate attributeName="y1" values="30;100;30" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="y2" values="30;100;30" dur="2s" repeatCount="indefinite" />
                                </line>
                            </g>
                        )}
                    </g>

                    {/* Floating Tech Debris / Fragments */}
                    <g className="transition-all duration-1000">
                        {progress > 80 && particles.slice(0, 3).map((p, i) => (
                            <rect
                                key={`debris-${i}`}
                                x={100 + Math.cos((p.angle + progress) * Math.PI / 180) * (30 + p.distance / 4)}
                                y={100 + Math.sin((p.angle + progress) * Math.PI / 180) * (50 + p.distance / 4)}
                                width={p.size * 2} height={p.size * 2}
                                fill={colors.metal}
                                opacity="0.6"
                                transform={`rotate(${p.angle * 5} ${100 + Math.cos((p.angle + progress) * Math.PI / 180) * (30 + p.distance / 4)} ${100 + Math.sin((p.angle + progress) * Math.PI / 180) * (50 + p.distance / 4)})`}
                            />
                        ))}
                    </g>

                </svg>

                {/* Labels removed to avoid duplication */}
            </div>
        );
    }

    // RENDER NEXUS VARIANT (Default)
    return (
        <div
            className="flex items-center justify-center relative select-none"
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 200 200"
                width="100%"
                height="100%"
                className="overflow-visible"
            >
                <defs>
                    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={colors.core} stopOpacity="0.8" />
                        <stop offset="40%" stopColor={colors.accent} stopOpacity="0.3" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="centerDiamond" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                        <stop offset="50%" stopColor={colors.energy} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={colors.core} stopOpacity="0.8" />
                    </radialGradient>

                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    <filter id="intenseGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    <pattern id="techGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke={colors.circuit} strokeWidth="0.5" opacity="0.3" />
                    </pattern>
                </defs>

                {/* Holographic Background Grid */}
                <circle cx="100" cy="100" r="95" fill="url(#techGrid)" opacity={progress > 10 ? 0.5 : 0.1} className="transition-opacity duration-1000" />

                {/* Base Platform / Container Rings */}
                <g opacity={0.3 + (progress / 200)}>
                    <circle cx="100" cy="100" r="90" fill="none" stroke={colors.circuit} strokeWidth="1" strokeDasharray="1 6" className="animate-[spin_40s_linear_infinite_reverse]" />
                    <circle cx="100" cy="100" r="85" fill="none" stroke={colors.circuit} strokeWidth="2" strokeDasharray="15 30 5 30" opacity="0.5" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke={colors.circuit} strokeWidth="0.5" />

                    {/* Crosshairs */}
                    <path d="M100 5 L100 195 M5 100 L195 100" stroke={colors.circuit} strokeWidth="0.5" strokeDasharray="2 4" />

                    {/* Angle markers */}
                    <path d="M30 30 L45 45 M170 170 L155 155 M170 30 L155 45 M30 170 L45 155" stroke={colors.circuit} strokeWidth="1" opacity="0.5" />
                </g>

                {/* Intense Background Glow */}
                <circle
                    cx="100"
                    cy="100"
                    r={35 + progress / 1.5}
                    fill="url(#coreGlow)"
                    filter="url(#intenseGlow)"
                    className="animate-pulse"
                />

                {/* Orbiting Tech Rings */}
                <g style={{ transformOrigin: 'center' }} className="transition-all duration-1000">
                    {progress > 20 && (
                        <circle
                            cx="100" cy="100" r="45"
                            fill="none"
                            stroke={colors.accent}
                            strokeWidth="2"
                            strokeDasharray="10 10 30 10 5 20"
                            className="animate-[spin_10s_linear_infinite]"
                            filter="url(#neonGlow)"
                            opacity="0.8"
                        />
                    )}
                    {progress > 50 && (
                        <circle
                            cx="100" cy="100" r="55"
                            fill="none"
                            stroke={colors.energy}
                            strokeWidth="1"
                            strokeDasharray="40 100"
                            className="animate-[spin_15s_linear_infinite_reverse]"
                            opacity="0.6"
                        />
                    )}
                    {progress > 80 && (
                        <g className="animate-[spin_25s_linear_infinite]">
                            <circle
                                cx="100" cy="100" r="70"
                                fill="none"
                                stroke={colors.nature}
                                strokeWidth="3"
                                strokeDasharray="2 40"
                                filter="url(#neonGlow)"
                                opacity="0.6"
                            />
                            {/* Data packets travelling on outer ring */}
                            <circle cx="100" cy="30" r="3" fill="#fff" filter="url(#neonGlow)" />
                            <circle cx="30" cy="100" r="2" fill={colors.nature} />
                        </g>
                    )}
                </g>

                {/* Nexus Core - Complex Multi-layered */}
                <g filter="url(#neonGlow)" className="transition-all duration-1000 ease-in-out" style={{ transformOrigin: 'center' }}>
                    {/* Outer Crystal Aura */}
                    <polygon
                        points={`100,${100 - coreSize * 1.2} ${100 + coreSize},100 100,${100 + coreSize * 1.2} ${100 - coreSize},100`}
                        fill="none"
                        stroke={colors.core}
                        strokeWidth="1"
                        className="animate-[spin_8s_linear_infinite]"
                        style={{ transformOrigin: '100px 100px' }}
                        opacity="0.8"
                    />

                    {/* Inner Solid Crystal */}
                    <path
                        d={`M100 ${100 - coreSize} L${100 + coreSize * 0.86} ${100 - coreSize / 2} L${100 + coreSize * 0.86} ${100 + coreSize / 2} L100 ${100 + coreSize} L${100 - coreSize * 0.86} ${100 + coreSize / 2} L${100 - coreSize * 0.86} ${100 - coreSize / 2} Z`}
                        fill="url(#centerDiamond)"
                        className="animate-[spin_12s_linear_infinite_reverse]"
                        style={{ transformOrigin: '100px 100px' }}
                    />

                    {/* Core Core (Brightest) */}
                    <circle cx="100" cy="100" r={coreSize / 2.5} fill="#ffffff" filter="url(#intenseGlow)" />
                </g>

                {/* Connected Nodes - Neural Network Effect */}
                <g>
                    {particles.slice(0, nodesCount).map((p, i) => {
                        const targetX = 100 + Math.cos(p.angle * Math.PI / 180) * p.distance;
                        const targetY = 100 + Math.sin(p.angle * Math.PI / 180) * p.distance;
                        return (
                            <g key={i} className="animate-in fade-in zoom-in duration-1000">
                                {/* Connection line */}
                                <line
                                    x1="100" y1="100"
                                    x2={targetX}
                                    y2={targetY}
                                    stroke={colors.core}
                                    strokeWidth={progress > 80 ? "1.5" : "0.5"}
                                    opacity={progress > 80 ? "0.6" : "0.3"}
                                    strokeDasharray="2 2"
                                >
                                    {progress > 50 && (
                                        <animate attributeName="stroke-dashoffset" from="10" to="0" dur="2s" repeatCount="indefinite" />
                                    )}
                                </line>
                                {/* Node Hub */}
                                <circle
                                    cx={targetX}
                                    cy={targetY}
                                    r={p.size + (progress > 90 ? 2 : 1)}
                                    fill={i % 3 === 0 ? colors.accent : (i % 2 === 0 ? colors.core : colors.nature)}
                                    filter="url(#neonGlow)"
                                    className="animate-pulse"
                                    style={{ animationDelay: `${p.delay}s`, animationDuration: `${2 + Math.random()}s` }}
                                />
                                {/* Node data ring */}
                                {progress > 60 && i % 2 === 0 && (
                                    <circle cx={targetX} cy={targetY} r={p.size + 4} fill="none" stroke={colors.energy} strokeWidth="0.5" opacity="0.5" className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_indefinite]" style={{ animationDelay: `${p.delay + 0.5}s` }} />
                                )}
                            </g>
                        );
                    })}
                </g>

                {/* Final Evolution Details - 100% Completion */}
                {progress >= 100 && (
                    <g className="animate-in fade-in duration-1000">
                        {/* Outer containment field */}
                        <circle cx="100" cy="100" r="82" fill="none" stroke={colors.energy} strokeWidth="1" strokeDasharray="1 10" filter="url(#neonGlow)" className="animate-[spin_20s_linear_infinite]" />

                        {/* Status brackets */}
                        <path d="M75 160 L70 160 L70 155 M125 160 L130 160 L130 155 M75 40 L70 40 L70 45 M125 40 L130 40 L130 45" stroke={colors.energy} strokeWidth="1.5" fill="none" opacity="0.8" />

                        {/* Status text background */}
                        <rect x="75" y="145" width="50" height="12" fill={colors.circuit} opacity="0.8" rx="2" />
                        <text x="100" y="153" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="900" style={{ letterSpacing: '2px' }} className="animate-pulse">ONLINE</text>
                    </g>
                )}
            </svg>

            {/* Labels removed to avoid duplication */}
        </div>
    );
}

export const getTreeStatus = (health: number) => {
    if (health >= 80) return "Estable";
    if (health >= 50) return "Sincronizando";
    if (health >= 20) return "Fallo de Sistema";
    return "Crítico";
};
