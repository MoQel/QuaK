export const TextIcon = (text: string) => {
    return ({ className }: { className?: string }) => (
        <span className={className}>{text}</span>
    );
};
