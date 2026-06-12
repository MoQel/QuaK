import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_LANG, languages } from '@/views/text-editor-view/languages/languages.ts';
import { EditorGroup, PendingClose, Tab, TabsState } from '@/store/tabs/tabsTypes.ts';

export const GROUP_MAIN = 'group-main';
export const GROUP_RIGHT = 'group-right';
export const GROUP_BOTTOM = 'group-bottom';

const initialState: TabsState = {
    groups: [{ id: GROUP_MAIN, openTabs: [], activeTabId: null }],
    activeGroupId: GROUP_MAIN,
    lastSaveRequest: { fileId: null, timestamp: 0 },
    lastLanguageRequest: { fileId: null, langId: null, timestamp: 0 },
    dirtyFiles: [],
    isDragging: false,
    pendingCloseAction: null,
};

// region Helpers
const isFileOpenAnywhere = (groups: EditorGroup[], fileId: string): boolean => {
    return groups.some((g) => g.openTabs.some((t) => t.id === fileId));
};

const getLanguageByExtension = (title: string): string => {
    const ext = title.split('.').pop() || '';
    const match = languages.find((l) => l.fileExtension === ext.toLowerCase());
    return match ? match.id : DEFAULT_LANG;
};

const cleanupDirtyFile = (state: TabsState, fileId: string) => {
    if (!isFileOpenAnywhere(state.groups, fileId)) {
        state.dirtyFiles = state.dirtyFiles.filter((id) => id !== fileId);
    }
};

const updateActiveTabAfterClose = (group: EditorGroup, closedTabIndex: number) => {
    const nextTab = group.openTabs[closedTabIndex - 1] || group.openTabs[0];
    group.activeTabId = nextTab ? nextTab.id : null;
};

const handleGroupCleanup = (state: TabsState, group: EditorGroup) => {
    if (group.openTabs.length > 0) return;

    // Remove side groups
    if (group.id !== GROUP_MAIN) {
        state.groups = state.groups.filter((g) => g.id !== group.id);
        if (state.activeGroupId === group.id) {
            state.activeGroupId = GROUP_MAIN;
        }
        return;
    }

    // Merge fallback groups into Main
    const fallbackGroups = [GROUP_RIGHT, GROUP_BOTTOM];
    for (const fallbackId of fallbackGroups) {
        const fallbackGroup = state.groups.find((g) => g.id === fallbackId);
        if (!fallbackGroup || fallbackGroup.openTabs.length <= 0) continue;

        group.openTabs = [...fallbackGroup.openTabs];
        group.activeTabId = fallbackGroup.activeTabId;
        state.groups = state.groups.filter((g) => g.id !== fallbackId);
        break;
    }

    state.activeGroupId = GROUP_MAIN;
};

const moveTabWithinSameGroup = (
    toId: string | undefined,
    fromId: string,
    fromGroup: EditorGroup,
    fromIndex: number,
) => {
    if (!toId || fromId === toId) return;

    const originalToIndex = fromGroup.openTabs.findIndex((t) => t.id === toId);
    if (originalToIndex === -1) return;

    // Remove tab from current position
    const [movedTab] = fromGroup.openTabs.splice(fromIndex, 1);

    // Find new target index after removal
    const newToIndex = fromGroup.openTabs.findIndex((t) => t.id === toId);

    // Insert tab at new position
    const insertPosition = fromIndex < originalToIndex ? newToIndex + 1 : newToIndex;
    fromGroup.openTabs.splice(insertPosition, 0, movedTab);
};

const moveTabCrossGroups = (
    state: TabsState,
    toGroupId: string,
    fromGroup: EditorGroup,
    fromIndex: number,
    fromId: string,
    toId: string | undefined,
) => {
    let toGroup = state.groups.find((g) => g.id === toGroupId);
    if (!toGroup) {
        toGroup = { id: toGroupId, openTabs: [], activeTabId: null };
        state.groups.push(toGroup);
    }

    // Extract tab from source
    const [movedTab] = fromGroup.openTabs.splice(fromIndex, 1);
    const existsInTarget = toGroup.openTabs.some((t) => t.id === fromId);

    // Insert tab into target group
    if (!existsInTarget) {
        const toIndex = toId ? toGroup.openTabs.findIndex((t) => t.id === toId) : -1;
        if (toIndex === -1) {
            toGroup.openTabs.push(movedTab);
        } else {
            toGroup.openTabs.splice(toIndex, 0, movedTab);
        }
    }

    // Update active state in target group
    toGroup.activeTabId = fromId;
    state.activeGroupId = toGroupId;

    // Update active state in source group
    if (fromGroup.activeTabId === fromId) {
        fromGroup.activeTabId = fromGroup.openTabs[0]?.id || null;
    }

    // Clean up empty groups
    handleGroupCleanup(state, fromGroup);
};
// endregion

// region Slice
export const tabsSlice = createSlice({
    name: 'tabs',
    initialState,
    reducers: {
        setActiveGroup: (state, action: PayloadAction<string>) => {
            state.activeGroupId = action.payload;
        },

        restoreTabs: (state, action: PayloadAction<{ groups: EditorGroup[]; activeGroupId: string }>) => {
            const groups = action.payload.groups.filter((g) => g.openTabs.length > 0 || g.id === GROUP_MAIN);
            if (!groups.some((g) => g.id === GROUP_MAIN)) {
                groups.unshift({ id: GROUP_MAIN, openTabs: [], activeTabId: null });
            }

            state.groups = groups;
            state.activeGroupId = groups.some((g) => g.id === action.payload.activeGroupId)
                ? action.payload.activeGroupId
                : GROUP_MAIN;
            state.dirtyFiles = [];
            state.isDragging = false;
            state.pendingCloseAction = null;
        },

        splitGroup: (state, action: PayloadAction<{ fromGroupId: string; toGroupId: string }>) => {
            const { fromGroupId, toGroupId } = action.payload;
            const fromGroup = state.groups.find((g) => g.id === fromGroupId);
            if (!fromGroup) return;
            if (!state.groups.some((g) => g.id === toGroupId)) {
                state.groups.push({ id: toGroupId, openTabs: fromGroup.openTabs, activeTabId: fromGroup.activeTabId });
            }
        },

        unsplitGroup: (state, action: PayloadAction<string>) => {
            const groupId = action.payload;

            // Prevent unsplitting the main group
            if (groupId === GROUP_MAIN) return;

            const sourceGroupIndex = state.groups.findIndex((g) => g.id === groupId);
            if (sourceGroupIndex === -1) return;

            const sourceGroup = state.groups[sourceGroupIndex];
            let mainGroup = state.groups.find((g) => g.id === GROUP_MAIN);

            // Fallback if main group is somehow missing
            if (!mainGroup) {
                mainGroup = { id: GROUP_MAIN, openTabs: [], activeTabId: null };
                state.groups.push(mainGroup);
            }

            // Move tabs to main group without duplicates
            sourceGroup.openTabs.forEach((tab) => {
                const exists = mainGroup.openTabs.some((t) => t.id === tab.id);
                if (!exists) {
                    mainGroup.openTabs.push(tab);
                }
            });

            // Update active focus if the closed group was active
            if (state.activeGroupId === groupId) {
                state.activeGroupId = GROUP_MAIN;
                if (sourceGroup.activeTabId) {
                    mainGroup.activeTabId = sourceGroup.activeTabId;
                }
            }

            // Remove the source group
            state.groups.splice(sourceGroupIndex, 1);
        },

        unsplitAllGroups: (state) => {
            if (state.groups.length <= 1) return;

            const allTabsMap = new Map<string, Tab>();
            state.groups.forEach((group) => {
                group.openTabs.forEach((tab) => allTabsMap.set(tab.id, tab));
            });
            const mergedTabs = Array.from(allTabsMap.values());

            const currentActiveFileId = state.groups.find((g) => g.id === state.activeGroupId)?.activeTabId;

            state.groups = [
                {
                    id: GROUP_MAIN,
                    openTabs: mergedTabs,
                    activeTabId: currentActiveFileId || mergedTabs[0]?.id || null,
                },
            ];
            state.activeGroupId = GROUP_MAIN;
        },

        closeGroup: (state, action: PayloadAction<string>) => {
            const groupId = action.payload;
            const group = state.groups.find((g) => g.id === groupId);
            if (!group) return;
            group.openTabs = [];
            group.activeTabId = null;
            state.dirtyFiles = state.dirtyFiles.filter((fId) => isFileOpenAnywhere(state.groups, fId));
            handleGroupCleanup(state, group);
        },

        openTab: (state, action: PayloadAction<{ tab: Tab; groupId?: string }>) => {
            const targetGroupId = action.payload.groupId || state.activeGroupId;
            const group = state.groups.find((g) => g.id === targetGroupId);
            if (!group) return;

            const newTab: Tab = {
                ...action.payload.tab,
                language: getLanguageByExtension(action.payload.tab.title),
            };

            const exists = group.openTabs.find((t) => t.id === action.payload.tab.id);
            if (!exists) {
                group.openTabs.push(newTab);
            }
            group.activeTabId = newTab.id;
            state.activeGroupId = targetGroupId;
        },

        closeTab: (state, action: PayloadAction<{ tabId: string; groupId: string }>) => {
            const { tabId, groupId } = action.payload;
            const group = state.groups.find((g) => g.id === groupId);
            if (!group) return;

            const index = group.openTabs.findIndex((t) => t.id === tabId);
            if (index === -1) return;

            const isActive = group.activeTabId === tabId;
            group.openTabs.splice(index, 1);

            if (isActive) updateActiveTabAfterClose(group, index);
            cleanupDirtyFile(state, tabId);
            handleGroupCleanup(state, group);
        },

        closeOthers: (state, action: PayloadAction<{ tabId: string; groupId: string }>) => {
            const group = state.groups.find((g) => g.id === action.payload.groupId);
            if (!group) return;

            const { tabId } = action.payload;
            const tabsToClose = group.openTabs.filter((t) => t.id !== tabId);

            group.openTabs = group.openTabs.filter((t) => t.id === tabId);
            group.activeTabId = tabId;

            tabsToClose.forEach((closedTab) => cleanupDirtyFile(state, closedTab.id));
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
            action: PayloadAction<{ fromId: string; fromGroupId: string; toId?: string; toGroupId: string }>,
        ) => {
            const { fromId, fromGroupId, toId, toGroupId } = action.payload;

            // Find source group
            const fromGroup = state.groups.find((g) => g.id === fromGroupId);
            if (!fromGroup) return;

            // Find source tab index
            const fromIndex = fromGroup.openTabs.findIndex((t) => t.id === fromId);
            if (fromIndex === -1) return;

            const isSameGroup = fromGroupId === toGroupId;

            // Handle same group reordering
            if (isSameGroup) {
                moveTabWithinSameGroup(toId, fromId, fromGroup, fromIndex);
                return; // Exit early
            }

            // Handle cross-group movement
            // Ensure target group exists
            moveTabCrossGroups(state, toGroupId, fromGroup, fromIndex, fromId, toId);
        },

        requestLanguageChange: (state, action: PayloadAction<{ fileId: string; langId: string }>) => {
            state.lastLanguageRequest = { ...action.payload, timestamp: Date.now() };
            state.groups.forEach((group) => {
                const tab = group.openTabs.find((t) => t.id === action.payload.fileId);
                if (tab) tab.language = action.payload.langId;
            });
        },

        requestSave: (state, action: PayloadAction<string>) => {
            state.lastSaveRequest = { fileId: action.payload, timestamp: Date.now() };
        },

        setFileDirty: (state, action: PayloadAction<{ fileId: string; isDirty: boolean }>) => {
            const { fileId, isDirty } = action.payload;

            if (isDirty && !state.dirtyFiles.includes(fileId)) {
                state.dirtyFiles.push(fileId);
            } else if (!isDirty) {
                state.dirtyFiles = state.dirtyFiles.filter((id) => id !== fileId);
            }
        },

        setDragging: (state, action: PayloadAction<boolean>) => {
            state.isDragging = action.payload;
        },
        setPendingClose: (state, action: PayloadAction<PendingClose | null>) => {
            state.pendingCloseAction = action.payload;
        },
    },
});
// endregion

export const {
    setActiveGroup,
    restoreTabs,
    splitGroup,
    unsplitGroup,
    unsplitAllGroups,
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
    setDragging,
    setPendingClose,
} = tabsSlice.actions;

export default tabsSlice.reducer;
