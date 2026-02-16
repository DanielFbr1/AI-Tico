import { useState, useEffect, useCallback } from 'react';
import { TicoState } from '../types';
import { INITIAL_TICO_STATE } from '../services/ticoLogic';

export function useTicoGame(contextId: string = 'default') {
    const storageKey = `tico-game-state-v3-${contextId}`;

    // Load state from local storage or use initial state
    const [state, setState] = useState<TicoState>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with initial state to ensure new fields exists if version changed
                return { ...INITIAL_TICO_STATE, ...parsed };
            }
            return INITIAL_TICO_STATE;
        } catch (e) {
            console.error("Error loading Tico state:", e);
            return INITIAL_TICO_STATE;
        }
    });

    // Save state on change
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(state));
    }, [state, storageKey]);

    const updateState = useCallback((newState: TicoState) => {
        setState(newState);
    }, []);

    const equipOutfit = useCallback((outfitId: string | null) => {
        setState(prev => ({
            ...prev,
            current_outfit_id: outfitId
        }));
    }, []);

    const reset = useCallback(() => {
        setState(INITIAL_TICO_STATE);
        localStorage.removeItem(storageKey);
    }, [storageKey]);

    return {
        state,
        updateState,
        equipOutfit,
        reset
    };
}
