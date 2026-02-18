import { TextIcon } from '@/components/ui/text-icon.tsx';
import { Plus, X } from 'lucide-react';

export type OperationIdentifier =
    | 'H'
    | 'X'
    | 'Y'
    | 'Z'
    | 'CX'
    | 'CCX'
    | 'CZ'
    | 'SWAP'
    | 'S'
    | 'T'
    | 'RX'
    | 'RY'
    | 'RZ'
    | 'MEASURE'
    | 'DUMMY'; // Temporary placeholder only — must never appear in a finalized or submitted circuit.

export const getOperationSizeByIdentifier = (identifier: OperationIdentifier): number => {
    switch (identifier.toUpperCase()) {
        case 'CCX':
            return 3;
        case 'CX':
        case 'CZ':
        case 'SWAP':
            return 2;
        default:
            return 1;
    }
};

export const getOperationControlSizeByIdentifier = (identifier: OperationIdentifier): number => {
    switch (identifier.toUpperCase()) {
        case 'CCX':
            return 2;
        case 'CX':
        case 'CZ':
            return 1;
        default:
            return 0;
    }
};

export const getOperationTargetSizeByIdentifier = (identifier: OperationIdentifier): number => {
    if (identifier.toUpperCase() === 'SWAP') {
        return 2;
    } else {
        return 1;
    }
};

export const getOperationIconByIdentifier = (identifier: OperationIdentifier) => {
    switch (identifier.toUpperCase()) {
        case 'CCX':
        case 'CX':
        case 'X':
            return Plus;
        case 'SWAP':
            return X;
        default:
            return TextIcon(identifier);
    }
};
