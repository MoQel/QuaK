import { IDockviewHeaderActionsProps } from 'dockview-react';
import { useEffect, useState } from 'react';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';
import { useActiveCode } from '@/hooks/editor/useActiveCode.ts';
import { CircuitStoreProvider, CircuitToolbar } from '@quak/circuit-editor';
import { CodeToolbar } from '@/views/text-editor-view/components/CodeToolbar.tsx';
import { QuantikzExportButton } from '@/views/circuit-workspace/notation/QuantikzExportButton.tsx';
import { ParseEditorButton } from '@/views/circuit-workspace/ParseEditorButton.tsx';

/** Tracks the group's active panel id, re-rendering when the user switches tabs within the group. */
function useActivePanelId(props: IDockviewHeaderActionsProps): string | undefined {
    const [activePanelId, setActivePanelId] = useState(props.group.activePanel?.id);

    useEffect(() => {
        setActivePanelId(props.group.activePanel?.id);
        const disposable = props.api.onDidActivePanelChange(() => {
            setActivePanelId(props.group.activePanel?.id);
        });
        return () => disposable.dispose();
    }, [props.api, props.group]);

    return activePanelId;
}

/**
 * Left-side actions for the Dockview group header. Configured globally via DockviewReact's
 * `leftHeaderActionsComponent` (so the toolbar sits left-aligned, right after the panel
 * title), it renders the matching toolbar for the active panel — the circuit controls on the
 * Circuit panel, the generate-code action on the Code panel — and only while a file is open
 * (mirrors the panels' "No file open" state).
 */
export function PanelHeaderActions(props: IDockviewHeaderActionsProps) {
    const activePanelId = useActivePanelId(props);
    const { activeCircuit, setActiveCircuit, activeCircuitTabId } = useCircuitTabs();
    const { setActiveCode } = useActiveCode();

    if (!activeCircuitTabId) return null;

    if (activePanelId === 'circuit') {
        // The header sits outside the circuit panel, so it needs its own store:
        // same two values, so both stay in sync through CircuitTabsContext.
        return (
            <div className="flex items-center h-full pl-4">
                <CircuitStoreProvider circuit={activeCircuit} setCircuit={setActiveCircuit}>
                    <CircuitToolbar
                        start={
                            <>
                                <QuantikzExportButton circuit={activeCircuit ?? null} />
                                <ParseEditorButton circuit={activeCircuit} setCircuit={setActiveCircuit} />
                            </>
                        }
                    />
                </CircuitStoreProvider>
            </div>
        );
    }

    if (activePanelId === 'code') {
        return (
            <div className="flex items-center h-full pl-4">
                <CodeToolbar circuit={activeCircuit} setCode={setActiveCode} />
            </div>
        );
    }

    return null;
}
