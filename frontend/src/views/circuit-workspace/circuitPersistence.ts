import { api } from '@/api/api.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { toCircuitContent } from '@quak/circuit-core';

/** Persists the full content (registers and layers) of a circuit to the backend. */
export const saveCircuitContent = (circuit: CircuitResponse): Promise<CircuitResponse> =>
    api.put<CircuitResponse>(`/api/circuit/${circuit.id}`, toCircuitContent(circuit));

/** Generates OpenQASM code from the circuit content without persisting anything. */
export const generateCircuitCode = (circuit: CircuitResponse): Promise<string> =>
    api.post<{ code: string }>('/api/circuit/qasmCode', toCircuitContent(circuit)).then((response) => response.code);
