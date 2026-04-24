import { Context, createContext } from 'react';
import { FileElement } from '@/views/project-manager-view/util/FileElement.tsx';

export const ParentRefresh = createContext<() => void>(() => {});
export const DialogClose = createContext<() => void>(() => {});
export const FileSelect: Context<(file: FileElement) => void> = createContext((_) => {});

export interface SelectedFolderState {
    id: string | null;
    setId: (id: string | null) => void;
    reloadTrigger: number;
    triggerReload: () => void;
}

export const SelectedFolder = createContext<SelectedFolderState>({
    id: null,
    setId: () => {},
    reloadTrigger: 0,
    triggerReload: () => {},
});
