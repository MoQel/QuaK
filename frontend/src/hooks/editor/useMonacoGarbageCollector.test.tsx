import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { store } from '@/store/store.ts';
import { GROUP_MAIN, restoreTabs } from '@/store/tabs/tabsSlice.ts';
import { useMonaco } from '@monaco-editor/react';
import { useMonacoGarbageCollector } from './useMonacoGarbageCollector.ts';

vi.mock('@monaco-editor/react', () => ({ useMonaco: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
const openTabIds = () => store.getState().tabs.groups.flatMap((group) => group.openTabs.map((tab) => tab.id));
const fakeMonaco = { editor: { getModels: () => [] } };
const mockedUseMonaco = useMonaco as unknown as ReturnType<typeof vi.fn>;

describe('useMonacoGarbageCollector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        store.dispatch(
            restoreTabs({
                groups: [
                    { id: GROUP_MAIN, openTabs: [{ id: 'f1', title: 'a.qc', language: 'qc' }], activeTabId: 'f1' },
                ],
                activeGroupId: GROUP_MAIN,
            }),
        );
    });

    it('does not close tabs when monaco finishes loading (null -> instance)', () => {
        mockedUseMonaco.mockReturnValue(null);
        const { rerender } = renderHook(() => useMonacoGarbageCollector(), { wrapper });
        expect(openTabIds()).toContain('f1');

        // Monaco finishes loading asynchronously; this must NOT wipe the restored tabs.
        mockedUseMonaco.mockReturnValue(fakeMonaco);
        rerender();

        expect(openTabIds()).toContain('f1');
    });

    it('closes all tabs on unmount (leaving the IDE)', () => {
        mockedUseMonaco.mockReturnValue(fakeMonaco);
        const { unmount } = renderHook(() => useMonacoGarbageCollector(), { wrapper });
        expect(openTabIds()).toContain('f1');

        unmount();
        expect(openTabIds()).not.toContain('f1');
    });
});
