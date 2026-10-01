/** Escapes plain text for use inside LaTeX text commands. */
export function escapeLatexText(value: string): string {
    return value
        .replaceAll('\\', String.raw`\textbackslash{}`)
        .replaceAll('&', String.raw`\&`)
        .replaceAll('%', String.raw`\%`)
        .replaceAll('$', String.raw`\$`)
        .replaceAll('#', String.raw`\#`)
        .replaceAll('_', String.raw`\_`)
        .replaceAll('{', String.raw`\{`)
        .replaceAll('}', String.raw`\}`)
        .replaceAll('~', String.raw`\textasciitilde{}`)
        .replaceAll('^', String.raw`\textasciicircum{}`);
}
