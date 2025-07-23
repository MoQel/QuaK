export interface QuantumGate {
    id: string
    type: 'DUMMY' | 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'MEASURE'
    qubit: number
}
