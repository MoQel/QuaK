import { useEffect, useRef, useState } from "react";
import SimulationWorker from "@/workers/simulation.worker?worker";
import { CircuitResponse } from "@/api/dto/circuit";
import { WorkerRequest, WorkerResponse } from "@/workers/messages";
import { SimulationResult } from "@/simulation/simulation.types";

export function useQuantumSimulation(circuit: CircuitResponse | null) {
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const worker = new SimulationWorker();
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const msg = event.data;

            // Ignore outdated responses
            if (msg.requestId !== requestIdRef.current) return;

            if (msg.type === "SUCCESS") {
                setResult(msg.payload);
                setError(null);
            } else {
                setError(msg.error);
            }

            setIsLoading(false);
        };

        return () => worker.terminate();
    }, []);

    useEffect(() => {
        if (!circuit || !workerRef.current) return;

        const requestId = ++requestIdRef.current;
        setIsLoading(true);

        workerRef.current.postMessage({
            type: "CALCULATE_CIRCUIT",
            requestId,
            circuit,
        } satisfies WorkerRequest);
    }, [circuit]);

    return { result, isLoading, error };
}