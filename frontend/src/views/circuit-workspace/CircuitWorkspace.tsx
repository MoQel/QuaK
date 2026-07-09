import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { Button } from '@/components/ui/button.tsx';
import { usePanelData } from '@/contexts/panel/PanelDataContext.ts';
import { CircuitView } from '@/views/circuit-workspace/circuit/CircuitView.tsx';
import { LibraryView } from '@/views/circuit-workspace/library/LibraryView.tsx';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { CircuitDragProvider } from '@/views/circuit-workspace/CircuitDragContext.tsx';

const LIBRARY_DEFAULT_SIZE = 30;
const LIBRARY_MIN_SIZE = 20;
const LIBRARY_MAX_SIZE = 40;
const LIBRARY_VISIBILITY_STORAGE_KEY = 'circuit-workspace-library-collapsed';

function CircuitWorkspaceContent() {
    const { setSelectedOperation } = usePanelData();
    const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(
        () => localStorage.getItem(LIBRARY_VISIBILITY_STORAGE_KEY) === 'true',
    );

    const toggleLibrary = () => {
        setIsLibraryCollapsed((currentValue) => {
            const nextValue = !currentValue;
            localStorage.setItem(LIBRARY_VISIBILITY_STORAGE_KEY, String(nextValue));
            return nextValue;
        });
    };

    if (isLibraryCollapsed) {
        return (
            <div className="flex h-full min-h-0 w-full bg-bg-subtle">
                <aside className="flex w-12 shrink-0 justify-center border-r border-border pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleLibrary}
                        className="h-9 w-9"
                        title="Expand library"
                        aria-label="Expand library"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                </aside>

                <div className="min-w-0 flex-1">
                    <CircuitView />
                </div>
            </div>
        );
    }

    return (
        <ResizablePanelGroup
            autoSaveId="circuit-workspace-layout"
            direction="horizontal"
            className="relative min-h-0 bg-bg-subtle"
        >
            <ResizablePanel
                id="circuit-library"
                order={0}
                defaultSize={LIBRARY_DEFAULT_SIZE}
                minSize={LIBRARY_MIN_SIZE}
                maxSize={LIBRARY_MAX_SIZE}
                className="min-w-[200px] overflow-hidden"
            >
                <LibraryView onOperationSelect={setSelectedOperation} />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel id="circuit-editor" order={1} minSize={40} className="min-w-0">
                <CircuitView />
            </ResizablePanel>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleLibrary}
                className="absolute left-2 top-1 z-20 h-9 w-9"
                title="Collapse library"
                aria-label="Collapse library"
            >
                <PanelLeftClose className="h-4 w-4" />
            </Button>
        </ResizablePanelGroup>
    );
}

export function CircuitWorkspace() {
    return (
        <CircuitDragProvider>
            <CircuitWorkspaceContent />
        </CircuitDragProvider>
    );
}
