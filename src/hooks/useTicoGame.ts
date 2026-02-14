import { useState, useEffect, useCallback } from 'react';

// v1.0.0 - Initial Logic for Tico Game

export interface TicoState {
    level: number;
    experience: number;
    maxExperience: number;
    mood: 'happy' | 'neutral' | 'sad';
    lastInteraction: number; // Timestamp
}

const INITIAL_STATE: TicoState = {
    level: 1,
    experience: 0,
    maxExperience: 100,
    mood: 'neutral',
    lastInteraction: Date.now(),
};

export function useTicoGame(contextId: string = 'default') {
    const storageKey = `tico-game-state-${contextId}`;

    // Load state from local storage or use initial state
    const [state, setState] = useState<TicoState>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : INITIAL_STATE;
        } catch (e) {
            console.error("Error loading Tico state:", e);
            return INITIAL_STATE;
        }
    });

    // Save state on change
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(state));
    }, [state, storageKey]);

    // Reload state if contextId changes (in case component is not re-mounted)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setState(JSON.parse(saved));
            } else {
                setState(INITIAL_STATE);
            }
        } catch (e) {
            console.error("Error reloading Tico state:", e);
            setState(INITIAL_STATE);
        }
    }, [contextId, storageKey]);

    // Mood decay logic (simplified for demo)
    useEffect(() => {
        const interval = setInterval(() => {
            const timeDiff = Date.now() - state.lastInteraction;
            // If more than 24 hours (mocked as 1 minute for demo purposes if needed, but sticking to logic)
            // Let's say mood decays if no interaction for 1 hour
            if (timeDiff > 3600000 && state.mood !== 'sad') {
                setState(prev => ({ ...prev, mood: 'sad' }));
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [state.lastInteraction, state.mood]);

    const gainExperience = useCallback((amount: number) => {
        setState(prev => {
            let newExp = prev.experience + amount;
            let newLevel = prev.level;
            let newMaxExp = prev.maxExperience;

            if (newExp >= newMaxExp) {
                newExp -= newMaxExp;
                newLevel += 1;
                newMaxExp = Math.floor(newMaxExp * 1.5); // Increase difficulty
            }

            return {
                ...prev,
                level: newLevel,
                experience: newExp,
                maxExperience: newMaxExp,
                mood: 'happy', // Interaction improves mood
                lastInteraction: Date.now(),
            };
        });
    }, []);

    const feed = () => gainExperience(10);
    const play = () => gainExperience(15);
    const educate = () => gainExperience(20);

    const reset = () => setState(INITIAL_STATE);

    return {
        state,
        feed,
        play,
        educate,
        reset
    };
}
