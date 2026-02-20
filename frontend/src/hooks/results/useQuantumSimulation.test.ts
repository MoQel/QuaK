import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useQuantumSimulation } from './useQuantumSimulation.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { WorkerRequest, WorkerResponse } from '@/workers/messages.ts';

const mockPostMessage = vi.fn();
const mockTerminate = vi.fn();

interface MockWorkerInstance {
    postMessage: (msg: WorkerRequest) => void;
    terminate: () => void;
    onmessage: ((e: MessageEvent<WorkerResponse>) => void) | null;
}

vi.mock('@/workers/simulation.worker?worker', () => {
    // Typed 'this' to avoid explicit any
    const MockWorkerConstructor = vi.fn().mockImplementation(function (this: MockWorkerInstance) {
        this.postMessage = mockPostMessage;
        this.terminate = mockTerminate;
        this.onmessage = null;
        return this;
    });

    return {
        default: MockWorkerConstructor,
    };
});

import SimulationWorker from '@/workers/simulation.worker?worker';
// Cast to Vitest Mock type instead of any
const MockWorker = SimulationWorker as unknown as Mock;

const mockCircuit: CircuitResponse = {
    id: 'test',
    registers: [],
} as unknown as CircuitResponse;

describe('useQuantumSimulation Hook', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const getWorkerInstance = () => MockWorker.mock.instances[0] as MockWorkerInstance;

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useQuantumSimulation(null));

        expect(result.current.result).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isCalculating).toBe(false);
    });

    it('should show calculating state immediately but debounce worker call', () => {
        renderHook(() => useQuantumSimulation(mockCircuit));

        act(() => {
            vi.advanceTimersByTime(305);
        });

        expect(mockPostMessage).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'CALCULATE_CIRCUIT',
                circuit: mockCircuit,
            }),
        );
    });

    it('should update result on worker success', async () => {
        const { result } = renderHook(() => useQuantumSimulation(mockCircuit));

        act(() => vi.advanceTimersByTime(305));

        const { requestId } = mockPostMessage.mock.calls[0][0];

        const mockResponse: WorkerResponse = {
            type: 'SUCCESS',
            requestId,
            payload: { stateVector: [], counts: { '00': 10 }, simulatedQubits: 1 },
        };

        act(() => {
            getWorkerInstance().onmessage!({ data: mockResponse } as MessageEvent);
        });

        expect(result.current.result).toEqual(mockResponse.payload);
        expect(result.current.isCalculating).toBe(false);
    });

    it('should handle worker errors', () => {
        const { result } = renderHook(() => useQuantumSimulation(mockCircuit));

        act(() => vi.advanceTimersByTime(305));
        const { requestId } = mockPostMessage.mock.calls[0][0];

        act(() => {
            getWorkerInstance().onmessage!({
                data: { type: 'ERROR', requestId, error: 'Simulation error' },
            } as MessageEvent);
        });

        expect(result.current.error).toBe('Simulation error');
        expect(result.current.isCalculating).toBe(false);
    });

    it('should ignore outdated worker responses (race conditions)', () => {
        // Removed explicit any casts, relying on inference
        const { result, rerender } = renderHook(({ opts }) => useQuantumSimulation(mockCircuit, opts), {
            initialProps: { opts: { sampleCount: 100 } },
        });

        act(() => vi.advanceTimersByTime(305));
        const firstId = mockPostMessage.mock.calls[0][0].requestId;

        rerender({ opts: { sampleCount: 200 } });
        act(() => vi.advanceTimersByTime(305));
        const secondId = mockPostMessage.mock.calls[1][0].requestId;

        act(() => {
            getWorkerInstance().onmessage!({
                data: {
                    type: 'SUCCESS',
                    requestId: firstId,
                    payload: { stateVector: [], counts: {}, simulatedQubits: 1 },
                },
            } as MessageEvent);
        });
        expect(result.current.result).toBeNull();

        act(() => {
            getWorkerInstance().onmessage!({
                data: {
                    type: 'SUCCESS',
                    requestId: secondId,
                    payload: { stateVector: [{ state: '|0>' }], counts: {}, simulatedQubits: 1 },
                },
            } as MessageEvent);
        });
        expect(result.current.result).not.toBeNull();
    });

    it('should terminate worker on unmount', () => {
        const { unmount } = renderHook(() => useQuantumSimulation(mockCircuit));
        unmount();
        expect(mockTerminate).toHaveBeenCalled();
    });
});
