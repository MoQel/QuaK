import React from "react";
import {GateType} from '@/api/dto/GateType.ts'

export const TextIcon = (label: GateType): React.FC<{ className?: string }> =>
    ({ className }) => <span className={className}>{label !== 'PLACEHOLDER' && label}</span>;
