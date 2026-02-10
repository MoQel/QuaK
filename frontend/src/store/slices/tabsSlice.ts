import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_LANG, languages } from '@/views/text-editor-view/languages/languages.ts';

export const GROUP_MAIN = 'group-main';
export const GROUP_RIGHT = 'group-right';
export const GROUP_BOTTOM = 'group-bottom';

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
}

const initialState: TabsState = {
    groups: [{ id: GROUP_MAIN, openTabs: [], activeTabId: null }],
    activeGroupId: GROUP_MAIN,
    lastSaveRequest: { fileId: null, timestamp: 0 },
    lastLanguageRequest: { fileId: null, langId: null, timestamp: 0 },
    dirtyFiles: [],
    isDragging: false,
};

const isFileOpenAnywhere = (groups: EditorGroup[], fileId: string): boolean => {
    return groups.some((g) => g.openTabs.some((t) => t.id === fileId));
};

const getLanguageByExtension = (title: string): string => {
    const ext = title.split('.').pop() || '';
    const match = languages.find((l) => l.fileExtension === ext.toLowerCase());
    return match ? match.id : DEFAULT_LANG;
};

export const tabsSlice = createSlice({
    name: 'tabs',
    initialState,
    reducers: {
        // Group Management
        setActiveGroup: (state, action: PayloadAction<string>) => {
            state.activeGroupId = action.payload;
        },
        splitGroup: (state, action: PayloadAction<string>) => {
            if (!state.groups.some((g) => g.id === action.payload)) {
                state.groups.push({ id: action.payload, openTabs: [], activeTabId: null });
                state.activeGroupId = action.payload;
            }
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
                    id: GROUP_MAIN,
                    openTabs: mergedTabs,
                    activeTabId: currentActiveFileId || mergedTabs[0]?.id || null,
                },
            ];
            state.activeGroupId = GROUP_MAIN;
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
            const group = state.groups.find((g) => g.id === action.payload.groupId);
            if (!group) return;

            const index = group.openTabs.findIndex((t) => t.id === action.payload.tabId);
            if (index === -1) return;

            group.openTabs = group.openTabs.filter((t) => t.id !== action.payload.tabId);

            if (group.activeTabId === action.payload.tabId) {
                const nextTab = group.openTabs[index - 1] || group.openTabs[0];
                group.activeTabId = nextTab ? nextTab.id : null;
            }

            if (!isFileOpenAnywhere(state.groups, action.payload.tabId)) {
                state.dirtyFiles = state.dirtyFiles.filter((id) => id !== action.payload.tabId);
            }

            // Switch active group and delete empty group if empty
            if (group.openTabs.length !== 0) {
                state.activeGroupId = action.payload.groupId;
                return;
            }

            if (group.id !== GROUP_MAIN) {
                state.groups = state.groups.filter((g) => g.id != group.id);
                state.activeGroupId = GROUP_MAIN;
            }
            const fallbackGroups = [GROUP_RIGHT, GROUP_BOTTOM];

            for (const fallbackId of fallbackGroups) {
                const fallbackGroup = state.groups.find((g) => g.id === fallbackId);
                if (!fallbackGroup || fallbackGroup.openTabs.length <= 0) continue;
                const mainGroup = state.groups.find((g) => g.id === GROUP_MAIN);
                if (mainGroup) {
                    mainGroup.openTabs = [...fallbackGroup.openTabs];
                    mainGroup.activeTabId = fallbackGroup.activeTabId;
                } else {
                    state.groups.push({
                        id: GROUP_MAIN,
                        openTabs: [...fallbackGroup.openTabs],
                        activeTabId: fallbackGroup.activeTabId,
                    });
                }
                state.groups = state.groups.filter((g) => g.id !== fallbackId);
                break;
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
            action: PayloadAction<{ fromId: string; fromGroupId: string; toId?: string; toGroupId: string }>,
        ) => {
            const { fromId, fromGroupId, toId, toGroupId } = action.payload;
            const fromGroup = state.groups.find((g) => g.id === fromGroupId);

            // open group if it is not there
            let toGroup = state.groups.find((g) => g.id === toGroupId);
            if (!toGroup) {
                toGroup = { id: toGroupId, openTabs: [], activeTabId: null };
                state.groups.push(toGroup);
            }

            if (!fromGroup || !toGroup) return;

            const fromIndex = fromGroup.openTabs.findIndex((t) => t.id === fromId);
            if (fromIndex === -1) return;

            // check if already opened in target group. In this case just adjust the focus
            const alreadyInTarget = toGroup.openTabs.find((t) => t.id === fromId);
            if (alreadyInTarget) {
                fromGroup.openTabs.splice(fromIndex, 1);
                toGroup.activeTabId = fromId;

                state.activeGroupId = toGroupId;

                if (fromGroup.activeTabId === fromId) {
                    fromGroup.activeTabId = fromGroup.openTabs[0]?.id || null;
                }
                return;
            }

            const [movedTab] = fromGroup.openTabs.splice(fromIndex, 1);

            if (fromGroup.activeTabId === fromId) {
                fromGroup.activeTabId = fromGroup.openTabs[0]?.id || null;
            }

            // returns -1 if toId is null
            const toIndex = toGroup.openTabs.findIndex((t) => t.id === toId);

            if (toIndex === -1) {
                toGroup.openTabs.push(movedTab);
            } else {
                toGroup.openTabs.splice(toIndex, 0, movedTab);
            }
            toGroup.activeTabId = movedTab.id;
            state.activeGroupId = toGroupId;

            // Cleanup: Close source group if empty (unless it's MAIN)
            if (fromGroup.openTabs.length === 0 && fromGroup.id !== GROUP_MAIN) {
                state.groups = state.groups.filter((g) => g.id !== fromGroup.id);
                if (state.activeGroupId === fromGroup.id) state.activeGroupId = toGroupId;
            }
        },
        requestLanguageChange: (state, action: PayloadAction<{ fileId: string; langId: string }>) => {
            state.lastLanguageRequest = {
                ...action.payload,
                timestamp: Date.now(),
            };
            const fileId = action.payload.fileId;
            state.groups.forEach((group) => {
                const tab = group.openTabs.find((t) => t.id === fileId);
                if (tab) {
                    tab.language = action.payload.langId;
                }
            });
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
        setDragging: (state, action: PayloadAction<boolean>) => {
            state.isDragging = action.payload;
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
    setDragging,
} = tabsSlice.actions;
export default tabsSlice.reducer;
