import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import type { IDockviewPanelHeaderProps } from 'dockview-react';
import { store } from '@/store/store.ts';
import { GROUP_MAIN, restoreTabs, setFileDirty } from '@/store/tabs/tabsSlice.ts';
import { CustomTabRenderer } from './CustomTab.tsx';

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
const openTabIds = () => store.getState().tabs.groups.flatMap((g) => g.openTabs.map((t) => t.id));

const renderTab = (panelId: string) => {
    const api = {
        id: panelId,
        title: 'Panel',
        isVisible: true,
        onDidVisibilityChange: () => ({ dispose: () => {} }),
        close: vi.fn(),
    };
    const props = { api } as unknown as IDockviewPanelHeaderProps;
    const utils = render(<CustomTabRenderer {...props} />, { wrapper });
    return { api, ...utils };
};

describe('CustomTabRenderer', () => {
    beforeEach(() => {
        store.dispatch(
            restoreTabs({
                groups: [
                    { id: GROUP_MAIN, openTabs: [{ id: 'f1', title: 'a.qc', language: 'qc' }], activeTabId: 'f1' },
                ],
                activeGroupId: GROUP_MAIN,
            }),
        );
    });

    // Closing the Code panel used to run closeAll() (via the Monaco GC unmount and
    // safeCloseCodePanel), wiping every tab and thus the circuit. It must now be a
    // pure layout action that only hides the panel.
    it('closing the Code panel hides it without wiping open tabs, even when dirty', () => {
        store.dispatch(setFileDirty({ fileId: 'f1', isDirty: true }));

        const { api, getByRole } = renderTab('code');
        fireEvent.click(getByRole('button'));

        expect(api.close).toHaveBeenCalledTimes(1);
        expect(openTabIds()).toContain('f1');
    });
});
