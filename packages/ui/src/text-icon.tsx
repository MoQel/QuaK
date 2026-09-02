/** A short text (a gate symbol, for example) shown where an icon component is expected. */
export function TextIcon({ text, className }: Readonly<{ text: string; className?: string }>) {
    return <span className={className}>{text}</span>;
}
