import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuantumSimulation } from './useQuantumSimulation.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { WorkerResponse } from '@/workers/messages.ts';
import { SimulationResult } from '@/simulation/simulation.types.ts';

interface MockWorkerInstance extends Worker {
    onmessage: ((e: MessageEvent<WorkerResponse>) => void) | null;
}

describe('useQuantumSimulation Hook', () => {
    let latestWorker: MockWorkerInstance | null = null;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();

        const MockWorker = vi.fn().mockImplementation(() => {
            const instance = {
                postMessage: vi.fn(),
                terminate: vi.fn(),
                onmessage: null,
            } as unknown as MockWorkerInstance;
            latestWorker = instance;
            return instance;
        });

        vi.stubGlobal('Worker', MockWorker);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        latestWorker = null;
    });

    const mockCircuit = { id: 'test-id', registers: [] } as unknown as CircuitResponse;

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useQuantumSimulation(undefined));

        expect(result.current.result).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isCalculating).toBe(false);
    });

    it('should show calculating state immediately but debounce worker call', () => {
        const { result } = renderHook(() => useQuantumSimulation(mockCircuit));

        // State should be calculating even before debounce finishes
        expect(result.current.isCalculating).toBe(true);
        expect(latestWorker?.postMessage).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(305);
        });

        expect(latestWorker?.postMessage).toHaveBeenCalledTimes(1);
        expect(latestWorker?.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'CALCULATE_CIRCUIT' }));
    });

    it('should update result on worker success', () => {
        const { result } = renderHook(() => useQuantumSimulation(mockCircuit));

        act(() => vi.advanceTimersByTime(305));
        const { requestId } = vi.mocked(latestWorker!.postMessage).mock.calls[0][0];

        const resultPayload: SimulationResult = {
            counts: { '00': 10 },
            stateVector: [],
            measurementResults: [],
            simulatedQubits: 1,
        };
        const successPayload: WorkerResponse = {
            type: 'SUCCESS',
            requestId,
            payload: resultPayload,
        };

        act(() => {
            latestWorker?.onmessage?.({ data: successPayload } as MessageEvent);
        });

        expect(result.current.result).toEqual(resultPayload);
        expect(result.current.isCalculating).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle worker errors', () => {
        const { result } = renderHook(() => useQuantumSimulation(mockCircuit));

        act(() => vi.advanceTimersByTime(305));
        const lastCall = vi.mocked(latestWorker!.postMessage).mock.calls[0][0];

        act(() => {
            latestWorker?.onmessage?.({
                data: { type: 'ERROR', requestId: lastCall.requestId, error: 'Simulation failed' },
            } as MessageEvent);
        });

        expect(result.current.error).toBe('Simulation failed');
        expect(result.current.isCalculating).toBe(false);
    });

    it('should ignore outdated worker responses (race conditions)', () => {
        const { result, rerender } = renderHook(({ opts }) => useQuantumSimulation(mockCircuit, opts), {
            initialProps: { opts: { sampleCount: 100 } },
        });

        act(() => vi.advanceTimersByTime(305));
        const firstId = vi.mocked(latestWorker!.postMessage).mock.calls[0][0].requestId;

        rerender({ opts: { sampleCount: 200 } });
        act(() => vi.advanceTimersByTime(305));
        const secondId = vi.mocked(latestWorker!.postMessage).mock.calls[1][0].requestId;

        act(() => {
            latestWorker?.onmessage?.({
                data: {
                    type: 'SUCCESS',
                    requestId: firstId,
                    payload: { counts: { '0': 1 }, stateVector: [], measurementResults: [], simulatedQubits: 1 },
                },
            } as MessageEvent);
        });
        expect(result.current.result).toBeNull();

        act(() => {
            latestWorker?.onmessage?.({
                data: {
                    type: 'SUCCESS',
                    requestId: secondId,
                    payload: { counts: { '1': 1 }, stateVector: [], measurementResults: [], simulatedQubits: 1 },
                },
            } as MessageEvent);
        });
        expect(result.current.result).toEqual({
            counts: { '1': 1 },
            stateVector: [],
            measurementResults: [],
            simulatedQubits: 1,
        });
    });

    it('should terminate worker on unmount', () => {
        const { unmount } = renderHook(() => useQuantumSimulation(mockCircuit));
        unmount();
        expect(latestWorker?.terminate).toHaveBeenCalled();
    });
});
