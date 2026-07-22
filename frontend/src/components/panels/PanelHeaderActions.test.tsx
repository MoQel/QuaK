import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IDockviewHeaderActionsProps } from 'dockview-react';
import { PanelHeaderActions } from './PanelHeaderActions.tsx';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';

vi.mock('@/views/circuit-view/components/CircuitToolbar.tsx', () => ({
    CircuitToolbar: () => <div data-testid="circuit-toolbar" />,
}));
vi.mock('@/views/text-editor-view/components/CodeToolbar.tsx', () => ({
    CodeToolbar: () => <div data-testid="code-toolbar" />,
}));
vi.mock('@/contexts/CircuitTabsContext.tsx', () => ({ useCircuitTabs: vi.fn() }));
vi.mock('@/hooks/editor/useActiveCode.ts', () => ({
    useActiveCode: () => ({ activeCodeTabId: 'f1', getActiveCode: vi.fn(), setActiveCode: vi.fn() }),
}));

const mockedUseCircuitTabs = useCircuitTabs as unknown as ReturnType<typeof vi.fn>;

const noopDisposable = { onDidActivePanelChange: () => ({ dispose: () => {} }) };
const makeProps = (panelId: string): IDockviewHeaderActionsProps =>
    ({
        api: noopDisposable,
        group: { activePanel: { id: panelId }, api: noopDisposable },
        activePanel: { id: panelId },
        containerApi: {},
        panels: [],
        isGroupActive: true,
    }) as unknown as IDockviewHeaderActionsProps;

describe('PanelHeaderActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseCircuitTabs.mockReturnValue({
            activeCircuit: {},
            setActiveCircuit: vi.fn(),
            activeCircuitTabId: 'f1',
        });
    });

    it('shows the circuit toolbar when the circuit panel is active', () => {
        render(<PanelHeaderActions {...makeProps('circuit')} />);
        expect(screen.queryByTestId('circuit-toolbar')).not.toBeNull();
        expect(screen.queryByTestId('code-toolbar')).toBeNull();
    });

    it('shows the code toolbar (generate code) when the code panel is active', () => {
        render(<PanelHeaderActions {...makeProps('code')} />);
        expect(screen.queryByTestId('code-toolbar')).not.toBeNull();
        expect(screen.queryByTestId('circuit-toolbar')).toBeNull();
    });

    it('renders nothing for other panels', () => {
        render(<PanelHeaderActions {...makeProps('library')} />);
        expect(screen.queryByTestId('circuit-toolbar')).toBeNull();
        expect(screen.queryByTestId('code-toolbar')).toBeNull();
    });

    it('renders nothing when no file is open', () => {
        mockedUseCircuitTabs.mockReturnValue({
            activeCircuit: undefined,
            setActiveCircuit: vi.fn(),
            activeCircuitTabId: null,
        });
        render(<PanelHeaderActions {...makeProps('code')} />);
        expect(screen.queryByTestId('code-toolbar')).toBeNull();
    });
});
