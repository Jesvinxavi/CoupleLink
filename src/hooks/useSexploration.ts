import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCoupleData } from '@/hooks/useCoupleData';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface SexplorationData {
    sexCount: number;
    completedPositions: string[];
    loading: boolean;
    incrementSexCount: () => Promise<void>;
    decrementSexCount: () => Promise<void>;
    togglePositionComplete: (positionId: string) => Promise<void>;
    isPositionCompleted: (positionId: string) => boolean;
}

// Type assertion for tables that don't exist in generated types yet
// Once the migration runs and types are regenerated, this can be removed
const db = supabase as any;

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useSexploration(): SexplorationData {
    const { couple } = useCoupleData();
    const [sexCount, setSexCount] = useState(0);
    const [completedPositions, setCompletedPositions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!couple?.id) return;

        try {
            setLoading(true);

            // Fetch sex counter
            const { data: counterData, error: counterError } = await db
                .from('sex_counter')
                .select('count')
                .eq('couple_id', couple.id)
                .limit(1)
                .maybeSingle();

            if (counterError) {
                logger.error('useSexploration', 'Error fetching sex counter', counterError);
            }

            if (counterData) {
                setSexCount(counterData.count);
            }

            // Fetch completed positions
            const { data: positionsData, error: positionsError } = await db
                .from('completed_positions')
                .select('position_id')
                .eq('couple_id', couple.id);

            if (positionsError) {
                logger.error('useSexploration', 'Error fetching completed positions', positionsError);
            }

            if (positionsData) {
                setCompletedPositions(positionsData.map((p: any) => p.position_id));
            }
        } catch (error) {
            logger.error('useSexploration', 'Error fetching sexploration data', error);
        } finally {
            setLoading(false);
        }
    }, [couple?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const incrementSexCount = useCallback(async () => {
        if (!couple?.id) return;

        const newCount = sexCount + 1;
        setSexCount(newCount);

        try {
            await db
                .from('sex_counter')
                .upsert({
                    couple_id: couple.id,
                    count: newCount,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'couple_id' });
        } catch (error) {
            logger.error('useSexploration', 'Error updating sex count', error);
            setSexCount(sexCount); // Revert on error
        }
    }, [couple?.id, sexCount]);

    const decrementSexCount = useCallback(async () => {
        if (!couple?.id || sexCount <= 0) return;

        const newCount = sexCount - 1;
        setSexCount(newCount);

        try {
            await db
                .from('sex_counter')
                .upsert({
                    couple_id: couple.id,
                    count: newCount,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'couple_id' });
        } catch (error) {
            logger.error('useSexploration', 'Error updating sex count', error);
            setSexCount(sexCount); // Revert on error
        }
    }, [couple?.id, sexCount]);

    const togglePositionComplete = useCallback(async (positionId: string) => {
        if (!couple?.id) return;

        const isCompleted = completedPositions.includes(positionId);

        if (isCompleted) {
            // Remove from completed
            setCompletedPositions(prev => prev.filter(id => id !== positionId));

            try {
                await db
                    .from('completed_positions')
                    .delete()
                    .eq('couple_id', couple.id)
                    .eq('position_id', positionId);

                // Deduct 5 love action points for uncompleting a position
                await supabase.rpc('add_love_action_points', {
                    p_couple_id: couple.id,
                    p_points: -5
                });
            } catch (error) {
                logger.error('useSexploration', 'Error removing completed position', error);
                setCompletedPositions(prev => [...prev, positionId]); // Revert
            }
        } else {
            // Add to completed
            setCompletedPositions(prev => [...prev, positionId]);

            try {
                await db
                    .from('completed_positions')
                    .insert({
                        couple_id: couple.id,
                        position_id: positionId,
                        completed_at: new Date().toISOString()
                    });

                // Award 5 love action points for completing a position
                await supabase.rpc('add_love_action_points', {
                    p_couple_id: couple.id,
                    p_points: 5
                });
            } catch (error) {
                logger.error('useSexploration', 'Error adding completed position', error);
                setCompletedPositions(prev => prev.filter(id => id !== positionId)); // Revert
            }
        }
    }, [couple?.id, completedPositions]);

    const isPositionCompleted = useCallback((positionId: string) => {
        return completedPositions.includes(positionId);
    }, [completedPositions]);

    return useMemo(() => ({
        sexCount,
        completedPositions,
        loading,
        incrementSexCount,
        decrementSexCount,
        togglePositionComplete,
        isPositionCompleted,
    }), [
        sexCount,
        completedPositions,
        loading,
        incrementSexCount,
        decrementSexCount,
        togglePositionComplete,
        isPositionCompleted,
    ]);
}
