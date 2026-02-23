// Safe Close Thunks https://redux.js.org/usage/writing-logic-thunks
import { AppDispatch, RootState } from '@/store/store.ts';
import { EditorGroup, TabsState } from '@/store/tabs/tabsTypes.ts';
import { closeAll, closeGroup, closeOthers, closeTab, setPendingClose } from '@/store/tabs/tabsSlice.ts';

const isTabOpenElsewhere = (state: TabsState, tabId: string, currentGroupId: string | null) => {
    return state.groups.some((g) => g.id !== currentGroupId && g.openTabs.some((t) => t.id === tabId));
};

const willLoseUnsavedChanges = (state: TabsState, tabId: string, groupId: string) => {
    const isDirty = state.dirtyFiles.includes(tabId);
    if (!isDirty) return false;

    return !isTabOpenElsewhere(state, tabId, groupId);
};

export const safeCloseTab =
    (payload: { tabId: string; groupId: string }) => (dispatch: AppDispatch, getState: () => RootState) => {
        const state = getState().tabs;

        // Only prompt if it's dirty AND will be completely closed
        if (willLoseUnsavedChanges(state, payload.tabId, payload.groupId)) {
            dispatch(setPendingClose({ type: 'tab', payload }));
        } else {
            dispatch(closeTab(payload));
        }
    };

export const safeCloseAll = () => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().tabs;
    // If ANY file is dirty, closing all will definitely close it completely
    if (state.dirtyFiles.length > 0) {
        dispatch(setPendingClose({ type: 'all' }));
    } else {
        dispatch(closeAll());
    }
};

export const safeCloseGroup = (groupId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().tabs;
    const group = state.groups.find((g: EditorGroup) => g.id === groupId);
    if (!group) return;

    // Check if any dirty tab in this group is NOT open in other groups
    const hasRisk = group.openTabs.some((t) => willLoseUnsavedChanges(state, t.id, groupId));

    if (hasRisk) {
        dispatch(setPendingClose({ type: 'group', payload: { groupId } }));
    } else {
        dispatch(closeGroup(groupId));
    }
};

export const safeCloseOthers =
    (payload: { tabId: string; groupId: string }) => (dispatch: AppDispatch, getState: () => RootState) => {
        const state = getState().tabs;
        const group = state.groups.find((g: EditorGroup) => g.id === payload.groupId);
        if (!group) return;

        const hasRisk = group.openTabs
            .filter((t) => t.id !== payload.tabId) // Keep the active one
            .some((t) => willLoseUnsavedChanges(state, t.id, payload.groupId));

        if (hasRisk) {
            dispatch(setPendingClose({ type: 'others', payload }));
        } else {
            dispatch(closeOthers(payload));
        }
    };
