import { SimulationError } from '@/simulation/simulation.types.ts';

export class SimulationValidationError extends Error {
    readonly simulationError: SimulationError;

    constructor(simulationError: SimulationError) {
        super(`${simulationError.code}: ${simulationError.message}`);
        this.name = 'SimulationValidationError';
        this.simulationError = simulationError;
    }
}

export function throwSimulationError(error: SimulationError): never {
    throw new SimulationValidationError(error);
}
