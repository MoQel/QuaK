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

function App() {
    const { onReady } = useDockviewLogic();
    const { projectId } = useProject();

    usePreventKeyboardActions();
    useTabsPersistence(projectId);
    // Mounted at the IDE host (project route) rather than the Code panel, so its
    // teardown (closeAll + dispose models) fires only when leaving the IDE — not
    // when the Code panel itself is closed, which previously wiped every tab.
    useMonacoGarbageCollector();

    return (
        <div className="h-full w-full">
            <DockviewReact
                components={componentRegistry}
                defaultTabComponent={CustomTabRenderer}
                leftHeaderActionsComponent={PanelHeaderActions}
                onReady={onReady}
                className="dockview-theme-custom h-full w-full"
            />

            <Toaster />
        </div>
    );
}

export default App;
