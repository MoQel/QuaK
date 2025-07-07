export interface QuantumGate {
    id: string
    type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'MEASURE'
    qubits: number
}
