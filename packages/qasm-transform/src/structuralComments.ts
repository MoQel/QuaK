/**
 * QuaK's own annotations in generated QASM — `// Register q`, `// Layer 3`.
 *
 * They look like comments but they are not content: their text is a pure
 * function of the circuit's structure, so dropping them on read and writing them
 * again on generate is provably a no-op. That is what lets the transform keep
 * emitting them (they are useful when reading the file) without them tripping
 * the "comments cannot be preserved" rule that makes a document read-only.
 *
 * A user comment that happens to read exactly like a marker in exactly a marker's
 * position is indistinguishable — and harmless, because regenerating produces the
 * identical text. Anything else the user writes is a real comment and is treated
 * as one.
 *
 * Both sides import from here so the pattern that is written and the pattern that
 * is recognized cannot drift apart.
 */

export const registerMarker = (registerName: string): string => `// Register ${registerName}`;

export const layerMarker = (layerNumber: number): string => `// Layer ${layerNumber}`;

const REGISTER_MARKER = /^\/\/ Register [A-Za-z_][A-Za-z0-9_]*$/;
const LAYER_MARKER = /^\/\/ Layer \d+$/;

export const isStructuralComment = (text: string): boolean => {
    const trimmed = text.trim();
    return REGISTER_MARKER.test(trimmed) || LAYER_MARKER.test(trimmed);
};
