export interface Tab {
    id: string; // Unique file id
    title: string; // Filename
    language: string; // language setting
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

export type PendingClose = (
    | { type: 'tab'; payload: { tabId: string; groupId: string } }
    | { type: 'group'; payload: { groupId: string } }
    | { type: 'all' }
    | { type: 'others'; payload: { tabId: string; groupId: string } }
) & { shouldCloseCodePanel?: boolean };
