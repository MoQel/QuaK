import { DockviewReact } from 'dockview-react';
import { PanelDataProvider } from '@/contexts/PanelContext';
import { componentRegistry } from '@/components/PanelRegistry';
import { useDockviewLogic } from '@/hooks/useDockviewLogic';
import 'dockview-core/dist/styles/dockview.css';
import { DockviewProvider } from '@/contexts/DockviewContext';

export const IdeLayout = () => {
    const { onReady } = useDockviewLogic();

    return (
        <PanelDataProvider>
            <DockviewProvider>
                <div className="flex-1 h-full w-full relative bg-background text-foreground">
                    <DockviewReact
                        components={componentRegistry}
                        onReady={onReady}
                        className="dockview-theme-custom h-full w-full"
                    />
                </div>
            </DockviewProvider>
        </PanelDataProvider>
    );
};
