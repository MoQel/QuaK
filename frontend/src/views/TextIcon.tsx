import React from "react";

export const TextIcon = (label: string): React.FC<{ className?: string }> =>
    ({ className }) => <span className={className}>{label}</span>;
