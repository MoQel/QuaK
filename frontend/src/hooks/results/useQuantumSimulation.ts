import { useEffect, useRef, useState } from 'react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { WorkerRequest, WorkerResponse } from '@/workers/messages.ts';
import { SimulationResult, SimulationOptions } from '@/simulation/simulation.types.ts';

const SIMULATION_DELAY_MS = 300;

export function useQuantumSimulation(circuit: CircuitResponse | undefined, options: SimulationOptions = {}) {
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const worker = new Worker(new URL('@/workers/simulation.worker.ts', import.meta.url), {
            type: 'module',
            name: 'simulation-worker',
        });
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const msg = event.data;

            if (msg.requestId !== requestIdRef.current) return;

            if (msg.type === 'SUCCESS') {
                setResult(msg.payload);
                setError(null);
            } else {
                setResult(null);
                setError(msg.error);
            }

            setIsCalculating(false);
        };

        return () => {
            worker.terminate();
        };
    }, []);

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!circuit) {
            setResult(null);
            setError(null);
            setIsCalculating(false);
            return;
        }

        setResult(null);
        setError(null);

        setIsCalculating(true);

        debounceTimerRef.current = setTimeout(() => {
            if (!workerRef.current) return;

            const requestId = ++requestIdRef.current;
            setIsCalculating(true);

            workerRef.current.postMessage({
                type: 'CALCULATE_CIRCUIT',
                requestId,
                circuit,
                options,
            } satisfies WorkerRequest);
        }, SIMULATION_DELAY_MS);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [circuit, options.mode, options.measurementMode, options.sampleCount, options.maxCircuitWidth]);

    return { result, isCalculating, error };
}
