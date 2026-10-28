/**
 * The text of a token the tree may not really have: the generated accessors type every child as present, but error
 * recovery both drops them and invents them, the invented ones reading `<missing Identifier>`.
 */
export function tokenText(
    node: { symbol: { tokenIndex: number; text?: string | null } } | null | undefined,
): string | null {
    if (!node || node.symbol.tokenIndex < 0) return null;

    return node.symbol.text ?? null;
}

export type SourcePosition = { start: { line: number; column: number } | null };

/** Enough of a parse-tree node to find the text it was built from. */
export type SourceSpan = { start: { start: number } | null; stop: { stop: number } | null };

/** A comma after the last entry, which OpenQASM allows. `toQasm` writes lists without it, so it is rejected. */
export const endsWithComma = (list: { COMMA(): unknown[] }, entries: number): boolean =>
    entries > 0 && list.COMMA().length >= entries;

export const trailingComma = (excerpt: string): string => `A trailing comma is not supported: ${excerpt}`;

/** Variable or expression indices are not supported. */
export const constantInt = (text: string): number | null => {
    const trimmed = text.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    return Number.parseInt(trimmed, 10);
};
