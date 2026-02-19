import { useEffect, useRef } from 'react';

export function useFocusSelection(value: string = '', ignoreExtension = false) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inputRef.current) {
                const input = inputRef.current;
                input.focus();

                const lastDotIndex = value.lastIndexOf('.');
                const selectionEnd = ignoreExtension && lastDotIndex !== -1 ? lastDotIndex : value.length;

                input.setSelectionRange(0, selectionEnd);
            }
        }, 50);

        return () => clearTimeout(timeout);
    }, [value, ignoreExtension]);

    return inputRef;
}
