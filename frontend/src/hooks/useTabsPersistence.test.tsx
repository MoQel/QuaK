import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { store } from '@/store/store.ts';
import { GROUP_MAIN, openTab, restoreTabs } from '@/store/tabs/tabsSlice.ts';
import { useTabsPersistence } from './useTabsPersistence.ts';
import { api } from '@/api/api.ts';

vi.mock('@/api/api.ts', () => ({
    api: { get: vi.fn(), put: vi.fn(() => Promise.resolve()) },
}));

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

const openTabIds = () => store.getState().tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id));

const persistedTabs = (tabIds: string[]) =>
    JSON.stringify({
        groups: [
            {
                id: GROUP_MAIN,
                openTabs: tabIds.map((id) => ({ id, title: `${id}.qc`, language: 'qc' })),
                activeTabId: tabIds[0] ?? null,
            },
        ],
        activeGroupId: GROUP_MAIN,
    });

describe('useTabsPersistence restore race', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        store.dispatch(restoreTabs({ groups: [], activeGroupId: '' }));
    });

    it('keeps a tab the user opened while the editor state was still loading', async () => {
        let resolveGet: (value: { projectId: string; tabsJson: string | null }) => void = () => {};
        (api.get as ReturnType<typeof vi.fn>).mockReturnValue(new Promise((resolve) => (resolveGet = resolve)));

        renderHook(() => useTabsPersistence('p1'), { wrapper });

        // User opens a circuit tab before the GET resolves.
        act(() => {
            store.dispatch(openTab({ tab: { id: 'f1', title: 'a.qc', language: '' } }));
        });

        // Editor state resolves with a persisted set that does NOT contain f1.
        await act(async () => {
            resolveGet({ projectId: 'p1', tabsJson: persistedTabs([]) });
        });

        expect(openTabIds()).toContain('f1');
    });

    it('restores persisted tabs when the user has not opened anything', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            projectId: 'p1',
            tabsJson: persistedTabs(['persisted']),
        });

        renderHook(() => useTabsPersistence('p1'), { wrapper });

        await waitFor(() => expect(openTabIds()).toContain('persisted'));
    });
});
