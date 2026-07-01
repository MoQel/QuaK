import { Tab } from '@/store/tabs/tabsTypes.ts';

// Formal-editor tabs live in their own id namespace, so a file can be open as both a normal code
// tab and a formal (Dirac) tab at the same time.
const FORMAL_TAB_ID_PREFIX = 'formal:';

/**
 * TEMPORARY: the formal editor is offered for OpenQASM files only.
 *
 * Until the circuit ↔ file binding (feature #146) lands there is a single project circuit, so
 * every formal tab shows that same circuit regardless of which .qasm file it was opened from.
 * Once #146 is merged this should resolve the circuit belonging to the file instead.
 */
export function canOpenInFormalEditor(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.qasm');
}

/** Builds the formal (Dirac notation) tab for a given file. */
export function createFormalTab(fileId: string, fileName: string): Tab {
    return {
        id: `${FORMAL_TAB_ID_PREFIX}${fileId}`,
        title: `${fileName} (Dirac)`,
        language: '',
        kind: 'formal',
    };
}
