import { useMonaco } from '@monaco-editor/react';
import { Uri } from 'monaco-editor';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

/**
 * Editor-side counterpart to `useCircuitTabs` for the active file's code.
 *
 * Unlike the circuit — which React owns and caches in `CircuitTabsContext` — the code's
 * source of truth is the Monaco model owned by the editor. So this is a thin imperative
 * wrapper over that model (`getActiveCode`/`setActiveCode`) rather than a second copy of the
 * text held in React state, which would risk drifting out of sync with the editor.
 */
export function useActiveCode() {
    const monaco = useMonaco();
    const activeCodeTabId = useAppSelector((state) => {
        const activeGroup = state.tabs.groups.find((group) => group.id === state.tabs.activeGroupId);
        return activeGroup?.activeTabId ?? null;
    });

    const getModel = () => (activeCodeTabId ? (monaco?.editor.getModel(Uri.file(activeCodeTabId)) ?? null) : null);

    const getActiveCode = (): string | undefined => {
        const model = getModel();
        return model && !model.isDisposed() ? model.getValue() : undefined;
    };

    const setActiveCode = (code: string) => {
        const model = getModel();
        if (model && !model.isDisposed()) model.setValue(code);
    };

    return { activeCodeTabId, getActiveCode, setActiveCode };
}
