/** The Dirac notation is only meaningful for OpenQASM circuits. */
export function canInspectWithDirac(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.qasm');
}
