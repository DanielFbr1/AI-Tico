import { useState, useEffect, useCallback, useRef } from 'react';
import { TicoState } from '../types';
import { INITIAL_TICO_STATE } from '../services/ticoLogic';
import { supabase } from '../lib/supabase';

export function useTicoGame(contextId: string = 'default', contextType: 'project' | 'class' = 'project') {
    const storageKey = `tico-game-state-v3-${contextType}-${contextId}`;

    // Load state from local storage or use initial state
    const [state, setState] = useState<TicoState>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...INITIAL_TICO_STATE, ...parsed };
            }
            return INITIAL_TICO_STATE;
        } catch (e) {
            console.error("Error loading local Tico state:", e);
            return INITIAL_TICO_STATE;
        }
    });

    const isFirstRender = useRef(true);

    // FETCH FROM SUPABASE ON MOUNT
    useEffect(() => {
        if (!contextId || contextId === 'default') return;

        const fetchTicoState = async () => {
            try {
                let query;
                if (contextType === 'class') {
                    // Safety check: is contextId a valid UUID string?
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId);
                    if (!isUUID) {
                        console.warn(`⚠️ Invalid UUID for class context: "${contextId}". Skipping fetch from profesor_organizacion.`);
                        return;
                    }

                    // Fetch from profesor_organizacion
                    query = supabase
                        .from('profesor_organizacion')
                        .select('tico_state')
                        .eq('id', contextId)
                        .single();
                } else {
                    // Fetch from proyectos (default)
                    query = supabase
                        .from('proyectos')
                        .select('tico_state')
                        .eq('id', contextId)
                        .single();
                }

                const { data, error } = await query;

                if (error) {
                    console.warn(`Could not fetch Tico state from ${contextType} (maybe column missing?):`, error.message);
                    return;
                }

                if (data?.tico_state) {
                    console.log(`🎮 Syncing Tico state from Supabase (${contextType})...`);
                    const remoteState = { ...INITIAL_TICO_STATE, ...data.tico_state };
                    setState(remoteState);
                    localStorage.setItem(storageKey, JSON.stringify(remoteState));
                }
            } catch (e) {
                console.error("Error fetching Tico state:", e);
            }
        };

        fetchTicoState();
    }, [contextId, contextType, storageKey]);

    // SAVE TO LOCAL & DEBOUNCED SUPABASE
    useEffect(() => {
        // Skip first render save to avoid overwriting remote state with default local state
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Always save to local storage immediately
        localStorage.setItem(storageKey, JSON.stringify(state));

        if (!contextId || contextId === 'default') return;

        // Save to Supabase (Debounced)
        const timeoutId = setTimeout(async () => {
            try {
                let updateQuery;
                if (contextType === 'class') {
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contextId);
                    if (!isUUID) return; 

                    updateQuery = supabase
                        .from('profesor_organizacion')
                        .update({ tico_state: state })
                        .eq('id', contextId);
                } else {
                    updateQuery = supabase
                        .from('proyectos')
                        .update({ tico_state: state })
                        .eq('id', contextId);
                }

                await updateQuery;
            } catch (e) {
                console.error("Error saving Tico state to Supabase:", e);
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timeoutId);
    }, [state, contextId, contextType, storageKey]);

    const updateState = useCallback((newState: TicoState) => {
        setState(newState);
    }, []);

    const equipOutfit = useCallback((outfitId: string | null) => {
        setState(prev => ({
            ...prev,
            current_outfit_id: outfitId
        }));
    }, []);

    const reset = useCallback(async () => {
        setState(INITIAL_TICO_STATE);
        localStorage.removeItem(storageKey);
        if (contextId && contextId !== 'default') {
            const table = contextType === 'class' ? 'profesor_organizacion' : 'proyectos';
            await supabase
                .from(table)
                .update({ tico_state: INITIAL_TICO_STATE })
                .eq('id', contextId);
        }
    }, [contextId, contextType, storageKey]);

    return {
        state,
        updateState,
        equipOutfit,
        reset
    };
}
