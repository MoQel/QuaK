/** The formal (Dirac notation) view is offered for OpenQASM files only. */
export function canOpenInFormalEditor(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.qasm');
}
