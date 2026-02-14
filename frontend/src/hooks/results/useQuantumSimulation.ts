import { useEffect, useRef, useState } from 'react';
import SimulationWorker from '@/workers/simulation.worker.ts?worker';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { WorkerRequest, WorkerResponse } from '@/workers/messages.ts';
import { SimulationResult, SimulationOptions } from '@/simulation/simulation.types.ts';

// Debounce delay in milliseconds
const SIMULATION_DELAY_MS = 300;

export function useQuantumSimulation(circuit: CircuitResponse | null, options: SimulationOptions = {}) {
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const worker = new SimulationWorker();
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const msg = event.data;

            // Discard responses from outdated requests
            if (msg.requestId !== requestIdRef.current) return;

            if (msg.type === 'SUCCESS') {
                setResult(msg.payload);
                setError(null);
            } else {
                setError(msg.error);
            }

            setIsCalculating(false);
        };

        return () => {
            worker.terminate();
        };
    }, []);

    // Handle circuit or option changes with debouncing
    useEffect(() => {
        // Clear any pending simulation request
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Reset if circuit is empty
        if (!circuit) {
            setResult(null);
            setIsCalculating(false);
            return;
        }

        setIsCalculating(true);

        // Start debounce timer
        debounceTimerRef.current = setTimeout(() => {
            if (!workerRef.current) return;

            const requestId = ++requestIdRef.current;
            setIsCalculating(true);

            // Send to worker including options
            workerRef.current.postMessage({
                type: 'CALCULATE_CIRCUIT',
                requestId,
                circuit,
                options,
            } satisfies WorkerRequest);
        }, SIMULATION_DELAY_MS);

        // Cleanup timer on unmount or dependency change
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [circuit, options.mode, options.sampleCount, options.maxQubits]);
    // Note: We decompose 'options' in deps to avoid re-runs on new object references

    return { result, isCalculating, error };
}
