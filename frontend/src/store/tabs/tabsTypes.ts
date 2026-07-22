// How a tab's file is displayed. A .qasm file can be shown as its source ('code') or as the
// read-only Dirac notation ('formal') — two views of the same tab, not two separate tabs.
export type TabViewMode = 'code' | 'formal';

export interface Tab {
    id: string; // Unique file id
    title: string; // Filename
    language: string; // language setting
    viewMode?: TabViewMode; // Current view; absent means the regular code (text editor) view.
}

export interface EditorGroup {
    id: string;
    openTabs: Tab[];
    activeTabId: string | null;
}

export interface TabsState {
    groups: EditorGroup[];
    activeGroupId: string;
    lastSaveRequest: { fileId: string | null; timestamp: number };
    lastLanguageRequest: { fileId: string | null; langId: string | null; timestamp: number };
    dirtyFiles: string[];
    isDragging: boolean;
    pendingCloseAction: PendingClose | null;
}

export type PendingClose =
    | { type: 'tab'; payload: { tabId: string; groupId: string } }
    | { type: 'group'; payload: { groupId: string } }
    | { type: 'all' }
    | { type: 'others'; payload: { tabId: string; groupId: string } };
