import { Toaster } from '@/components/ui/sonner';
import { usePreventKeyboardActions } from '@/hooks/usePreventKeyboardActions.ts';
import { DockviewReact } from 'dockview-react';
import { componentRegistry } from '@/components/panels/componentRegistry';
import { useDockviewLogic } from '@/hooks/useDockviewLogic';
import 'dockview-core/dist/styles/dockview.css';
import { CustomTabRenderer } from '@/components/panels/CustomTab.tsx';

function App() {
    const { onReady } = useDockviewLogic();

    usePreventKeyboardActions();

    return (
        <div className="h-full w-full">
            <DockviewReact
                components={componentRegistry}
                defaultTabComponent={CustomTabRenderer}
                onReady={onReady}
                className="dockview-theme-custom h-full w-full"
            />

            <Toaster />
        </div>
    );
}

export default App;
