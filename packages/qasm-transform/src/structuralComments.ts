/** QuaK's own readability annotations in generated QASM. */

export const registerMarker = (registerName: string): string => `// Register ${registerName}`;

export const layerMarker = (layerNumber: number): string => `// Layer ${layerNumber}`;
