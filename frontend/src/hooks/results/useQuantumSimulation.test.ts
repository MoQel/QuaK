import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuantumSimulation } from './useQuantumSimulation.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';

const mockPostMessage = vi.fn();
const mockTerminate = vi.fn();
let mockWorkerInstance: any = null;

// Mock the web worker constructor
vi.mock('@/workers/simulation.worker?worker', () => {
    return {
        default: class MockWorker {
            constructor() {
                this.postMessage = mockPostMessage;
                this.terminate = mockTerminate;
                this.onmessage = null;
                mockWorkerInstance = this;
            }
            postMessage: (msg: unknown) => void;
            terminate: () => void;
            onmessage: ((e: MessageEvent) => void) | null;
        },
    };
});

const mockCircuit: CircuitResponse = {
    id: 'test',
    registers: [],
} as unknown as CircuitResponse;

describe('useQuantumSimulation Hook', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockPostMessage.mockClear();
        mockTerminate.mockClear();
        mockWorkerInstance = null;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useQuantumSimulation(null));

        expect(result.current.result).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isCalculating).toBe(false);
    });

    it('should show calculating state immediately but debounce worker call', () => {
        const { result } = renderHook(() => useQuantumSimulation(mockCircuit));

        expect(result.current.isCalculating).toBe(true);
        expect(mockPostMessage).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(301);
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

        act(() => {
            vi.advanceTimersByTime(300);
        });

        const mockResponse = {
            type: 'SUCCESS',
            requestId: 1,
            payload: { stateVector: [], counts: { '00': 10 } },
        };

        act(() => {
            if (mockWorkerInstance?.onmessage) {
                mockWorkerInstance.onmessage({ data: mockResponse } as MessageEvent);
            }
        });

        expect(result.current.result).toEqual(mockResponse.payload);
        expect(result.current.isCalculating).toBe(false);
    });

    it('should handle worker errors', () => {
        const { result } = renderHook(() => useQuantumSimulation(mockCircuit));

        act(() => {
            vi.advanceTimersByTime(300);
        });

        const mockError = {
            type: 'ERROR',
            requestId: 1,
            error: 'Simulation error',
        };

        act(() => {
            mockWorkerInstance.onmessage({ data: mockError } as MessageEvent);
        });

        expect(result.current.error).toBe('Simulation error');
        expect(result.current.isCalculating).toBe(false);
    });

    it('should debounce multiple rapid changes', () => {
        const { rerender } = renderHook(({ c }) => useQuantumSimulation(c), {
            initialProps: { c: mockCircuit },
        });

        act(() => vi.advanceTimersByTime(100));
        rerender({ c: { ...mockCircuit, id: 'updated' } as any });
        act(() => vi.advanceTimersByTime(100));

        expect(mockPostMessage).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(300));

        expect(mockPostMessage).toHaveBeenCalledTimes(1);
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                circuit: expect.objectContaining({ id: 'updated' }),
            }),
        );
    });

    it('should ignore outdated worker responses (race conditions)', () => {
        const { result, rerender } = renderHook(({ opts }) => useQuantumSimulation(mockCircuit, opts), {
            initialProps: { opts: { sampleCount: 100 } },
        });

        // First request triggers
        act(() => vi.advanceTimersByTime(300));

        // Second request triggers
        rerender({ opts: { sampleCount: 200 } });
        act(() => vi.advanceTimersByTime(300));

        // Mock old response arriving late
        act(() => {
            mockWorkerInstance.onmessage({
                data: { type: 'SUCCESS', requestId: 1, payload: 'OLD' },
            } as MessageEvent);
        });

        expect(result.current.result).toBeNull();

        // Mock current response arriving
        act(() => {
            mockWorkerInstance.onmessage({
                data: { type: 'SUCCESS', requestId: 2, payload: 'NEW' },
            } as MessageEvent);
        });

        expect(result.current.result).toBe('NEW');
    });

    it('should terminate worker on unmount', () => {
        const { unmount } = renderHook(() => useQuantumSimulation(mockCircuit));
        unmount();
        expect(mockTerminate).toHaveBeenCalled();
    });
});
