import { Toaster } from '@/components/ui/sonner';
import { usePreventKeyboardActions } from '@/hooks/usePreventKeyboardActions.ts';
import { DockviewReact } from 'dockview-react';
import { componentRegistry } from '@/components/panels/componentRegistry';
import { useDockviewLogic } from '@/hooks/useDockviewLogic';
import 'dockview-core/dist/styles/dockview.css';
import { CustomTabRenderer } from '@/components/panels/CustomTab.tsx';
import { PanelHeaderActions } from '@/components/panels/PanelHeaderActions.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { UnsavedChangesAlertDialog } from '@/views/text-editor-view/components/utils/UnsavedChangesAlertDialog.tsx';
import { PanelDataProvider } from '@/contexts/panel/PanelDataProvider';
import { useTabsPersistence } from '@/hooks/useTabsPersistence.ts';
import { useMonacoGarbageCollector } from '@/hooks/editor/useMonacoGarbageCollector.ts';
import { lspManager } from '@/lsp/LSPClientManager';
import { useEffect } from 'react';

function ProjectWorkspace({ projectId }: Readonly<{ projectId: string | null }>) {
    const { onReady } = useDockviewLogic();

    usePreventKeyboardActions();
    useTabsPersistence(projectId);
    // Mounted at the IDE host (project route) rather than the Code panel, so its
    // teardown (closeAll + dispose models) fires only when leaving the IDE — not
    // when the Code panel itself is closed, which previously wiped every tab.
    useMonacoGarbageCollector();

    useEffect(() => {
        return () => lspManager.disposeAll();
    }, []);

    return (
        <div className="h-full w-full overflow-hidden bg-bg-dark">
            <PanelDataProvider>
                <DockviewReact
                    components={componentRegistry}
                    defaultTabComponent={CustomTabRenderer}
                    leftHeaderActionsComponent={PanelHeaderActions}
                    onReady={onReady}
                    className="dockview-theme-custom h-full w-full"
                />
            </PanelDataProvider>

            <UnsavedChangesAlertDialog />
            <Toaster />
        </div>
    );
}

/** Every project gets its own workspace, so switching runs the same teardown and restore as leaving the IDE. */
function App() {
    const { projectId } = useProject();

    return <ProjectWorkspace key={projectId} projectId={projectId} />;
}

export default App;
