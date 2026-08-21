import { useEffect, useState } from 'react';
import { api } from '@/api/api.ts';

/** A circuit of the project that can be dropped in as a subcircuit. Mirrors the backend response. */
export interface SubcircuitOption {
    circuitId: string;
    /** The file the circuit belongs to; what the box is labelled with. */
    name: string;
    qubitCount: number;
}

/**
 * The project's other circuits, offered as subcircuits.
 *
 * Deliberately its own endpoint rather than walking the project and reading each file's circuit:
 * reading a circuit by file *creates* one if it does not exist, so listing that way would give every
 * file in the project a circuit just because the library was open.
 *
 * Reloaded whenever the edited circuit changes, so a file that only just became a circuit shows up
 * without a full page reload.
 */
export function useSubcircuitOptions(projectId: string | null, currentCircuitId: string | undefined): SubcircuitOption[] {
    const [options, setOptions] = useState<SubcircuitOption[]>([]);

    useEffect(() => {
        if (!projectId) {
            setOptions([]);
            return;
        }

        let cancelled = false;
        const query = currentCircuitId ? `?excludeCircuitId=${encodeURIComponent(currentCircuitId)}` : '';
        api.get<SubcircuitOption[]>(`/api/circuit/project/${projectId}/subcircuits${query}`)
            .then((loaded) => {
                if (!cancelled) setOptions(loaded);
            })
            .catch(() => {
                // The library is still usable without them; the built-ins and custom gates stay.
                if (!cancelled) setOptions([]);
            });

        return () => {
            cancelled = true;
        };
    }, [projectId, currentCircuitId]);

    return options;
}
