import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Tab {
    id: string; // Unique file id
    title: string; // Filename
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
}

const INITIAL_GROUP_ID = 'group-initial';
const initialState: TabsState = {
    groups: [{ id: INITIAL_GROUP_ID, openTabs: [], activeTabId: null }],
    activeGroupId: INITIAL_GROUP_ID,
    lastSaveRequest: { fileId: null, timestamp: 0 },
    lastLanguageRequest: { fileId: null, langId: null, timestamp: 0 },
    dirtyFiles: [],
};

const isFileOpenAnywhere = (groups: EditorGroup[], fileId: string): boolean => {
    return groups.some((g) => g.openTabs.some((t) => t.id === fileId));
};

export const tabsSlice = createSlice({
    name: 'tabs',
    initialState,
    reducers: {
        // Group Management
        setActiveGroup: (state, action: PayloadAction<string>) => {
            state.activeGroupId = action.payload;
        },
        splitGroup: (state) => {
            if (state.groups.length >= 3) return; // We allow only 3 groups
            const newGroupId = `group-${Date.now()}`;

            const activeGroup = state.groups.find((g) => g.id === state.activeGroupId);
            const initialTabs = activeGroup?.activeTabId
                ? activeGroup.openTabs.filter((t) => t.id === activeGroup.activeTabId)
                : [];

            state.groups.push({
                id: newGroupId,
                openTabs: initialTabs,
                activeTabId: initialTabs[0]?.id || null,
            });
            state.activeGroupId = newGroupId;
        },
        unsplitGroup: (state) => {
            if (state.groups.length <= 1) return;
            const allTabsMap = new Map<string, Tab>();
            state.groups.forEach((group) => {
                group.openTabs.forEach((tab) => allTabsMap.set(tab.id, tab));
            });
            const mergedTabs = Array.from(allTabsMap.values());
            const currentActiveFileId = state.groups.find((g) => g.id === state.activeGroupId)?.activeTabId;
            state.groups = [
                {
                    id: INITIAL_GROUP_ID,
                    openTabs: mergedTabs,
                    activeTabId: currentActiveFileId || mergedTabs[0]?.id || null,
                },
            ];
            state.activeGroupId = INITIAL_GROUP_ID;
        },
        closeGroup: (state, action: PayloadAction<string>) => {
            if (state.groups.length <= 1) return; // Don't close last group
            state.groups = state.groups.filter((g) => g.id !== action.payload);
            // Reset active group if we closed the active one
            if (state.activeGroupId === action.payload) {
                state.activeGroupId = state.groups[0].id;
            }
            state.dirtyFiles = state.dirtyFiles.filter((fId) => isFileOpenAnywhere(state.groups, fId));
        },
        // Tab Management
        openTab: (state, action: PayloadAction<{ tab: Tab; groupId?: string }>) => {
            const targetGroupId = action.payload.groupId || state.activeGroupId;
            const group = state.groups.find((g) => g.id === targetGroupId);
            if (!group) return;
            const exists = group.openTabs.find((t) => t.id === action.payload.tab.id);
            if (!exists) {
                group.openTabs.push(action.payload.tab);
            }
            group.activeTabId = action.payload.tab.id;
            state.activeGroupId = targetGroupId;
        },
        closeTab: (state, action: PayloadAction<{ tabId: string; groupId: string }>) => {
            const group = state.groups.find((g) => g.id === action.payload.groupId);
            if (!group) return;

            const index = group.openTabs.findIndex((t) => t.id === action.payload.tabId);
            if (index === -1) return;

            group.openTabs.splice(index, 1);

            if (!isFileOpenAnywhere(state.groups, action.payload.tabId)) {
                state.dirtyFiles = state.dirtyFiles.filter((id) => id !== action.payload.tabId);
            }

            if (group.activeTabId === action.payload.tabId) {
                const nextTab = group.openTabs[index] || group.openTabs[index - 1]; // Try right, then left
                group.activeTabId = nextTab ? nextTab.id : null;
            }
        },
        closeOthers: (state, action: PayloadAction<{ tabId: string; groupId: string }>) => {
            const group = state.groups.find((g) => g.id === action.payload.groupId);
            if (!group) return;

            const tabId = action.payload.tabId;

            group.openTabs = group.openTabs.filter((t) => t.id === tabId);
            group.activeTabId = tabId;

            // Check cleanup for each closed tab
            const tabsToClose = group.openTabs.filter((t) => t.id !== tabId);
            tabsToClose.forEach((closedTab) => {
                if (!isFileOpenAnywhere(state.groups, closedTab.id)) {
                    state.dirtyFiles = state.dirtyFiles.filter((id) => id !== closedTab.id);
                }
            });
        },
        closeAll: () => initialState,
        setActiveTab: (state, action: PayloadAction<{ tabId: string; groupId: string }>) => {
            const group = state.groups.find((g) => g.id === action.payload.groupId);
            if (group) {
                group.activeTabId = action.payload.tabId;
                state.activeGroupId = action.payload.groupId;
            }
        },
        moveTab: (
            state,
            action: PayloadAction<{ fromId: string; fromGroupId: string; toId: string; toGroupId: string }>,
        ) => {
            const { fromId, fromGroupId, toId, toGroupId } = action.payload;
            const fromGroup = state.groups.find((g) => g.id === fromGroupId);
            const toGroup = state.groups.find((g) => g.id === toGroupId);

            if (!fromGroup || !toGroup) return;

            const fromIndex = fromGroup.openTabs.findIndex((t) => t.id === fromId);
            if (fromIndex === -1) return;

            // check if already opened in target group. In this case just adjust the focus
            const alreadyInTarget = toGroup.openTabs.find((t) => t.id === fromId);
            if (alreadyInTarget) {
                fromGroup.openTabs.splice(fromIndex, 1);
                toGroup.activeTabId = fromId;

                if (fromGroup.activeTabId === fromId) {
                    fromGroup.activeTabId = fromGroup.openTabs[0]?.id || null;
                }
                return;
            }

            const [movedTab] = fromGroup.openTabs.splice(fromIndex, 1);

            if (fromGroup.activeTabId === fromId) {
                fromGroup.activeTabId = fromGroup.openTabs[0]?.id || null;
            }

            const toIndex = toGroup.openTabs.findIndex((t) => t.id === toId);

            if (toIndex === -1) {
                toGroup.openTabs.push(movedTab);
            } else {
                toGroup.openTabs.splice(toIndex, 0, movedTab);
            }
            toGroup.activeTabId = movedTab.id;
            state.activeGroupId = toGroupId;
        },
        requestLanguageChange: (state, action: PayloadAction<{ fileId: string; langId: string }>) => {
            state.lastLanguageRequest = {
                ...action.payload,
                timestamp: Date.now(),
            };
        },
        requestSave: (state, action: PayloadAction<string>) => {
            state.lastSaveRequest = {
                fileId: action.payload,
                timestamp: Date.now(),
            };
        },
        setFileDirty: (state, action: PayloadAction<{ fileId: string; isDirty: boolean }>) => {
            const { fileId, isDirty } = action.payload;

            if (isDirty && !state.dirtyFiles.includes(fileId)) {
                state.dirtyFiles.push(fileId);
            } else if (!isDirty) {
                state.dirtyFiles = state.dirtyFiles.filter((id) => id !== fileId);
            }
        },
    },
});

export const {
    setActiveGroup,
    splitGroup,
    unsplitGroup,
    closeGroup,
    openTab,
    closeTab,
    closeOthers,
    closeAll,
    setActiveTab,
    moveTab,
    requestLanguageChange,
    requestSave,
    setFileDirty,
} = tabsSlice.actions;
export default tabsSlice.reducer;
