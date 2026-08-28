import { Toaster } from '@/components/ui/sonner';
import { usePreventKeyboardActions } from '@/hooks/usePreventKeyboardActions.ts';
import { DockviewReact } from 'dockview-react';
import { componentRegistry } from '@/components/panels/componentRegistry';
import { useDockviewLogic } from '@/hooks/useDockviewLogic';
import 'dockview-core/dist/styles/dockview.css';
import { CustomTabRenderer } from '@/components/panels/CustomTab.tsx';
import { PanelHeaderActions } from '@/components/panels/PanelHeaderActions.tsx';
import { useProject } from '@/contexts/ProjectContext.tsx';
import { useTabsPersistence } from '@/hooks/useTabsPersistence.ts';
import { useMonacoGarbageCollector } from '@/hooks/editor/useMonacoGarbageCollector.ts';
import { lspManager } from '@/lsp/LSPClientManager';
import { useEffect } from 'react';
import { IdeSidebar } from '@/components/sidebar/IdeSidebar.tsx';

function App() {
    const { onReady } = useDockviewLogic();
    const { projectId } = useProject();

    usePreventKeyboardActions();
    useTabsPersistence(projectId);
    // Mounted at the IDE host (project route) rather than the Code panel, so its
    // teardown (closeAll + dispose models) fires only when leaving the IDE — not
    // when the Code panel itself is closed, which previously wiped every tab.
    useMonacoGarbageCollector();

    useEffect(() => {
        return () => lspManager.disposeAll();
    }, [projectId]);

    return (
        <div className="flex h-full w-full overflow-hidden bg-bg-dark">
            <IdeSidebar />
            <div className="min-w-0 flex-1">
                <DockviewReact
                    components={componentRegistry}
                    defaultTabComponent={CustomTabRenderer}
                    leftHeaderActionsComponent={PanelHeaderActions}
                    onReady={onReady}
                    className="dockview-theme-custom h-full w-full"
                />
            </div>

            <Toaster />
        </div>
    );
}

export default App;
