import { ElementaryQuantumGateDto } from '@/api/dto/circuit.ts';
import { RegisterOffsets } from '@/simulation/circuitContext.ts';
import { Disposable } from '@/simulation/simulation.types.ts';
import { throwSimulationError } from '@/simulation/simulation.errors.ts';
import * as qulacs from 'qulacs-wasm';

export function applyGateToState(
    state: qulacs.QuantumState,
    op: ElementaryQuantumGateDto,
    offsets: RegisterOffsets,
): void {
    const circuit = new qulacs.QuantumCircuit(state.get_qubit_count());

    try {
        applyGate(circuit, op, offsets);
        circuit.update_quantum_state(state);
    } finally {
        (circuit as unknown as Disposable).delete();
    }
}

function applyGate(circuit: qulacs.QuantumCircuit, op: ElementaryQuantumGateDto, offsets: RegisterOffsets) {
    const type = op.identifier;
    const angle = op.rotationAngle;
    const targets = op.targetQubits.map((t) => offsets[t.registerId] + t.index);
    const controls = op.controlQubits.map((t) => offsets[t.registerId] + t.index);

    switch (type) {
        case 'H':
            circuit.add_H_gate(targets[0]);
            break;
        case 'X':
            circuit.add_X_gate(targets[0]);
            break;
        case 'Y':
            circuit.add_Y_gate(targets[0]);
            break;
        case 'Z':
            circuit.add_Z_gate(targets[0]);
            break;
        case 'S':
            circuit.add_S_gate(targets[0]);
            break;
        case 'T':
            circuit.add_T_gate(targets[0]);
            break;
        case 'RX':
            circuit.add_RotX_gate(targets[0], angle);
            break;
        case 'RY':
            circuit.add_RotY_gate(targets[0], angle);
            break;
        case 'RZ':
            circuit.add_RotZ_gate(targets[0], angle);
            break;
        case 'CX':
            circuit.add_CNOT_gate(controls[0], targets[0]);
            break;
        case 'CZ':
            circuit.add_CZ_gate(controls[0], targets[0]);
            break;
        case 'SWAP':
            circuit.add_SWAP_gate(targets[0], targets[1]);
            break;
        case 'CCX':
            circuit.add_gate(qulacs.TOFFOLI(controls[0], controls[1], targets[0]));
            break;
        default:
            throwSimulationError({
                code: 'UNSUPPORTED_GATE',
                message: `Gate '${type}' is not supported by the simulator.`,
                operationId: op.id,
            });
    }
}
