import { DockviewReact } from 'dockview-react';
import { componentRegistry } from '@/components/panels/componentRegistry';
import { useDockviewLogic } from '@/hooks/useDockviewLogic';
import 'dockview-core/dist/styles/dockview.css';
import { CustomTabRenderer } from '@/components/panels/CustomTab.tsx';

export const IdeLayout = () => {
    const { onReady } = useDockviewLogic();

    return (
        <div className="flex-1 h-full w-full relative bg-bg-dark">
            <DockviewReact
                components={componentRegistry}
                defaultTabComponent={CustomTabRenderer}
                onReady={onReady}
                className="dockview-theme-custom h-full w-full"
            />
        </div>
    );
};
